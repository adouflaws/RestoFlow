import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { PlanKey } from "@/lib/geniuspay/subscription";

const VALID_STATUSES = ["success", "paid", "completed"];
const VALID_PLANS: PlanKey[] = ["starter", "pro", "business"];

export async function POST(req: NextRequest) {
  // Vérification de la signature webhook si configurée
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-geniuspay-signature");
    if (sig !== secret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Ignorer les événements non-payés
  const status =
    (payload.status as string | undefined) ??
    (payload.payment_status as string | undefined);

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const meta = (payload.metadata ?? {}) as Record<string, string>;
  const { restaurant_id, plan } = meta;

  if (!restaurant_id || !plan) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  if (!VALID_PLANS.includes(plan as PlanKey)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update({ statut_abonnement: "actif", plan })
    .eq("id", restaurant_id);

  if (error) {
    console.error("[geniuspay webhook] supabase error:", error);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
