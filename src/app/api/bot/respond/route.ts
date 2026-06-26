import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { classifyMessage } from "@/lib/ai/classify";
import {
  extractOrder,
  type MenuItem,
  type ExtractedOrder,
} from "@/lib/ai/extract-order";
import {
  sendMessage as waSendMessage,
  sendConfirmation as waSendConfirmation,
} from "@/lib/whatsapp/send";

const anthropic = new Anthropic();

// ------------------------------------------------------------------
// Types internes
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

interface ConversationMeta {
  commande_draft?: ExtractedOrder;
  attente_paiement?: boolean;
  attente_quartier?: boolean;
  mode_paiement_choisi?: "mobile_money" | "especes";
  historique?: HistoryEntry[];
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

// ------------------------------------------------------------------
// POST — Orchestrateur central
// ------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.META_ACCESS_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as RequestBody;
  const {
    restaurant_id,
    customer_phone,
    customer_name = "Client",
    message,
  } = body;

  // ----- Charger restaurant + menu en parallèle -----

  const [restaurantRes, menuRes] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select("name, address, phone, opening_hours, social_links")
      .eq("id", restaurant_id)
      .single(),
    supabaseAdmin
      .from("menu_items")
      .select("id, name, price, category, is_available")
      .eq("restaurant_id", restaurant_id)
      .eq("is_available", true),
  ]);

  const restaurant = restaurantRes.data;
  const menuItems = (menuRes.data ?? []) as MenuItem[];

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // ----- Trouver ou créer la conversation -----

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

  const meta: ConversationMeta =
    (conversation.metadata as ConversationMeta) ?? {};
  const historique: HistoryEntry[] = meta.historique ?? [];

  const horaires =
    typeof restaurant.opening_hours === "object"
      ? JSON.stringify(restaurant.opening_hours)
      : String(restaurant.opening_hours ?? "Non renseigné");

  const menuText = menuItems
    .map((m) => `${m.name} (${m.category}) — ${m.price} FCFA`)
    .join(", ");

  // ----- Vérification des horaires d'ouverture -----

  const hoursResult = checkOpeningHours(
    restaurant.opening_hours as Record<string, string> | null
  );
  if (!hoursResult.open) {
    await saveExchange(conversation.id, meta, message, hoursResult.closedMessage);
    await waSendMessage(customer_phone, hoursResult.closedMessage, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ----- Étape 4 : réponse quartier (livraison) -----

  if (meta.commande_draft && meta.attente_quartier) {
    const quartier = message.trim();
    const reply = await handleQuartier(
      quartier,
      meta.commande_draft,
      meta.mode_paiement_choisi ?? "especes",
      restaurant_id,
      conversation.id,
      customer_name,
      customer_phone,
      meta
    );
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ----- Étape 3 : choix du mode de paiement -----

  if (meta.commande_draft && meta.attente_paiement) {
    const mode = detectPaymentMode(message);

    if (mode === "mobile_money") {
      meta.attente_paiement = false;
      meta.attente_quartier = true;
      meta.mode_paiement_choisi = "mobile_money";
      await saveMeta(conversation.id, meta);
      const reply =
        "Dans quel quartier souhaitez-vous être livré ?\n\n" +
        "Envoyez le nom de votre quartier (ex: Hamdallaye, Badalabougou, ACI 2000...)";
      await saveExchange(conversation.id, meta, message, reply);
      await waSendMessage(customer_phone, reply, restaurant_id);
      return NextResponse.json({ ok: true });
    }

    if (mode === "especes_livraison") {
      meta.attente_paiement = false;
      meta.attente_quartier = true;
      meta.mode_paiement_choisi = "especes";
      await saveMeta(conversation.id, meta);
      const reply =
        "Dans quel quartier souhaitez-vous être livré ?\n\n" +
        "Envoyez le nom de votre quartier (ex: Hamdallaye, Badalabougou, ACI 2000...)";
      await saveExchange(conversation.id, meta, message, reply);
      await waSendMessage(customer_phone, reply, restaurant_id);
      return NextResponse.json({ ok: true });
    }

    if (mode === "especes_surplace") {
      const reply = await createOrder(
        meta.commande_draft,
        restaurant_id,
        conversation.id,
        customer_name,
        customer_phone,
        "especes",
        null
      );
      await clearDraft(conversation.id, meta);
      await saveExchange(conversation.id, meta, message, reply);
      await waSendMessage(customer_phone, reply, restaurant_id);
      return NextResponse.json({ ok: true });
    }

    const reply =
      "Veuillez choisir votre mode de paiement :\n\n" +
      "1️⃣ Orange Money ou Wave (livraison)\n" +
      "2️⃣ Espèces à la livraison\n" +
      "3️⃣ Espèces sur place";
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ----- Étape 2 : confirmation ou annulation du draft -----

  if (meta.commande_draft && isConfirmation(message)) {
    meta.attente_paiement = true;
    await saveMeta(conversation.id, meta);

    const reply =
      "✅ Commande confirmée ! Comment souhaitez-vous payer ?\n\n" +
      "1️⃣ Orange Money ou Wave (livraison)\n" +
      "2️⃣ Espèces à la livraison\n" +
      "3️⃣ Espèces sur place";
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  if (meta.commande_draft && isRejection(message)) {
    await clearDraft(conversation.id, meta);
    const reply =
      "Pas de souci ! Votre commande a été annulée. N'hésitez pas à repasser commande quand vous voulez 😊";
    await saveExchange(conversation.id, meta, message, reply);
    await waSendMessage(customer_phone, reply, restaurant_id);
    return NextResponse.json({ ok: true });
  }

  // ----- Classifier le message -----

  const intent = await classifyMessage(message, {
    name: restaurant.name,
    menu: menuText,
    horaires,
  });

  let reply: string;

  switch (intent) {
    case "faq":
      reply = await handleFaq(
        message,
        restaurant_id,
        restaurant.name,
        horaires,
        restaurant.address ?? ""
      );
      break;

    case "commande": {
      const result = await handleCommande(message, menuItems, conversation.id, meta);
      if (result.hasItems) {
        await saveExchange(conversation.id, meta, message, result.reply);
        await waSendConfirmation(
          customer_phone,
          result.reply,
          result.total,
          restaurant_id
        );
        return NextResponse.json({ ok: true });
      }
      reply = result.reply;
      break;
    }

    case "hors_cadre":
      reply = await handleHorsCadre(
        restaurant_id,
        conversation.id,
        customer_name,
        customer_phone,
        message
      );
      break;
  }

  await saveExchange(conversation.id, meta, message, reply);
  await waSendMessage(customer_phone, reply, restaurant_id);

  return NextResponse.json({ ok: true });
}

// ------------------------------------------------------------------
// Handlers par intention
// ------------------------------------------------------------------

async function handleFaq(
  message: string,
  restaurantId: string,
  restaurantName: string,
  horaires: string,
  address: string
): Promise<string> {
  const { data: faqs } = await supabaseAdmin
    .from("faq_items")
    .select("question, answer")
    .eq("restaurant_id", restaurantId)
    .eq("is_published", true);

  if (faqs && faqs.length > 0) {
    const faqText = faqs
      .map((f) => `Q: ${f.question}\nR: ${f.answer}`)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: `Tu es l'assistant du restaurant "${restaurantName}" à Bamako.
Réponds à la question du client en te basant sur ces informations :

FAQ :
${faqText}

Infos :
- Adresse : ${address || "Non renseignée"}
- Horaires : ${horaires}

Réponds en français, de manière chaleureuse et concise. Si tu ne trouves pas la réponse dans la FAQ, utilise les infos du restaurant.`,
      messages: [{ role: "user", content: message }],
    });

    return response.content[0].type === "text"
      ? response.content[0].text
      : "Désolé, je n'ai pas pu répondre à votre question.";
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: `Tu es l'assistant du restaurant "${restaurantName}" à Bamako.
Infos disponibles :
- Adresse : ${address || "Non renseignée"}
- Horaires : ${horaires}

Réponds à la question du client en français, de manière chaleureuse et concise. Si tu ne connais pas la réponse, dis-le poliment et invite le client à appeler le restaurant.`,
    messages: [{ role: "user", content: message }],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Désolé, je n'ai pas pu répondre à votre question. Appelez-nous directement !";
}

async function handleCommande(
  message: string,
  menuItems: MenuItem[],
  conversationId: string,
  meta: ConversationMeta
): Promise<{ reply: string; hasItems: boolean; total: number }> {
  const result = await extractOrder(message, menuItems);

  if (!result.items) {
    return { reply: result.message_confirmation, hasItems: false, total: 0 };
  }

  meta.commande_draft = result;
  await supabaseAdmin
    .from("conversations")
    .update({ metadata: meta })
    .eq("id", conversationId);

  return {
    reply: result.message_confirmation,
    hasItems: true,
    total: result.total,
  };
}

interface DeliveryInfo {
  zone_livraison: string;
  frais_livraison: number;
  adresse_livraison: string;
}

async function createOrder(
  draft: ExtractedOrder,
  restaurantId: string,
  conversationId: string,
  customerName: string,
  customerPhone: string,
  modePaiement: "mobile_money" | "especes",
  delivery: DeliveryInfo | null
): Promise<string> {
  const fraisLivraison = delivery?.frais_livraison ?? 0;
  const totalFinal = draft.total + fraisLivraison;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      conversation_id: conversationId,
      customer_name: customerName,
      customer_phone: customerPhone,
      items: draft.items,
      total: totalFinal,
      status: "preparing",
      mode_paiement: modePaiement,
      frais_livraison: fraisLivraison,
      zone_livraison: delivery?.zone_livraison ?? null,
      adresse_livraison: delivery?.adresse_livraison ?? null,
    })
    .select("id")
    .single();

  const paiementLabel =
    modePaiement === "especes" ? "espèces" : "mobile money";
  const livraisonLabel = delivery
    ? `Livraison à ${delivery.adresse_livraison} (${fraisLivraison.toLocaleString("fr-FR")} FCFA)`
    : "Retrait sur place";

  await notifyManager(
    restaurantId,
    customerName,
    customerPhone,
    `🆕 Commande #${order?.id?.slice(0, 8)} — ${totalFinal.toLocaleString("fr-FR")} FCFA — ${paiementLabel} — ${livraisonLabel}`
  );

  if (modePaiement === "especes") {
    let reply = "Parfait ! Votre commande est en préparation.";
    if (delivery) {
      reply +=
        ` Paiement à la livraison 🛵\n\n` +
        `📍 Livraison à ${delivery.adresse_livraison}\n` +
        `🚚 Frais de livraison : ${fraisLivraison.toLocaleString("fr-FR")} FCFA\n` +
        `💰 Total final : ${totalFinal.toLocaleString("fr-FR")} FCFA`;
    } else {
      reply += " Paiement au comptoir. À très bientôt !";
    }
    return reply;
  }

  // TODO: intégrer Geniuspay pour générer le lien de paiement
  return (
    "Merci ! Votre commande est enregistrée.\n\n" +
    "Le lien de paiement mobile money sera bientôt disponible, " +
    "nous vous contactons dans quelques minutes 📱"
  );
}

async function handleQuartier(
  quartier: string,
  draft: ExtractedOrder,
  modePaiement: "mobile_money" | "especes",
  restaurantId: string,
  conversationId: string,
  customerName: string,
  customerPhone: string,
  meta: ConversationMeta
): Promise<string> {
  const { data: zones } = await supabaseAdmin
    .from("zones_livraison")
    .select("id, nom_zone, quartiers, frais")
    .eq("restaurant_id", restaurantId)
    .eq("actif", true);

  if (!zones || zones.length === 0) {
    await clearDraft(conversationId, meta);
    return (
      "Pour la livraison, merci de nous contacter directement " +
      "pour confirmer les frais selon votre quartier."
    );
  }

  const match = findDeliveryZone(quartier, zones as DeliveryZone[]);

  if (!match) {
    await clearDraft(conversationId, meta);
    return (
      "Désolé, nous ne livrons pas encore dans votre quartier. " +
      "Vous pouvez récupérer votre commande sur place."
    );
  }

  const delivery: DeliveryInfo = {
    zone_livraison: match.nom_zone,
    frais_livraison: match.frais,
    adresse_livraison: quartier,
  };

  const reply = await createOrder(
    draft,
    restaurantId,
    conversationId,
    customerName,
    customerPhone,
    modePaiement,
    delivery
  );

  await clearDraft(conversationId, meta);
  return reply;
}

function findDeliveryZone(
  quartier: string,
  zones: DeliveryZone[]
): DeliveryZone | null {
  const input = quartier.toLowerCase().trim();

  for (const zone of zones) {
    for (const q of zone.quartiers) {
      if (
        input.includes(q.toLowerCase()) ||
        q.toLowerCase().includes(input)
      ) {
        return zone;
      }
    }
  }

  return null;
}

async function handleHorsCadre(
  restaurantId: string,
  conversationId: string,
  customerName: string,
  customerPhone: string,
  message: string
): Promise<string> {
  await supabaseAdmin.from("conversations").update({ status: "open" }).eq("id", conversationId);

  await notifyManager(
    restaurantId,
    customerName,
    customerPhone,
    message
  );

  return "Merci pour votre message. Je le transmets à l'équipe du restaurant qui vous répondra très vite. Bonne journée !";
}

// ------------------------------------------------------------------
// Utilitaires
// ------------------------------------------------------------------

function detectPaymentMode(
  msg: string
): "mobile_money" | "especes_livraison" | "especes_surplace" | null {
  const lower = msg.toLowerCase().trim();

  const mobileMoney = ["1", "orange", "orange money", "wave", "mobile money", "om"];
  if (mobileMoney.some((k) => lower.includes(k))) return "mobile_money";

  const surplace = ["3", "sur place", "comptoir", "récupérer", "recuperer"];
  if (surplace.some((k) => lower.includes(k))) return "especes_surplace";

  const livraison = ["2", "espèces", "especes", "livraison", "cash"];
  if (livraison.some((k) => lower.includes(k))) return "especes_livraison";

  return null;
}

function isConfirmation(msg: string): boolean {
  const lower = msg.toLowerCase().trim();
  const keywords = [
    "oui",
    "ok",
    "d'accord",
    "daccord",
    "je confirme",
    "confirme",
    "c'est bon",
    "cest bon",
    "go",
    "parfait",
    "valide",
    "je valide",
    "yes",
    "awa",
  ];
  return keywords.some((k) => lower.includes(k));
}

function isRejection(msg: string): boolean {
  const lower = msg.toLowerCase().trim();
  const keywords = [
    "non",
    "annule",
    "annuler",
    "j'annule",
    "pas ça",
    "laisse tomber",
    "stop",
    "arrête",
    "ayi",
  ];
  return keywords.some((k) => lower.includes(k));
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

  if (historique.length > 50) {
    historique.splice(0, historique.length - 50);
  }

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

async function clearDraft(
  conversationId: string,
  meta: ConversationMeta
) {
  delete meta.commande_draft;
  delete meta.attente_paiement;
  delete meta.attente_quartier;
  delete meta.mode_paiement_choisi;
  await saveMeta(conversationId, meta);
}

// ------------------------------------------------------------------
// Vérification des horaires (fuseau Afrique/Bamako = UTC+0)
// ------------------------------------------------------------------

const DAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function slotOpenTime(slot: string): string {
  return slot.split("-")[0].trim();
}

function parseSlotMinutes(slot: string): { openMin: number; closeMin: number } | null {
  const parts = slot.split("-");
  if (parts.length !== 2) return null;
  const [oh, om] = parts[0].trim().split(":").map(Number);
  const [ch, cm] = parts[1].trim().split(":").map(Number);
  if ([oh, om, ch, cm].some(isNaN)) return null;
  return { openMin: oh * 60 + om, closeMin: ch * 60 + cm };
}

function checkOpeningHours(
  openingHours: Record<string, string> | null
): { open: true } | { open: false; closedMessage: string } {
  if (!openingHours || Object.keys(openingHours).length === 0) {
    return { open: true };
  }

  const now = new Date();
  // Africa/Bamako = UTC+0, même offset que UTC, pas de DST
  const utcDay = now.getUTCDay(); // 0=dimanche … 6=samedi
  const currentDay = DAYS_FR[utcDay];
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const todaySlot = openingHours[currentDay];
  if (todaySlot) {
    const parsed = parseSlotMinutes(todaySlot);
    if (parsed) {
      // Actuellement ouvert
      if (currentMinutes >= parsed.openMin && currentMinutes < parsed.closeMin) {
        return { open: true };
      }
      // Pas encore ouvert aujourd'hui
      if (currentMinutes < parsed.openMin) {
        return {
          open: false,
          closedMessage: `Bonjour ! Nous sommes actuellement fermés. Nous ouvrons aujourd'hui à ${slotOpenTime(todaySlot)}. Vous pouvez déjà nous envoyer votre commande et nous la traiterons dès notre ouverture 😊`,
        };
      }
    }
  }

  // Cherche la prochaine ouverture dans les 7 prochains jours
  for (let i = 1; i <= 7; i++) {
    const nextDay = DAYS_FR[(utcDay + i) % 7];
    const nextSlot = openingHours[nextDay];
    if (nextSlot && parseSlotMinutes(nextSlot)) {
      const dayLabel = i === 1 ? "demain" : nextDay;
      return {
        open: false,
        closedMessage: `Bonjour ! Nous sommes actuellement fermés. Nous ouvrons ${dayLabel} à ${slotOpenTime(nextSlot)}. Vous pouvez déjà nous envoyer votre commande et nous la traiterons dès notre ouverture 😊`,
      };
    }
  }

  return {
    open: false,
    closedMessage:
      "Bonjour ! Nous sommes actuellement fermés. Vous pouvez déjà nous envoyer votre commande et nous la traiterons dès notre ouverture 😊",
  };
}

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

  // Stocker la notification dans metadata pour le dashboard
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
