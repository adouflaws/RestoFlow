import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, nom_restaurant, whatsapp_numero } = body as {
    user_id: string;
    nom_restaurant: string;
    whatsapp_numero: string;
  };

  if (!user_id || !nom_restaurant) {
    return NextResponse.json({ error: "user_id et nom_restaurant requis" }, { status: 400 });
  }

  // Crée le restaurant
  const { data: restaurant, error: restError } = await supabaseAdmin
    .from("restaurants")
    .insert({
      name: nom_restaurant.trim(),
      slug: slugify(nom_restaurant),
      phone: whatsapp_numero?.trim() ?? null,
      is_active: true,
      statut_abonnement: "trial",
      onboarding_completed: false,
    })
    .select("id")
    .single();

  if (restError || !restaurant) {
    return NextResponse.json(
      { error: restError?.message ?? "Impossible de créer le restaurant" },
      { status: 500 }
    );
  }

  // Lie l'utilisateur au restaurant en tant que owner
  const { error: linkError } = await supabaseAdmin
    .from("restaurant_users")
    .insert({
      restaurant_id: restaurant.id,
      user_id,
      role: "owner",
    });

  if (linkError) {
    // Nettoie le restaurant si le lien échoue
    await supabaseAdmin.from("restaurants").delete().eq("id", restaurant.id);
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({ restaurant_id: restaurant.id });
}
