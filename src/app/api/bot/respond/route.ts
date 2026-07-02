import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { classifyMessage } from "@/lib/ai/classify";
import { extractOrder, type MenuItem, type OrderItem } from "@/lib/ai/extract-order";
import { sendMessage as waSendMessage } from "@/lib/whatsapp/send";

const anthropic = new Anthropic();

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface RequestBody {
  restaurant_id: string;
  conversation_id?: string;
  phone_number_id?: string;
  customer_phone: string;
  customer_name?: string;
  message: string;
  message_type: string;
}

interface OrderDraft {
  items: OrderItem[];
  total: number;
}

interface ZoneDraft {
  nom_zone: string;
  frais: number;
  quartier_client: string;
}

type BotEtat = "attente_type_livraison" | "attente_quartier" | "attente_confirmation";

interface ConversationMeta {
  commande_draft?: OrderDraft;
  etat?: BotEtat;
  zone_draft?: ZoneDraft;
  sur_place?: boolean;
  historique?: HistoryEntry[];
  // backward-compat avec l'ancien format
  attente_quartier?: boolean;
  attente_confirmation?: boolean;
}

interface DeliveryZone {
  id: string;
  nom_zone: string;
  quartiers: string[];
  frais: number;
}

interface HistoryEntry {
  role: "client" | "bot";
  text: string;
  at: string;
}

interface Restaurant {
  name: string;
  address?: string;
  phone?: string;
  opening_hours?: Record<string, string>;
  statut_abonnement: string;
  created_at: string;
  plan?: string;
  ton_reponse?: string;
  message_accueil?: string;
}

// ------------------------------------------------------------------
// POST — Orchestrateur central
// ------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.META_ACCESS_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as RequestBody;
  const { restaurant_id, customer_phone, customer_name = "Client", message } = body;

  // ── Chargement COMPLET depuis Supabase — jamais de cache, jamais de données inventées ──

  const [restaurantRes, menuRes, zonesRes] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select(
        "name, address, phone, opening_hours, statut_abonnement, created_at, plan, ton_reponse, message_accueil"
      )
      .eq("id", restaurant_id)
      .single(),
    supabaseAdmin
      .from("menu_items")
      .select("id, name, price, category, is_available")
      .eq("restaurant_id", restaurant_id)
      .order("category")
      .order("name"),
    supabaseAdmin
      .from("zones_livraison")
      .select("id, nom_zone, quartiers, frais")
      .eq("restaurant_id", restaurant_id)
      .eq("actif", true),
  ]);

  const restaurant = restaurantRes.data as Restaurant | null;
  const allMenuItems = (menuRes.data ?? []) as MenuItem[];
  const zones = (zonesRes.data ?? []) as DeliveryZone[];

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // ── Vérification abonnement ──

  const SUSPENDED_MSG =
    "Ce service est temporairement indisponible. Veuillez contacter le restaurant directement.";

  if (restaurant.statut_abonnement === "trial") {
    const trialExpiry = new Date(restaurant.created_at);
    trialExpiry.setDate(trialExpiry.getDate() + 7);
    if (new Date() > trialExpiry) {
      await supabaseAdmin
        .from("restaurants")
        .update({ statut_abonnement: "suspendu" })
        .eq("id", restaurant_id);
      await waSendMessage(customer_phone, SUSPENDED_MSG, restaurant_id);
      return NextResponse.json({ ok: true });
    }
  }

  if (restaurant.statut_abonnement === "suspendu") {
    await waSendMessage(customer_phone, SUSPENDED_MSG, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ── Limite Plan Starter (200 commandes/mois) ──

  if (restaurant.plan === "starter") {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();
    const { count: monthlyCount } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurant_id)
      .gte("created_at", startOfMonth);
    if ((monthlyCount ?? 0) >= 200) {
      await waSendMessage(
        customer_phone,
        "Notre service de commande en ligne est temporairement indisponible. Appelez-nous directement.",
        restaurant_id
      );
      return NextResponse.json({ ok: true });
    }
  }

  // ── Conversation ──

  const { data: existingConv } = await supabaseAdmin
    .from("conversations")
    .select("id, metadata")
    .eq("restaurant_id", restaurant_id)
    .eq("customer_phone", customer_phone)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationData: { id: string; metadata: unknown } | null = existingConv;

  if (!conversationData) {
    const { data: newConv, error: createError } = await supabaseAdmin
      .from("conversations")
      .insert({
        restaurant_id,
        customer_phone,
        customer_name,
        channel: "whatsapp",
        status: "open",
        metadata: { historique: [] },
      })
      .select("id, metadata")
      .single();

    if (createError || !newConv) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }
    conversationData = newConv;
  }

  const conversation = conversationData!;
  const meta: ConversationMeta = (conversation.metadata as ConversationMeta) ?? {};
  const historique = meta.historique ?? [];

  // Migration format legacy (anciens boolean) → nouveau etat enum
  if (!meta.etat && meta.commande_draft) {
    if (meta.attente_confirmation) meta.etat = "attente_confirmation";
    else if (meta.attente_quartier) meta.etat = "attente_quartier";
  }

  // ── Horaires d'ouverture (fuseau UTC+0 = Bamako) ──

  const hoursResult = checkOpeningHours(restaurant.opening_hours ?? null, restaurant.name);
  if (!hoursResult.open) {
    await saveExchange(conversation.id, meta, message, hoursResult.closedMessage);
    await waSendMessage(customer_phone, hoursResult.closedMessage, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // Seuls les plats disponibles sont mentionnés au client — jamais les autres
  const availableItems = allMenuItems.filter((m) => m.is_available);

  const horaires =
    restaurant.opening_hours && Object.keys(restaurant.opening_hours).length > 0
      ? JSON.stringify(restaurant.opening_hours)
      : "Non renseigné";

  // ==================================================================
  // ÉTAPE 0 — Premier contact : message_accueil + menu complet
  // ==================================================================

  if (historique.length === 0) {
    const welcomeBase =
      restaurant.message_accueil?.trim() ||
      `Bienvenue chez ${restaurant.name} ! Comment puis-je vous aider ?`;

    const reply = `${welcomeBase}\n\n${formatMenuFull(availableItems)}`;
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ==================================================================
  // MACHINE D'ÉTATS
  // ==================================================================

  // ── ÉTAT : attente_confirmation — client répond OUI ou NON ──
  if (meta.etat === "attente_confirmation" && meta.commande_draft) {
    if (isConfirmation(message)) {
      const delivery = meta.zone_draft
        ? {
            zone_livraison: meta.zone_draft.nom_zone,
            frais_livraison: meta.zone_draft.frais,
            quartier_client: meta.zone_draft.quartier_client,
          }
        : null;

      const reply = await doCreateOrder(
        meta.commande_draft,
        restaurant_id,
        conversation.id,
        customer_name,
        customer_phone,
        delivery,
        meta.sur_place ?? false
      );
      await clearDraft(conversation.id, meta);
      await saveExchange(conversation.id, meta, message, reply);
      await waSendMessage(customer_phone, reply, restaurant_id);
      return NextResponse.json({ ok: true });
    }

    if (isRejection(message)) {
      await clearDraft(conversation.id, meta);
      const reply =
        "Commande annulée. N'hésitez pas à recommander quand vous voulez !";
      await saveExchange(conversation.id, meta, message, reply);
      await waSendMessage(customer_phone, reply, restaurant_id);
      return NextResponse.json({ ok: true });
    }

    // Peut-être une modification de commande avant confirmation
    if (containsMenuItem(message, availableItems)) {
      const result = await extractOrder(message, availableItems);
      if (result.items && result.items.length > 0) {
        const newDraft: OrderDraft = {
          items: result.items,
          total: computeTotal(result.items),
        };
        meta.commande_draft = newDraft;
        meta.etat = "attente_type_livraison";
        delete meta.zone_draft;
        delete meta.sur_place;
        await saveMeta(conversation.id, meta);

        const itemsText = newDraft.items
          .map((it) => `- ${it.quantite}x ${it.nom}`)
          .join("\n");
        const reply =
          `J'ai mis à jour votre commande :\n${itemsText}\n\n` +
          (zones.length > 0
            ? "Souhaitez-vous être livré ou récupérer votre commande sur place ?"
            : buildSummaryNoDelivery(newDraft));
        await saveExchange(conversation.id, meta, message, reply);
        await waSendMessage(customer_phone, reply, restaurant_id);
        return NextResponse.json({ ok: true });
      }
    }

    const reply =
      "Répondez *OUI* pour confirmer votre commande ou *NON* pour l'annuler.";
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ── ÉTAT : attente_quartier — client donne son quartier de livraison ──
  if (meta.etat === "attente_quartier" && meta.commande_draft) {
    const quartierInput = message.trim();
    const match = findDeliveryZone(quartierInput, zones);

    if (!match) {
      const zonesList =
        zones.length > 0
          ? zones
              .map((z) => `- ${z.nom_zone} : ${z.frais.toLocaleString("fr-FR")} FCFA`)
              .join("\n")
          : "Aucune zone configurée.";

      const reply =
        `Désolé, nous ne livrons pas encore dans ce quartier.\n\n` +
        `Voici nos zones de livraison disponibles :\n${zonesList}\n\n` +
        `Vous pouvez aussi récupérer votre commande *sur place*. Que préférez-vous ?`;

      await saveExchange(conversation.id, meta, message, reply);
      await waSendMessage(customer_phone, reply, restaurant_id);
      return NextResponse.json({ ok: true });
    }

    meta.etat = "attente_confirmation";
    meta.zone_draft = {
      nom_zone: match.nom_zone,
      frais: match.frais,
      quartier_client: quartierInput,
    };
    await saveMeta(conversation.id, meta);

    const reply = buildSummaryWithDelivery(
      meta.commande_draft,
      match.nom_zone,
      match.frais
    );
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ── ÉTAT : attente_type_livraison — livraison ou sur place ? ──
  if (meta.etat === "attente_type_livraison" && meta.commande_draft) {
    const lower = message.toLowerCase();
    const wantsDelivery = /livr|chez moi|à domicile|a domicile|domicile/.test(lower);
    const wantsPickup =
      /sur place|à emporter|a emporter|emporter|récup|recup|venir chercher|je passe|je viens/.test(lower);

    if (wantsPickup) {
      meta.etat = "attente_confirmation";
      meta.sur_place = true;
      delete meta.zone_draft;
      await saveMeta(conversation.id, meta);

      const reply = buildSummaryNoDelivery(meta.commande_draft);
      await saveExchange(conversation.id, meta, message, reply);
      await waSendMessage(customer_phone, reply, restaurant_id);
      return NextResponse.json({ ok: true });
    }

    if (wantsDelivery) {
      meta.etat = "attente_quartier";
      meta.sur_place = false;
      await saveMeta(conversation.id, meta);

      const reply = "Dans quel quartier souhaitez-vous être livré ?";
      await saveExchange(conversation.id, meta, message, reply);
      await waSendMessage(customer_phone, reply, restaurant_id);
      return NextResponse.json({ ok: true });
    }

    // Message ambigu — reprompt
    const reply =
      "Souhaitez-vous être *livré* à domicile ou récupérer votre commande *sur place* ?";
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ==================================================================
  // PAS D'ÉTAT ACTIF — Classification libre
  // ==================================================================

  // Annulation d'un draft orphelin
  if (meta.commande_draft && isRejection(message)) {
    await clearDraft(conversation.id, meta);
    const reply =
      "Commande annulée. N'hésitez pas à recommander quand vous voulez !";
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // Demande de menu explicite
  if (/\bmenu\b|que proposez|votre carte|vos plats|qu['']avez.vous|qu['']est.ce que vous avez/i.test(message)) {
    const reply = formatMenuFull(availableItems);
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // FAQ par mots-clés configurés (zéro IA)
  const { data: faqItems } = await supabaseAdmin
    .from("faq_items")
    .select("answer, keywords")
    .eq("restaurant_id", restaurant_id)
    .eq("is_published", true);

  const msgLower = message.toLowerCase();
  const faqKwMatch = (faqItems ?? []).find((faq) => {
    const kws = (faq.keywords as string[] | null) ?? [];
    return (
      kws.length > 0 &&
      kws.some((kw) => msgLower.includes(kw.toLowerCase().trim()))
    );
  });

  if (faqKwMatch) {
    const reply = faqKwMatch.answer as string;
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // Classification IA (Haiku — rapide et économique)
  const menuText = availableItems
    .map((m) => `${m.name} — ${m.price} FCFA`)
    .join(", ");

  const intent = await classifyMessage(message, {
    name: restaurant.name,
    menu: menuText,
    horaires,
  });

  let reply: string;

  switch (intent) {
    case "commande": {
      const result = await extractOrder(message, availableItems);

      if (!result.items || result.items.length === 0) {
        // L'IA n'a pas trouvé de plats valides — afficher le menu
        reply =
          result.message_confirmation +
          "\n\n" +
          formatMenuFull(availableItems);
        break;
      }

      const draft: OrderDraft = {
        items: result.items,
        total: computeTotal(result.items),
      };

      meta.commande_draft = draft;

      if (zones.length > 0) {
        // Demander livraison ou sur place (étape 2)
        meta.etat = "attente_type_livraison";
        await saveMeta(conversation.id, meta);

        const itemsText = draft.items
          .map((it) => `- ${it.quantite}x ${it.nom}`)
          .join("\n");

        reply =
          `J'ai bien noté :\n${itemsText}\n\n` +
          `Souhaitez-vous être *livré* à domicile ou récupérer sur *place* ?`;
      } else {
        // Pas de livraison configurée → résumé direct sur place
        meta.etat = "attente_confirmation";
        meta.sur_place = true;
        await saveMeta(conversation.id, meta);
        reply = buildSummaryNoDelivery(draft);
      }
      break;
    }

    case "faq":
      reply = await handleFaq(
        message,
        restaurant_id,
        restaurant.name,
        horaires,
        restaurant.address ?? "",
        availableItems,
        restaurant.ton_reponse
      );
      break;

    case "hors_cadre":
      reply = await handleHorsCadre(
        restaurant_id,
        conversation.id,
        customer_name,
        customer_phone,
        message
      );
      break;

    default:
      reply = formatMenuFull(availableItems);
  }

  await saveExchange(conversation.id, meta, message, reply);
  await waSendMessage(customer_phone, reply, restaurant_id);
  return NextResponse.json({ ok: true });
}

// ==================================================================
// RÉSUMÉS — 100 % TypeScript, zéro IA, zéro approximation
// ==================================================================

function computeTotal(items: OrderItem[]): number {
  return items.reduce((sum, it) => sum + it.prix_unitaire * it.quantite, 0);
}

function buildSummaryWithDelivery(
  draft: OrderDraft,
  nomZone: string,
  frais: number
): string {
  const lines = draft.items
    .map(
      (it) =>
        `- ${it.quantite}x ${it.nom} : ${(it.quantite * it.prix_unitaire).toLocaleString("fr-FR")} FCFA`
    )
    .join("\n");

  const sousTotal = draft.total;
  const total = sousTotal + frais;

  return (
    `Voici votre commande :\n\n` +
    `${lines}\n\n` +
    `Sous-total : ${sousTotal.toLocaleString("fr-FR")} FCFA\n` +
    `Livraison ${nomZone} : ${frais.toLocaleString("fr-FR")} FCFA\n` +
    `──────────────────\n` +
    `TOTAL : ${total.toLocaleString("fr-FR")} FCFA\n\n` +
    `Paiement en espèces à la livraison.\n` +
    `Confirmez-vous ? Répondez *OUI* pour valider.`
  );
}

function buildSummaryNoDelivery(draft: OrderDraft): string {
  const lines = draft.items
    .map(
      (it) =>
        `- ${it.quantite}x ${it.nom} : ${(it.quantite * it.prix_unitaire).toLocaleString("fr-FR")} FCFA`
    )
    .join("\n");

  const total = draft.total;

  return (
    `Voici votre commande :\n\n` +
    `${lines}\n\n` +
    `──────────────────\n` +
    `TOTAL : ${total.toLocaleString("fr-FR")} FCFA\n\n` +
    `Paiement sur place.\n` +
    `Confirmez-vous ? Répondez *OUI* pour valider.`
  );
}

// ==================================================================
// MENU FORMATÉ — catégories en majuscules, prix exacts DB
// ==================================================================

function formatMenuFull(items: MenuItem[]): string {
  if (!items.length) {
    return "Notre menu est en cours de mise à jour. Revenez bientôt !";
  }

  const byCategory: Record<string, MenuItem[]> = {};
  for (const item of items) {
    const cat = (item.category ?? "Plats").toUpperCase();
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  let text = "Voici notre menu :\n\n";
  for (const [cat, catItems] of Object.entries(byCategory)) {
    text += `${cat}\n`;
    for (const item of catItems) {
      text += `- ${item.name} — ${Number(item.price).toLocaleString("fr-FR")} FCFA\n`;
    }
    text += "\n";
  }
  text += "Que souhaitez-vous commander ?";
  return text.trim();
}

// ==================================================================
// CRÉATION DE COMMANDE
// ==================================================================

async function doCreateOrder(
  draft: OrderDraft,
  restaurantId: string,
  conversationId: string,
  customerName: string,
  customerPhone: string,
  delivery: {
    zone_livraison: string;
    frais_livraison: number;
    quartier_client: string;
  } | null,
  surPlace: boolean
): Promise<string> {
  const fraisLivraison = delivery?.frais_livraison ?? 0;
  const totalFinal = draft.total + fraisLivraison;

  await supabaseAdmin.from("orders").insert({
    restaurant_id: restaurantId,
    conversation_id: conversationId,
    customer_name: customerName,
    customer_phone: customerPhone,
    items: draft.items,
    total: totalFinal,
    status: "en_preparation",
    mode_paiement: "especes",
    frais_livraison: fraisLivraison,
    zone_livraison: delivery?.zone_livraison ?? null,
    adresse_livraison: delivery?.quartier_client ?? null,
  });

  const livraisonLabel = delivery
    ? `livraison — ${fraisLivraison.toLocaleString("fr-FR")} FCFA de frais`
    : "retrait sur place";

  await notifyManager(
    restaurantId,
    customerName,
    customerPhone,
    `Nouvelle commande — ${totalFinal.toLocaleString("fr-FR")} FCFA — espèces — ${livraisonLabel}`
  );

  if (surPlace) {
    return (
      `Commande confirmée ! Votre commande est en préparation.\n` +
      `Vous pouvez passer la récupérer sous peu.\n\n` +
      `Total : ${totalFinal.toLocaleString("fr-FR")} FCFA\n\n` +
      `Merci de votre confiance !`
    );
  }

  return (
    `Commande confirmée ! Notre livreur sera chez vous dans 30 à 45 minutes.\n` +
    `Paiement en espèces à la livraison.\n\n` +
    `Total : ${totalFinal.toLocaleString("fr-FR")} FCFA\n\n` +
    `Merci de votre confiance !`
  );
}

// ==================================================================
// FAQ (Claude Haiku — uniquement pour les questions hors mots-clés)
// ==================================================================

async function handleFaq(
  message: string,
  restaurantId: string,
  restaurantName: string,
  horaires: string,
  address: string,
  menuItems: MenuItem[],
  tonReponse?: string
): Promise<string> {
  const { data: faqs } = await supabaseAdmin
    .from("faq_items")
    .select("question, answer")
    .eq("restaurant_id", restaurantId)
    .eq("is_published", true);

  const menuFormatted = formatMenuFull(menuItems);
  const faqText =
    faqs && faqs.length > 0
      ? faqs.map((f) => `Q: ${f.question}\nR: ${f.answer}`).join("\n\n")
      : "";
  const tonInstruction = tonReponse
    ? `\nTon de réponse à adopter : ${tonReponse}`
    : "";

  const system =
    `Tu es l'assistant du restaurant "${restaurantName}".` +
    `${tonInstruction}\n\n` +
    `Réponds UNIQUEMENT à partir des informations ci-dessous — ne jamais inventer de plat, de prix, d'horaire ou d'adresse.\n\n` +
    (faqText ? `FAQ :\n${faqText}\n\n` : "") +
    `${menuFormatted}\n\n` +
    `Adresse : ${address || "Non renseignée"}\n` +
    `Horaires : ${horaires}\n\n` +
    `Réponds en français, de manière concise et chaleureuse. Si l'information n'est pas dans ce contexte, dis-le honnêtement.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system,
    messages: [{ role: "user", content: message }],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Désolé, je n'ai pas pu répondre à votre question. Appelez-nous directement !";
}

// ==================================================================
// HORS CADRE — transfert au gérant
// ==================================================================

async function handleHorsCadre(
  restaurantId: string,
  conversationId: string,
  customerName: string,
  customerPhone: string,
  message: string
): Promise<string> {
  await supabaseAdmin
    .from("conversations")
    .update({ status: "open" })
    .eq("id", conversationId);

  const { data: resto } = await supabaseAdmin
    .from("restaurants")
    .select("phone")
    .eq("id", restaurantId)
    .single();

  if (resto?.phone) {
    await waSendMessage(
      resto.phone as string,
      `Un client a besoin de vous !\n\nNuméro client : ${customerPhone}\n\nMessage : ${message}\n\nRépondez directement à ce numéro.`,
      restaurantId
    );
  }

  await notifyManager(restaurantId, customerName, customerPhone, message);

  return "Je transmets votre message à notre équipe. Un membre de notre staff va vous répondre dans quelques minutes. Merci de votre patience.";
}

// ==================================================================
// UTILITAIRES
// ==================================================================

function findDeliveryZone(
  quartier: string,
  zones: DeliveryZone[]
): DeliveryZone | null {
  const input = quartier.toLowerCase().trim();
  for (const zone of zones) {
    const zoneMatch =
      zone.nom_zone.toLowerCase().includes(input) ||
      input.includes(zone.nom_zone.toLowerCase());
    const quartierMatch = zone.quartiers.some(
      (q) => input.includes(q.toLowerCase()) || q.toLowerCase().includes(input)
    );
    if (zoneMatch || quartierMatch) return zone;
  }
  return null;
}

function isConfirmation(msg: string): boolean {
  const lower = msg.toLowerCase().trim();
  return /\b(oui|ok|d'?accord|daccord|confirme?|c'?est bon|cest bon|go|parfait|valide?|yes|awa|ouais)\b/.test(
    lower
  );
}

function isRejection(msg: string): boolean {
  const lower = msg.toLowerCase().trim();
  return /\b(non|annule|annuler|j'?annule|pas ça|laisse tomber|stop|arr[eê]te|ayi|cancel|non merci)\b/.test(
    lower
  );
}

function containsMenuItem(message: string, menuItems: MenuItem[]): boolean {
  const msgLower = message.toLowerCase();
  return menuItems.some(
    (item) => item.name.length > 3 && msgLower.includes(item.name.toLowerCase())
  );
}

async function saveExchange(
  conversationId: string,
  meta: ConversationMeta,
  clientMsg: string,
  botReply: string
) {
  const historique = meta.historique ?? [];
  const now = new Date().toISOString();
  historique.push(
    { role: "client", text: clientMsg, at: now },
    { role: "bot", text: botReply, at: now }
  );
  if (historique.length > 60) historique.splice(0, historique.length - 60);
  meta.historique = historique;
  await supabaseAdmin
    .from("conversations")
    .update({ metadata: meta })
    .eq("id", conversationId);
}

async function saveMeta(conversationId: string, meta: ConversationMeta) {
  await supabaseAdmin
    .from("conversations")
    .update({ metadata: meta })
    .eq("id", conversationId);
}

async function clearDraft(conversationId: string, meta: ConversationMeta) {
  delete meta.commande_draft;
  delete meta.etat;
  delete meta.zone_draft;
  delete meta.sur_place;
  delete meta.attente_quartier;
  delete meta.attente_confirmation;
  await saveMeta(conversationId, meta);
}

// ==================================================================
// HORAIRES (UTC+0 = Bamako)
// ==================================================================

const DAYS_FR = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
];

function slotOpenTime(slot: string): string {
  return slot.split("-")[0].trim();
}

function parseSlotMinutes(
  slot: string
): { openMin: number; closeMin: number } | null {
  const parts = slot.split("-");
  if (parts.length !== 2) return null;
  const [oh, om] = parts[0].trim().split(":").map(Number);
  const [ch, cm] = parts[1].trim().split(":").map(Number);
  if ([oh, om, ch, cm].some(isNaN)) return null;
  return { openMin: oh * 60 + om, closeMin: ch * 60 + cm };
}

function checkOpeningHours(
  openingHours: Record<string, string> | null,
  restaurantName: string
): { open: true } | { open: false; closedMessage: string } {
  if (!openingHours || Object.keys(openingHours).length === 0) {
    return { open: true };
  }

  const now = new Date();
  const utcDay = now.getUTCDay();
  const currentDay = DAYS_FR[utcDay];
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const todaySlot = openingHours[currentDay];
  if (todaySlot) {
    const parsed = parseSlotMinutes(todaySlot);
    if (parsed) {
      if (currentMinutes >= parsed.openMin && currentMinutes < parsed.closeMin) {
        return { open: true };
      }
      if (currentMinutes < parsed.openMin) {
        return {
          open: false,
          closedMessage:
            `Bonjour ! ${restaurantName} est actuellement fermé. ` +
            `Nous ouvrons aujourd'hui à ${slotOpenTime(todaySlot)}. ` +
            `Vous pouvez déjà nous envoyer votre commande et nous la traiterons dès l'ouverture.`,
        };
      }
    }
  }

  for (let i = 1; i <= 7; i++) {
    const nextDay = DAYS_FR[(utcDay + i) % 7];
    const nextSlot = openingHours[nextDay];
    if (nextSlot && parseSlotMinutes(nextSlot)) {
      const dayLabel = i === 1 ? "demain" : nextDay;
      return {
        open: false,
        closedMessage:
          `Bonjour ! ${restaurantName} est actuellement fermé. ` +
          `Nous ouvrons ${dayLabel} à ${slotOpenTime(nextSlot)}. ` +
          `Vous pouvez déjà nous envoyer votre commande et nous la traiterons dès l'ouverture.`,
      };
    }
  }

  return {
    open: false,
    closedMessage:
      `Bonjour ! ${restaurantName} est actuellement fermé. ` +
      `Vous pouvez déjà nous envoyer votre commande et nous la traiterons dès notre ouverture.`,
  };
}

// ==================================================================
// NOTIFICATION GÉRANT
// ==================================================================

async function notifyManager(
  restaurantId: string,
  customerName: string,
  customerPhone: string,
  message: string
) {
  const { data: owners } = await supabaseAdmin
    .from("restaurant_users")
    .select("user_id")
    .eq("restaurant_id", restaurantId)
    .in("role", ["owner", "manager"]);

  if (!owners?.length) return;

  await supabaseAdmin.from("conversations").insert({
    restaurant_id: restaurantId,
    customer_name: "Système",
    customer_phone: "system",
    channel: "web",
    status: "open",
    metadata: {
      type: "notification",
      from_name: customerName,
      from_phone: customerPhone,
      original_message: message,
      notified_users: owners.map((o) => o.user_id),
    },
  });
}
