import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRestaurantAccess } from "@/lib/supabase/server-auth";

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get("restaurant_id");
  if (!restaurantId) return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });

  const auth = await requireRestaurantAccess(restaurantId);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("zones_livraison")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("nom_zone");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { restaurant_id, nom_zone, quartiers, frais } = body;

  if (!restaurant_id || !nom_zone) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const auth = await requireRestaurantAccess(restaurant_id);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("zones_livraison")
    .insert({
      restaurant_id,
      nom_zone: nom_zone.trim(),
      quartiers: Array.isArray(quartiers) ? quartiers : [],
      frais: Number(frais) || 0,
      actif: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
