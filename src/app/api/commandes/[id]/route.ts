import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRestaurantAccess } from "@/lib/supabase/server-auth";
import { sendMessage } from "@/lib/whatsapp/send";
import { NextRequest, NextResponse } from "next/server";

const STATUS_MESSAGES: Record<string, string> = {
  pret: "Bonne nouvelle ! 🎉 Votre commande est prête. Vous pouvez venir la récupérer ou votre livreur est en route. Merci de votre confiance !",
  livre: "Merci pour votre commande ! Nous espérons vous revoir bientôt 😊 N'hésitez pas à nous laisser un avis.",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (!body.status) {
    return NextResponse.json({ error: "status requis" }, { status: 400 });
  }

  // Récupère la commande pour obtenir restaurant_id (requis pour la vérification d'accès)
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("customer_phone, restaurant_id")
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const auth = await requireRestaurantAccess(order.restaurant_id);
  if (!auth.ok) return auth.response;

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: body.status })
    .eq("id", id)
    .eq("restaurant_id", order.restaurant_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const notifText = STATUS_MESSAGES[body.status];
  if (notifText && order.customer_phone) {
    await sendMessage(order.customer_phone, notifText, order.restaurant_id);
  }

  return NextResponse.json({ ok: true });
}
