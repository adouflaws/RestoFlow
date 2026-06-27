"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────
interface OrderItem {
  nom: string;
  quantite: number;
  prix_unitaire: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  mode_paiement: string | null;
  zone_livraison: string | null;
  frais_livraison: number | null;
  adresse_livraison: string | null;
  created_at: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────
const STATUS_FLOW = ["pending", "preparing", "ready", "delivered"] as const;

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "En attente",     bg: "#f1f5f9", color: "#64748b" },
  preparing: { label: "En préparation", bg: "#fff7ed", color: "#c2410c" },
  ready:     { label: "Prêt ✓",         bg: "#eff6ff", color: "#2563eb" },
  delivered: { label: "Livré",          bg: "#f0fdf4", color: "#16a34a" },
  cancelled: { label: "Annulé",         bg: "#fef2f2", color: "#dc2626" },
};

const ACTION_BTN: Record<string, { label: string; bg: string; hover: string }> = {
  pending:   { label: "Commencer ▶",    bg: "#f59e0b", hover: "#d97706" },
  preparing: { label: "Marquer prêt ▶", bg: "#3b82f6", hover: "#2563eb" },
  ready:     { label: "Livrer ✓",       bg: "#16a34a", hover: "#15803d" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function maskPhone(phone: string | null): string {
  if (!phone) return "";
  const c = phone.replace(/\s/g, "");
  if (c.length < 8) return phone;
  return c.slice(0, c.length - 6) + " •• •• " + c.slice(-3);
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name;
  return parts[0] + " " + parts.slice(1).map((p) => (p[0] ?? "") + ".").join(" ");
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function yesterdayStart() {
  const d = todayStart();
  d.setDate(d.getDate() - 1);
  return d;
}

function isToday(iso: string) {
  const d = new Date(iso);
  return d >= todayStart();
}

function isYesterday(iso: string) {
  const d = new Date(iso);
  const ys = yesterdayStart();
  return d >= ys && d < todayStart();
}

function dateLabel() {
  const raw = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function payLabel(mode: string | null) {
  if (mode === "mobile_money") return "Mobile Money";
  if (mode === "especes")      return "Espèces";
  if (mode === "wave")         return "Wave";
  if (mode === "orange_money") return "Orange Money";
  return "—";
}

function orderNum(idx: number) {
  return "#" + String(idx + 1).padStart(3, "0");
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function CommandesPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [hoveredBtn,    setHoveredBtn]    = useState<string | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [restoPhone,    setRestoPhone]    = useState<string | null>(null);

  // ── Chargement resto ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("restaurants")
      .select("phone")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => { if (data?.phone) setRestoPhone(data.phone); });
  }, [restaurantId]);

  // ── Chargement commandes (polling 30s) ────────────────────────────────
  const load = useCallback(async () => {
    const res  = await fetch(`/api/commandes?restaurant_id=${restaurantId}`);
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 30_000);
    return () => clearInterval(poll);
  }, [load]);

  // ── Mise à jour statut ────────────────────────────────────────────────
  async function updateStatus(orderId: string, newStatus: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    const res = await fetch(`/api/commandes/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) load();
  }

  function nextStatus(current: string): string | null {
    const idx = STATUS_FLOW.indexOf(current as (typeof STATUS_FLOW)[number]);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  // ── WhatsApp copy ─────────────────────────────────────────────────────
  async function copyWhatsApp() {
    if (!restoPhone) return;
    await navigator.clipboard.writeText(restoPhone).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── KPI calculs ───────────────────────────────────────────────────────
  const todayOrders     = orders.filter((o) => isToday(o.created_at));
  const yesterdayOrders = orders.filter((o) => isYesterday(o.created_at));

  const kpiCA      = todayOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const kpiTotal   = todayOrders.length;
  const kpiPending = todayOrders.filter((o) => o.status === "pending" || o.status === "preparing").length;
  const kpiDone    = todayOrders.filter((o) => o.status === "delivered").length;

  const ykpiCA      = yesterdayOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const ykpiTotal   = yesterdayOrders.length;
  const ykpiPending = yesterdayOrders.filter((o) => o.status === "pending" || o.status === "preparing").length;
  const ykpiDone    = yesterdayOrders.filter((o) => o.status === "delivered").length;

  // Commandes actives (non livrées, non annulées) pour la section
  const activeOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );

  // ── Rendu helper : delta ──────────────────────────────────────────────
  function Delta({ today, yest }: { today: number; yest: number }) {
    const diff = today - yest;
    const color = diff > 0 ? "#22c55e" : diff < 0 ? "#ef4444" : "#94a3b8";
    return (
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>
        {diff > 0 ? "+" : ""}{diff} vs hier
      </span>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 14 }}>Chargement…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Animation pulse pour bot actif */}
      <style>{`
        @keyframes rfDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.7); } }
      `}</style>

      {/* ─── Header sticky ─────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        height: 64, backgroundColor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center",
        padding: "0 32px",
        justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, marginTop: 1 }}>{dateLabel()}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Badge bot actif */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 20, padding: "6px 12px",
          }}>
            <span style={{
              display: "inline-block", width: 8, height: 8, borderRadius: "50%",
              backgroundColor: "#22c55e",
              animation: "rfDot 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 700 }}>Bot actif</span>
          </div>

          {/* Bouton WhatsApp */}
          <button
            onClick={copyWhatsApp}
            disabled={!restoPhone}
            onMouseEnter={(e) => { if (restoPhone) e.currentTarget.style.backgroundColor = "#16a34a"; }}
            onMouseLeave={(e) => { if (restoPhone) e.currentTarget.style.backgroundColor = "#1a4d2e"; }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              backgroundColor: restoPhone ? "#1a4d2e" : "#e2e8f0",
              color: restoPhone ? "#fff" : "#94a3b8",
              border: "none", borderRadius: 8,
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              cursor: restoPhone ? "pointer" : "default",
              transition: "background-color 0.15s", fontFamily: "inherit",
            }}
          >
            {copied ? "✓ Copié !" : "📱 Partager WhatsApp"}
          </button>
        </div>
      </header>

      {/* ─── Contenu ──────────────────────────────────────────────── */}
      <div style={{ padding: "28px 32px" }}>

        {/* ─── KPI cards ──────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16, marginBottom: 32,
        }}>
          {[
            {
              icon: "💰", label: "CA du jour", border: "#22c55e",
              value: `${fmt(kpiCA)} FCFA`,
              delta: <Delta today={kpiCA} yest={ykpiCA} />,
            },
            {
              icon: "📦", label: "Commandes aujourd'hui", border: "#3b82f6",
              value: String(kpiTotal),
              delta: <Delta today={kpiTotal} yest={ykpiTotal} />,
            },
            {
              icon: "⏳", label: "En attente / préparation", border: "#f59e0b",
              value: String(kpiPending),
              delta: <Delta today={kpiPending} yest={ykpiPending} />,
            },
            {
              icon: "✅", label: "Livrées", border: "#94a3b8",
              value: String(kpiDone),
              delta: <Delta today={kpiDone} yest={ykpiDone} />,
            },
          ].map(({ icon, label, border, value, delta }) => (
            <div key={label} style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderLeft: `4px solid ${border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
              padding: "20px 20px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>{label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", marginBottom: 6 }}>
                {value}
              </div>
              {delta}
            </div>
          ))}
        </div>

        {/* ─── Section commandes actives ──────────────────────────── */}
        {orders.length === 0 ? (
          /* État vide */
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            padding: "80px 32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 20, letterSpacing: 4 }}>
              📱 → 🤖 → ✅
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
              Votre assistant attend des commandes
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 28px" }}>
              Partagez votre numéro WhatsApp avec vos clients. Dès qu&apos;un client envoie un message, les commandes apparaissent ici en temps réel.
            </p>
            <button
              onClick={copyWhatsApp}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a4d2e")}
              style={{
                backgroundColor: "#1a4d2e", color: "#fff",
                border: "none", borderRadius: 9, padding: "12px 28px",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                transition: "background-color 0.15s", fontFamily: "inherit",
              }}
            >
              {copied ? "✓ Numéro copié !" : "📱 Configurer mon WhatsApp"}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Commandes en cours
              </h2>
              {activeOrders.length > 0 && (
                <span style={{
                  backgroundColor: "#0f172a", color: "#fff",
                  fontSize: 11, fontWeight: 700, padding: "2px 8px",
                  borderRadius: 10,
                }}>
                  {activeOrders.length}
                </span>
              )}
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {activeOrders.length === 0 ? "Aucune commande active" : ""}
              </span>
            </div>

            {activeOrders.length === 0 ? (
              <div style={{
                backgroundColor: "#fff", borderRadius: 12,
                border: "1px solid #e2e8f0", padding: "40px 24px",
                textAlign: "center", color: "#94a3b8", fontSize: 14,
              }}>
                ✅ Toutes les commandes ont été livrées !
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 16,
              }}>
                {activeOrders.map((order, idx) => {
                  const badge  = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
                  const next   = nextStatus(order.status);
                  const action = next ? ACTION_BTN[order.status] : null;
                  const time   = new Date(order.created_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit", minute: "2-digit",
                  });
                  const btnKey = order.id;
                  const isHov  = hoveredBtn === btnKey;

                  return (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
                        overflow: "hidden",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      {/* En-tête card */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 18px 12px",
                        borderBottom: "1px solid #f1f5f9",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.2px" }}>
                            {orderNum(idx)}
                          </span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>· {time}</span>
                        </div>
                        <span style={{
                          backgroundColor: badge.bg, color: badge.color,
                          fontSize: 11.5, fontWeight: 700,
                          padding: "4px 10px", borderRadius: 20,
                          whiteSpace: "nowrap" as const,
                        }}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Client */}
                      <div style={{
                        padding: "10px 18px 8px",
                        borderBottom: "1px solid #f1f5f9",
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                          👤 {maskName(order.customer_name)}
                        </span>
                        {order.customer_phone && (
                          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 10 }}>
                            📱 {maskPhone(order.customer_phone)}
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div style={{ padding: "10px 18px 4px" }}>
                        {(order.items as OrderItem[]).map((item, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", padding: "4px 0",
                            borderBottom: i < order.items.length - 1 ? "1px solid #f8fafc" : "none",
                          }}>
                            <span style={{ fontSize: 13, color: "#334155" }}>
                              <strong style={{ color: "#0f172a" }}>{item.quantite}×</strong> {item.nom}
                            </span>
                            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, flexShrink: 0, marginLeft: 12 }}>
                              {fmt(item.quantite * item.prix_unitaire)} F
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Livraison */}
                      {order.zone_livraison && (
                        <div style={{
                          padding: "8px 18px",
                          borderTop: "1px solid #f1f5f9",
                          fontSize: 12, color: "#64748b",
                          backgroundColor: "#fafafa",
                        }}>
                          🚚 {order.zone_livraison}
                          {order.adresse_livraison && ` — ${order.adresse_livraison}`}
                          {order.frais_livraison ? (
                            <span style={{ color: "#94a3b8" }}> (+{fmt(order.frais_livraison)} F)</span>
                          ) : null}
                        </div>
                      )}

                      {/* Total + action */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 18px",
                        borderTop: "1px solid #f1f5f9",
                      }}>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                            {fmt(order.total)} <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>FCFA</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                            {payLabel(order.mode_paiement)}
                          </div>
                        </div>

                        {action && next && (
                          <button
                            onClick={() => updateStatus(order.id, next)}
                            onMouseEnter={() => setHoveredBtn(btnKey)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              backgroundColor: isHov ? action.hover : action.bg,
                              color: "#fff", border: "none",
                              padding: "9px 16px", borderRadius: 8,
                              fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                              transition: "background-color 0.15s",
                              fontFamily: "inherit", whiteSpace: "nowrap" as const,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                          >
                            {action.label}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
