import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ok = () => NextResponse.json({ received: true });

// ------------------------------------------------------------------
// GET — Vérification du webhook par Meta / BSP
// ------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

// ------------------------------------------------------------------
// POST — Messages entrants WhatsApp
// ------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-hub-signature-256");
  if (!signature || !verifyHmac(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (change?.field !== "messages" || !value?.messages?.length) {
    return ok();
  }

  const phoneNumberId: string | undefined = value.metadata?.phone_number_id;
  const message = value.messages[0];
  const contact = value.contacts?.[0];
  const customerPhone: string = message.from;
  const customerName: string = contact?.profile?.name ?? customerPhone;

  if (!phoneNumberId) return ok();

  // ----- Restaurant lookup -----

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("id, is_active")
    .eq("whatsapp_phone_number_id", phoneNumberId)
    .single();

  if (!restaurant || !restaurant.is_active) return ok();

  // ----- Conversation : charger ou créer -----

  let { data: conversation } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("customer_phone", customerPhone)
    .eq("channel", "whatsapp")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    const { data: created } = await supabaseAdmin
      .from("conversations")
      .insert({
        restaurant_id: restaurant.id,
        customer_phone: customerPhone,
        customer_name: customerName,
        channel: "whatsapp",
        status: "open",
      })
      .select("id")
      .single();
    conversation = created;
  }

  // ----- Contenu du message -----

  const messageText =
    message.type === "text" ? message.text?.body : `[${message.type}]`;

  // ----- Appel interne au bot (fire-and-forget) -----

  const origin = req.nextUrl.origin;

  fetch(`${origin}/api/bot/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      restaurant_id: restaurant.id,
      conversation_id: conversation?.id,
      phone_number_id: phoneNumberId,
      customer_phone: customerPhone,
      customer_name: customerName,
      message: messageText,
      message_type: message.type,
    }),
  }).catch(() => {});

  return ok();
}

// ------------------------------------------------------------------
// HMAC SHA-256 — vérifie la signature du BSP
// ------------------------------------------------------------------

function verifyHmac(rawBody: string, header: string): boolean {
  const secret = process.env.META_VERIFY_TOKEN!;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = header.replace("sha256=", "");

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}
