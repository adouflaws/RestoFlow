import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRestaurantAccess } from "@/lib/auth/guards";

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get("restaurant_id");
  if (!restaurantId) {
    return NextResponse.json({ error: "restaurant_id requis" }, { status: 400 });
  }

  const auth = await requireRestaurantAccess(restaurantId);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("category")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { restaurant_id, name, description, price, category } = body;

  if (!restaurant_id || !name || price === undefined) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const auth = await requireRestaurantAccess(restaurant_id);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert({
      restaurant_id,
      name,
      description: description || null,
      price: Math.round(price),
      category: category || "Plats",
      is_available: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  // RÃ©cupÃ¨re le restaurant_id de l'item pour vÃ©rifier l'accÃ¨s
  const { data: item } = await supabaseAdmin
    .from("menu_items")
    .select("restaurant_id")
    .eq("id", id)
    .single();

  if (!item) return NextResponse.json({ error: "Plat introuvable" }, { status: 404 });

  const auth = await requireRestaurantAccess(item.restaurant_id);
  if (!auth.ok) return auth.response;

  const { error } = await supabaseAdmin
    .from("menu_items")
    .update(fields)
    .eq("id", id)
    .eq("restaurant_id", item.restaurant_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
