import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireRestaurantAccess } from "@/lib/supabase/server-auth";

async function getZoneRestaurantId(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("zones_livraison")
    .select("restaurant_id")
    .eq("id", id)
    .single();
  return data?.restaurant_id ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const restaurantId = await getZoneRestaurantId(id);
  if (!restaurantId) return NextResponse.json({ error: "Zone introuvable" }, { status: 404 });

  const auth = await requireRestaurantAccess(restaurantId);
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { error } = await supabaseAdmin
    .from("zones_livraison")
    .update(body)
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const restaurantId = await getZoneRestaurantId(id);
  if (!restaurantId) return NextResponse.json({ error: "Zone introuvable" }, { status: 404 });

  const auth = await requireRestaurantAccess(restaurantId);
  if (!auth.ok) return auth.response;

  const { error } = await supabaseAdmin
    .from("zones_livraison")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
