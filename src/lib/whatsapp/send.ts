const BSP_API_URL =
  process.env.BSP_API_URL ?? "https://graph.facebook.com/v21.0";
const BSP_API_KEY = process.env.BSP_API_KEY ?? "";

function formatPrice(amount: number): string {
  return Math.round(amount).toLocaleString("fr-FR");
}

// ------------------------------------------------------------------
// Appel bas-niveau vers l'API WhatsApp Cloud
// ------------------------------------------------------------------

interface WhatsAppPayload {
  messaging_product: "whatsapp";
  to: string;
  type: string;
  [key: string]: unknown;
}

async function callApi(
  phoneNumberId: string,
  payload: WhatsAppPayload
): Promise<boolean> {
  try {
    const res = await fetch(`${BSP_API_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BSP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[WhatsApp] Échec envoi → ${res.status} ${res.statusText}`,
        body
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[WhatsApp] Erreur réseau :", err);
    return false;
  }
}

// ------------------------------------------------------------------
// Résoudre le phone_number_id du restaurant
// ------------------------------------------------------------------

async function getPhoneNumberId(restaurantId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/lib/supabase/admin");

  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("whatsapp_phone_id")
    .eq("id", restaurantId)
    .single();

  return data?.whatsapp_phone_id ?? null;
}

// ------------------------------------------------------------------
// Message texte simple
// ------------------------------------------------------------------

export async function sendMessage(
  phone: string,
  text: string,
  restaurantId: string
): Promise<boolean> {
  const phoneNumberId = await getPhoneNumberId(restaurantId);
  if (!phoneNumberId) {
    console.error(
      `[WhatsApp] Pas de phone_number_id pour le restaurant ${restaurantId}`
    );
    return false;
  }

  return callApi(phoneNumberId, {
    messaging_product: "whatsapp",
    to: phone,
    type: "text",
    text: { body: text },
  });
}

// ------------------------------------------------------------------
// Résumé de commande avec boutons Confirmer / Annuler
// ------------------------------------------------------------------

export async function sendConfirmation(
  phone: string,
  orderSummary: string,
  total: number,
  restaurantId: string
): Promise<boolean> {
  const phoneNumberId = await getPhoneNumberId(restaurantId);
  if (!phoneNumberId) {
    console.error(
      `[WhatsApp] Pas de phone_number_id pour le restaurant ${restaurantId}`
    );
    return false;
  }

  const body = `${orderSummary}\n\n💰 Total : ${formatPrice(total)} FCFA`;

  return callApi(phoneNumberId, {
    messaging_product: "whatsapp",
    to: phone,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: [
          {
            type: "reply",
            reply: { id: "confirm_order", title: "Confirmer ✅" },
          },
          {
            type: "reply",
            reply: { id: "cancel_order", title: "Annuler ❌" },
          },
        ],
      },
    },
  });
}

// ------------------------------------------------------------------
// Lien de paiement (Orange Money / Wave)
// ------------------------------------------------------------------

export async function sendPaymentLink(
  phone: string,
  link: string,
  total: number,
  restaurantId: string
): Promise<boolean> {
  const phoneNumberId = await getPhoneNumberId(restaurantId);
  if (!phoneNumberId) {
    console.error(
      `[WhatsApp] Pas de phone_number_id pour le restaurant ${restaurantId}`
    );
    return false;
  }

  const text =
    `💳 Payez votre commande de ${formatPrice(total)} FCFA en toute sécurité :\n\n` +
    `${link}\n\n` +
    `Vous pouvez payer par Orange Money, Wave ou carte bancaire.\n` +
    `Le paiement en espèces à la livraison est aussi accepté.`;

  return callApi(phoneNumberId, {
    messaging_product: "whatsapp",
    to: phone,
    type: "text",
    text: { body: text },
  });
}
