import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function DashboardRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("DASHBOARD - user:", user?.id ?? "NON CONNECTE", user?.email ?? "");

  if (!user) {
    console.log("DASHBOARD - redirect /login (pas de user)");
    redirect("/login");
  }

  const { data: link, error } = await supabaseAdmin
    .from("restaurant_users")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  console.log("DASHBOARD - link:", JSON.stringify(link));
  console.log("DASHBOARD - error:", error?.message ?? "aucune");
  console.log("DASHBOARD - SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30));
  console.log("DASHBOARD - SERVICE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "présente" : "ABSENTE");

  if (link?.restaurant_id) {
    console.log("DASHBOARD - redirect vers", `/${link.restaurant_id}/commandes`);
    redirect(`/${link.restaurant_id}/commandes`);
  }

  console.log("DASHBOARD - AUCUN RESTAURANT TROUVE");

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ color: "#111", fontSize: 18, marginBottom: 8 }}>
          Aucun restaurant configuré
        </h1>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>
          Votre compte n&apos;est associé à aucun restaurant.
          Contactez l&apos;administrateur pour être ajouté.
        </p>
      </div>
    </div>
  );
}
