import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
}

export interface OrderItem {
  menu_item_id: string;
  nom: string;
  prix_unitaire: number;
  quantite: number;
}

export interface ExtractedOrder {
  items: OrderItem[];
  total: number;
  message_confirmation: string;
}

interface AmbiguousResult {
  items: null;
  total: null;
  message_confirmation: string;
}

export type ExtractionResult = ExtractedOrder | AmbiguousResult;

interface AIItem {
  nom_menu: string;
  quantite: number;
}

interface AIExtraction {
  type: "commande";
  items: AIItem[];
  plats_inconnus: string[];
}

interface AIClarification {
  type: "clarification";
  message: string;
}

type AIResponse = AIExtraction | AIClarification;

function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR");
}

export async function extractOrder(
  message: string,
  menuItems: MenuItem[]
): Promise<ExtractionResult> {
  const available = menuItems.filter((m) => m.is_available);

  const menuText = available
    .map((m) => `- ${m.name} (${m.category}) : ${formatPrice(m.price)} FCFA`)
    .join("\n");

  const system = `Tu es l'assistant de commande d'un restaurant à Bamako.

Voici le menu complet du restaurant :
${menuText}

Le client va envoyer un message décrivant ce qu'il veut commander.

Ton rôle :
1. Identifier chaque plat demandé et le faire correspondre au nom EXACT du menu ci-dessus
2. Extraire la quantité pour chaque plat (par défaut 1)
3. Si un plat demandé ne correspond à rien dans le menu, le noter dans "plats_inconnus"
4. Si le message est trop vague ou ambigu pour en extraire une commande, demander une précision

Réponds UNIQUEMENT en JSON valide, sans texte autour, dans l'un de ces deux formats :

Format commande :
{"type":"commande","items":[{"nom_menu":"Nom exact du plat","quantite":2}],"plats_inconnus":["plat inconnu"]}

Format clarification (si le message est ambigu) :
{"type":"clarification","message":"Votre question de clarification"}

Règles :
- nom_menu doit correspondre EXACTEMENT à un nom du menu
- Ne jamais inventer un plat
- Ne jamais inventer un prix
- Quantité minimum : 1`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: message }],
    system,
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  let parsed: AIResponse;
  try {
    parsed = JSON.parse(raw) as AIResponse;
  } catch {
    return {
      items: null,
      total: null,
      message_confirmation:
        "Désolé, je n'ai pas bien compris votre commande. Pouvez-vous reformuler ? Par exemple : « Je veux 2 poulets braisés et un jus ».",
    };
  }

  if (parsed.type === "clarification") {
    return {
      items: null,
      total: null,
      message_confirmation: parsed.message,
    };
  }

  const menuByName = new Map(
    available.map((m) => [m.name.toLowerCase(), m])
  );

  const items: OrderItem[] = [];

  for (const ai of parsed.items) {
    const match = menuByName.get(ai.nom_menu.toLowerCase());
    if (!match) continue;

    const quantite = Math.max(1, Math.round(ai.quantite));
    items.push({
      menu_item_id: match.id,
      nom: match.name,
      prix_unitaire: match.price,
      quantite,
    });
  }

  if (items.length === 0 && parsed.plats_inconnus.length === 0) {
    return {
      items: null,
      total: null,
      message_confirmation:
        "Désolé, je n'ai pas trouvé les plats que vous demandez dans notre menu. Pouvez-vous reformuler votre commande ?",
    };
  }

  const total = items.reduce(
    (sum, it) => sum + it.prix_unitaire * it.quantite,
    0
  );

  const lines = items.map(
    (it) =>
      `- ${it.quantite}x ${it.nom} : ${formatPrice(it.prix_unitaire * it.quantite)} FCFA`
  );

  let confirmation = `Voici votre commande :\n${lines.join("\n")}\nTotal : ${formatPrice(total)} FCFA`;

  if (parsed.plats_inconnus.length > 0) {
    const unknown = parsed.plats_inconnus.join(", ");
    confirmation += `\n\nNous n'avons pas trouvé « ${unknown} » dans notre menu.`;
  }

  confirmation += "\n\nVous confirmez ?";

  return { items, total, message_confirmation: confirmation };
}
