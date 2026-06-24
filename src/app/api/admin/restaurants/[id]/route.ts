import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { statut_abonnement } = body;

  if (!statut_abonnement || !["actif", "trial", "suspendu"].includes(statut_abonnement)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .update({ statut_abonnement })
    .eq("id", id)
    .select("id, name, statut_abonnement")
    .single();

  if (error) {
    console.error("ADMIN PATCH error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
