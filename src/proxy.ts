import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? "";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques — court-circuit avant tout appel Supabase
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth");

  if (isPublic) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes qui exigent une session authentifiée
  // /dashboard, /admin, et /[restaurantId]/... (UUID v4)
  const UUID_RE = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/|$)/i;
  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    UUID_RE.test(pathname);

  // Utilisateur déjà connecté sur /login ou /signup → dashboard
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Non connecté sur une route protégée → login
  if (!user && requiresAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // /admin réservé à l'admin
  if (pathname.startsWith("/admin") && user && user.email !== ADMIN_EMAIL) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Vérification d'appartenance pour les pages [restaurantId] (pas les routes /api)
  // Un utilisateur connecté ne peut pas naviguer vers le dashboard d'un restaurant qui ne lui appartient pas
  if (user && UUID_RE.test(pathname) && !pathname.startsWith("/api/")) {
    const restaurantId = pathname.split("/")[1];
    const { data: membership } = await supabaseAdmin
      .from("restaurant_users")
      .select("restaurant_id")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .single();
    if (!membership) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
