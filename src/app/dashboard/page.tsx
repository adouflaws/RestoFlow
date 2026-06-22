import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: link } = await supabase
    .from("restaurant_users")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (link?.restaurant_id) {
    redirect(`/${link.restaurant_id}/commandes`);
  }

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
