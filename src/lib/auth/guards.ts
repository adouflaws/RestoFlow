import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

async function getAuthUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type AuthOk   = { ok: true;  userId: string; email: string };
type AuthFail = { ok: false; response: NextResponse };

/** Connecté + membre du restaurant demandé. */
export async function requireRestaurantAccess(
  restaurantId: string
): Promise<AuthOk | AuthFail> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const { data } = await supabaseAdmin
    .from("restaurant_users")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurantId)
    .single();
  if (!data) {
    return { ok: false, response: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id, email: user.email ?? "" };
}

/** Connecté seulement (sans vérification de restaurant). */
export async function requireAuth(): Promise<AuthOk | AuthFail> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  return { ok: true, userId: user.id, email: user.email ?? "" };
}

/** Connecté + email correspond à NEXT_PUBLIC_SUPER_ADMIN_EMAIL. */
export async function requireAdmin(): Promise<AuthOk | AuthFail> {
  const user = await getAuthUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return { ok: false, response: NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id, email: user.email! };
}
