import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRestaurantAccess } from "@/lib/auth/guards";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireRestaurantAccess(id);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", id)
    .order("category")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireRestaurantAccess(id);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert({
      restaurant_id: id,
      name: body.name,
      description: body.description || null,
      price: Math.round(body.price),
      category: body.category || "Plats",
      is_available: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireRestaurantAccess(id);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { item_id, ...fields } = body;

  if (!item_id) return NextResponse.json({ error: "item_id requis" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("menu_items")
    .update(fields)
    .eq("id", item_id)
    .eq("restaurant_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
