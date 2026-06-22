import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type Classification = "faq" | "commande" | "hors_cadre";

interface RestaurantContext {
  name: string;
  menu: string;
  horaires: string;
}

const VALID: Set<string> = new Set(["faq", "commande", "hors_cadre"]);

export async function classifyMessage(
  message: string,
  restaurant: RestaurantContext
): Promise<Classification> {
  const system = `Tu es un assistant de classification pour le restaurant "${restaurant.name}" à Bamako.

Ton unique rôle : lire le message d'un client et répondre par UN SEUL mot parmi :
- faq — le client pose une question simple sur le restaurant (horaires, adresse, localisation, menu, prix d'un plat, livraison, moyens de paiement)
- commande — le client veut commander un ou plusieurs plats
- hors_cadre — réclamation, plainte, insulte, question complexe, ou tout ce que le bot ne peut pas gérer

Contexte du restaurant :
Menu : ${restaurant.menu}
Horaires : ${restaurant.horaires}

Réponds UNIQUEMENT par le mot de classification. Rien d'autre.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 16,
    messages: [{ role: "user", content: message }],
    system,
  });

  const text =
    response.content[0].type === "text"
      ? response.content[0].text.trim().toLowerCase()
      : "";

  if (VALID.has(text)) return text as Classification;

  return "hors_cadre";
}
