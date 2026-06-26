import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { step, restaurantId, data } = body as {
    step: number;
    restaurantId: string;
    data: Record<string, unknown>;
  };

  if (!restaurantId || !step) {
    return NextResponse.json({ error: "restaurantId et step requis" }, { status: 400 });
  }

  try {
    if (step === 2) {
      const { error } = await supabaseAdmin
        .from("restaurants")
        .update({
          name: data.name,
          address: data.address,
          phone: data.phone,
          description: data.specialty,
        })
        .eq("id", restaurantId);
      if (error) throw error;
    }

    if (step === 3) {
      const { error } = await supabaseAdmin
        .from("restaurants")
        .update({ opening_hours: data.opening_hours })
        .eq("id", restaurantId);
      if (error) throw error;
    }

    if (step === 4) {
      await supabaseAdmin.from("menu_items").delete().eq("restaurant_id", restaurantId);
      const items = data.items as Array<{ name: string; price: string; category: string }>;
      if (items.length > 0) {
        const rows = items.map((it) => ({
          restaurant_id: restaurantId,
          name: it.name,
          price: parseInt(it.price, 10),
          category: it.category,
          is_available: true,
        }));
        const { error } = await supabaseAdmin.from("menu_items").insert(rows);
        if (error) throw error;
      }
    }

    if (step === 5) {
      await supabaseAdmin.from("zones_livraison").delete().eq("restaurant_id", restaurantId);
      const zones = data.zones as Array<{ nom: string; frais: string }>;
      if (zones && zones.length > 0) {
        const rows = zones.map((z) => ({
          restaurant_id: restaurantId,
          nom_zone: z.nom,
          quartiers: [z.nom],
          frais: parseInt(z.frais, 10) || 0,
          actif: true,
        }));
        const { error } = await supabaseAdmin.from("zones_livraison").insert(rows);
        if (error) throw error;
      }
    }

    if (step === 6) {
      const { error } = await supabaseAdmin
        .from("restaurants")
        .update({ onboarding_completed: true })
        .eq("id", restaurantId);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
