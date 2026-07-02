import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionPayment, PLANS, type PlanKey } from "@/lib/geniuspay/subscription";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = (await req.json()) as { restaurant_id: string; plan: string };
  const { restaurant_id, plan } = body;

  if (!plan || !Object.keys(PLANS).includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  // Vérifier que l'utilisateur est propriétaire du restaurant
  const { data: member } = await supabase
    .from("restaurant_users")
    .select("role")
    .eq("restaurant_id", restaurant_id)
    .eq("user_id", user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const result = await createSubscriptionPayment(restaurant_id, plan as PlanKey);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[subscription/create]", err);
    return NextResponse.json({ error: "Erreur Geniuspay" }, { status: 502 });
  }
}
