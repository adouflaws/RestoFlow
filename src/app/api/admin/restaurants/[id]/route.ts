import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const statut_abonnement = body.statut_abonnement;

  console.log("PATCH reçu, id:", id);
  console.log("body:", JSON.stringify(body));
  console.log("statut_abonnement:", statut_abonnement);

  if (!statut_abonnement || !["actif", "trial", "suspendu"].includes(statut_abonnement)) {
    console.log("REJETÉ - valeur invalide");
    return NextResponse.json({ error: "Statut invalide", received: body }, { status: 400 });
  }

  const result = await supabaseAdmin
    .from("restaurants")
    .update({ statut_abonnement })
    .eq("id", id);

  console.log("résultat Supabase:", JSON.stringify(result));

  if (result.error) {
    console.error("ERREUR Supabase:", result.error.message, result.error.code, result.error.details);
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, statut_abonnement });
}
