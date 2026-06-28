import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/server-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const { name, email, password, phone, address } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { data: restaurant, error: restError } = await supabaseAdmin
    .from("restaurants")
    .insert({
      name,
      slug,
      phone: phone || null,
      address: address || null,
    })
    .select("id")
    .single();

  if (restError) {
    return NextResponse.json({ error: restError.message }, { status: 500 });
  }

  const { error: linkError } = await supabaseAdmin
    .from("restaurant_users")
    .insert({
      restaurant_id: restaurant.id,
      user_id: authUser.user.id,
      role: "owner",
    });

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({ id: restaurant.id, message: "Restaurant créé" }, { status: 201 });
}
