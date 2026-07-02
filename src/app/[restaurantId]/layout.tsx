"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useCallback } from "react";
import {
  Package, MessageSquare, UtensilsCrossed, MapPin,
  Settings, HelpCircle, BarChart2, ShieldAlert, Menu, X,
  AlertTriangle, ArrowRight,
} from "lucide-react";

const SIDEBAR_W = 260;
const BG_DARK = "#0f172a";

const NAV = [
  { label: "Commandes",          href: "commandes",     Icon: Package },
  { label: "Conversations",      href: "conversations", Icon: MessageSquare },
  { label: "Menu",               href: "menu",          Icon: UtensilsCrossed },
  { label: "Zones de livraison", href: "zones",         Icon: MapPin },
  { label: "Configuration",      href: "config",        Icon: Settings },
  { label: "FAQ",                href: "faq",           Icon: HelpCircle },
  { label: "Statistiques",       href: "stats",         Icon: BarChart2 },
];

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const params   = useParams();
  const pathname = usePathname();
  const router   = useRouter();
  const restaurantId = params.restaurantId as string;

  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [hovered,          setHovered]          = useState<string | null>(null);
  const [isAdmin,          setIsAdmin]          = useState(false);
  const [userInfo,         setUserInfo]         = useState<{ email: string; name: string } | null>(null);
  const [restoName,        setRestoName]        = useState("");
  const [restoPlan,        setRestoPlan]        = useState("starter");
  const [statutAbonnement, setStatutAbonnement] = useState<string | null>(null);
  const [createdAt,        setCreatedAt]        = useState<string | null>(null);
  const [pendingCount,     setPendingCount]     = useState(0);

  // ── Chargement user + restaurant ──────────────────────────────────────
  useEffect(() => {
    const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
    const supabase   = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const email = data.user.email ?? "";
      const name  = (data.user.user_metadata?.full_name as string)
                    || email.split("@")[0];
      setUserInfo({ email, name });
      if (adminEmail && email && email === adminEmail) setIsAdmin(true);
    });

    supabase
      .from("restaurants")
      .select("name, statut_abonnement, plan, created_at")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => {
        if (data?.name) setRestoName(data.name);
        const d = data as { plan?: string; statut_abonnement?: string; created_at?: string } | null;
        if (d?.plan) setRestoPlan(d.plan);
        if (d?.statut_abonnement) setStatutAbonnement(d.statut_abonnement);
        if (d?.created_at) setCreatedAt(d.created_at);
        if (d?.statut_abonnement === "suspendu" && !pathname.endsWith("/suspendu")) {
          router.push(`/${restaurantId}/suspendu`);
        }
      });
  }, [restaurantId]);

  // ── Compteur commandes en attente (polling 30s) ───────────────────────
  const loadPending = useCallback(async () => {
    const res = await fetch(`/api/commandes?restaurant_id=${restaurantId}`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      setPendingCount(
        data.filter((o: { status: string }) =>
          o.status === "pending" || o.status === "preparing"
        ).length
      );
    }
  }, [restaurantId]);

  useEffect(() => {
    loadPending();
    const poll = setInterval(loadPending, 30_000);
    return () => clearInterval(poll);
  }, [loadPending]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userInfo?.name
    ? userInfo.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
    : "?";

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        input:focus-visible,textarea:focus-visible,select:focus-visible {
          outline: none !important;
          border-color: #1a4d2e !important;
          box-shadow: 0 0 0 2px rgba(26,77,46,.30) !important;
        }
        a:focus-visible,button:focus-visible {
          outline: 2px solid #1a4d2e;
          outline-offset: 2px;
          border-radius: 4px;
        }
        .rf-sidebar {
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .rf-mobile-bar { display: none; }
        .rf-overlay    { display: none; }
        @media (max-width: 767px) {
          .rf-sidebar   { transform: translateX(-260px); }
          .rf-sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.22); }
          .rf-main      { margin-left: 0 !important; }
          .rf-mobile-bar { display: flex !important; }
          .rf-overlay   { display: block !important; }
        }
      `}</style>
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className={`rf-sidebar${mobileOpen ? " open" : ""}`} style={{
        width: SIDEBAR_W, flexShrink: 0,
        backgroundColor: BG_DARK,
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, bottom: 0,
        zIndex: 110,
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              backgroundColor: "#1a4d2e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0,
              letterSpacing: "-0.5px",
            }}>
              RF
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>
              RestoFlow
            </span>
            <span style={{
              backgroundColor:
                restoPlan === "business" ? "#d97706"
                : restoPlan === "pro"     ? "#16a34a"
                : restoPlan === "trial"   ? "#b45309"
                :                          "#6b7c93",
              color: "#fff",
              fontSize: 9, fontWeight: 800, padding: "2px 5px",
              borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase" as const,
              flexShrink: 0,
            }}>
              {restoPlan === "business" ? "BUSINESS"
                : restoPlan === "pro"   ? "PRO"
                : restoPlan === "trial" ? "TRIAL"
                :                        "STARTER"}
            </span>
          </div>

          {restoName && (
            <div style={{
              fontSize: 12, fontWeight: 500, color: "#ffffff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
              paddingLeft: 2,
            }}>
              {restoName}
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", margin: "0 20px 8px" }} />

        {/* Navigation */}
        <nav style={{ padding: "4px 10px", flex: 1 }}>
          {NAV.map(({ label, href, Icon }) => {
            const full    = `/${restaurantId}/${href}`;
            const active  = pathname === full || pathname.startsWith(full + "/");
            const isHov   = hovered === href;
            const hasBadge = href === "commandes" && pendingCount > 0;

            return (
              <Link
                key={href}
                href={full}
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, marginBottom: 1,
                  textDecoration: "none",
                  backgroundColor: active ? "rgba(255,255,255,0.11)" : isHov ? "rgba(255,255,255,0.06)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.52)",
                  transition: "background-color 0.12s, color 0.12s",
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 400, flex: 1 }}>
                  {label}
                </span>
                {hasBadge && (
                  <span style={{
                    backgroundColor: "#ef4444", color: "#fff",
                    fontSize: 10, fontWeight: 700, padding: "2px 7px",
                    borderRadius: 10, minWidth: 20, textAlign: "center" as const,
                  }}>
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Lien admin — uniquement pour adouflaws@gmail.com */}
          {isAdmin && (
            <>
              <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", margin: "10px 2px" }} />
              <Link
                href="/admin"
                onMouseEnter={() => setHovered("admin")}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8,
                  textDecoration: "none",
                  backgroundColor: hovered === "admin" ? "rgba(255,255,255,0.06)" : "transparent",
                  color: "rgba(255,255,255,0.32)",
                  transition: "background-color 0.12s",
                }}
              >
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "0.02em" }}>
                  Administration
                </span>
              </Link>
            </>
          )}
        </nav>

        {/* Séparateur */}
        <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", margin: "0 20px 0" }} />

        {/* Footer utilisateur */}
        <div style={{ padding: "16px 16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            {/* Avatar initiales */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              backgroundColor: "#1e3a5f",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#93c5fd",
            }}>
              {initials}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.82)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
              }}>
                {userInfo?.name ?? "—"}
              </div>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.32)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
              }}>
                {userInfo?.email ?? ""}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
            style={{
              width: "100%", padding: "8px 0",
              borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.4)",
              fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              textAlign: "center" as const, transition: "background-color 0.12s",
              fontFamily: "inherit",
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ────────────────────────────────────────── */}
      <main className="rf-main" style={{
        marginLeft: SIDEBAR_W, flex: 1,
        backgroundColor: "#f6f9fc", minHeight: "100vh",
      }}>
        {/* Barre mobile — masquée sur desktop */}
        <div className="rf-mobile-bar" style={{
          position: "sticky", top: 0, zIndex: 50,
          backgroundColor: "#fff", borderBottom: "1px solid #e0e6eb",
          padding: "0 16px", height: 56,
          alignItems: "center", justifyContent: "space-between",
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 8, borderRadius: 8, color: "#30313d",
              display: "flex", alignItems: "center",
            }}
          >
            <Menu size={22} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#30313d", letterSpacing: "-0.3px" }}>
            RestoFlow
          </span>
          <div style={{ width: 38 }} />
        </div>

        {/* Overlay mobile */}
        <div
          className="rf-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            zIndex: 105, backdropFilter: "blur(2px)",
          }}
        />

        {/* ── Banner essai gratuit ─────────────────────────────────── */}
        {statutAbonnement === "trial" && (() => {
          const msPerDay   = 1000 * 60 * 60 * 24;
          const elapsed    = createdAt
            ? Math.floor((Date.now() - new Date(createdAt).getTime()) / msPerDay)
            : 0;
          const remaining  = Math.max(0, 7 - elapsed);
          const urgent     = remaining <= 2;

          return (
            <div style={{
              backgroundColor: urgent ? "#7f1d1d" : "#1a4d2e",
              padding: "10px 20px",
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 12,
              flexWrap: "wrap" as const,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} style={{ color: urgent ? "#fca5a5" : "#86efac", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: urgent ? "#fca5a5" : "#bbf7d0", fontWeight: 500 }}>
                  {remaining === 0
                    ? "Votre essai gratuit est terminé."
                    : `Essai gratuit — ${remaining} jour${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}.`}
                </span>
              </div>
              <Link
                href={`/${restaurantId}/abonnement`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  backgroundColor: "#fff",
                  color: "#1a4d2e",
                  fontSize: 12, fontWeight: 700, padding: "5px 12px",
                  borderRadius: 6, textDecoration: "none",
                  whiteSpace: "nowrap" as const,
                  transition: "opacity .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Passer en compte actif <ArrowRight size={11} />
              </Link>
            </div>
          );
        })()}

        {children}
      </main>
    </div>
  );
}
