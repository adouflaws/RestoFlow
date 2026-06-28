import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/guards";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const statut_abonnement = body.statut_abonnement;

  if (!statut_abonnement || !["actif", "trial", "suspendu"].includes(statut_abonnement)) {
    return NextResponse.json({ error: "Statut invalide", received: body }, { status: 400 });
  }

  const result = await supabaseAdmin
    .from("restaurants")
    .update({ statut_abonnement })
    .eq("id", id);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, statut_abonnement });
}
