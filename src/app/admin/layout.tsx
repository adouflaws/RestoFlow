"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { label: "Restaurants", href: "/admin" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
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
        <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, padding: "0 8px" }}>
          RestoFlow
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.5)",
            padding: "0 8px",
            marginBottom: 32,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Super Admin
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map(({ label, href }) => {
            const active = pathname === href;
            const hovered = hoveredLink === href;
            return (
              <Link
                key={href}
                href={href}
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
      </aside>

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
