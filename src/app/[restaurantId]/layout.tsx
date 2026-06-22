"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

const NAV = [
  { label: "Commandes", href: "commandes" },
  { label: "Menu", href: "menu" },
  { label: "Config", href: "config" },
];

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const restaurantId = params.restaurantId as string;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          backgroundColor: "#1a4d2e",
          color: "white",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 40, padding: "0 8px" }}>
          RestoFlow
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map(({ label, href }) => {
            const full = `/${restaurantId}/${href}`;
            const active = pathname.startsWith(full);
            const hovered = hoveredLink === href;
            return (
              <Link
                key={href}
                href={full}
                onMouseEnter={() => setHoveredLink(href)}
                onMouseLeave={() => setHoveredLink(null)}
                style={{
                  color: "white",
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  backgroundColor: active ? "#246b3e" : hovered ? "rgba(255,255,255,0.1)" : "transparent",
                  transition: "background-color 0.15s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          style={{
            color: "rgba(255,255,255,0.6)",
            background: "transparent",
            border: "none",
            padding: "10px 12px",
            borderRadius: 6,
            fontSize: 14,
            cursor: "pointer",
            textAlign: "left",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 16,
            marginTop: 8,
            transition: "background-color 0.15s",
          }}
        >
          Déconnexion
        </button>
      </aside>

      {/* Contenu */}
      <main
        style={{
          marginLeft: 220,
          flex: 1,
          backgroundColor: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
