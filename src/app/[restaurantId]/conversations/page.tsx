"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HistoryEntry {
  role: "bot" | "client";
  text: string;
}

interface Conversation {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  status: string;
  metadata: { historique?: HistoryEntry[]; [key: string]: unknown } | null;
  created_at: string;
  updated_at: string;
}

type FilterTab = "all" | "actif" | "commande_en_cours" | "transfert_humain" | "ferme";

// ─── Constantes ───────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  open:              { label: "Actif",            bg: "#f0fdf4", color: "#16a34a" },
  actif:             { label: "Actif",            bg: "#f0fdf4", color: "#16a34a" },
  commande_en_cours: { label: "Commande en cours", bg: "#fff7ed", color: "#c2410c" },
  transfert_humain:  { label: "Transfert humain", bg: "#fef2f2", color: "#dc2626" },
  closed:            { label: "Fermé",            bg: "#f1f5f9", color: "#64748b" },
  ferme:             { label: "Fermé",            bg: "#f1f5f9", color: "#64748b" },
  fermé:             { label: "Fermé",            bg: "#f1f5f9", color: "#64748b" },
};

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all",               label: "Toutes" },
  { id: "actif",             label: "Actives" },
  { id: "commande_en_cours", label: "Commandes" },
  { id: "transfert_humain",  label: "Transfert humain" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskPhone(phone: string | null): string {
  if (!phone || phone === "system") return "—";
  const raw = phone.replace(/\s/g, "");
  const e164 = raw.startsWith("+") ? raw : "+" + raw;
  if (e164.length < 7) return e164;
  const country = e164.slice(0, 4);
  const two = e164.slice(4, 6);
  const end = e164.slice(-3);
  return `${country} ${two} ••• ${end}`;
}

function getStatus(status: string) {
  return (
    STATUS_CFG[status] ?? { label: status, bg: "#f1f5f9", color: "#64748b" }
  );
}

function msgCount(conv: Conversation): number {
  return conv.metadata?.historique?.length ?? 0;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function matchFilter(conv: Conversation, filter: FilterTab): boolean {
  if (filter === "all") return true;
  if (filter === "actif") return conv.status === "open" || conv.status === "actif";
  if (filter === "commande_en_cours") return conv.status === "commande_en_cours";
  if (filter === "transfert_humain") return conv.status === "transfert_humain";
  if (filter === "ferme")
    return conv.status === "closed" || conv.status === "ferme" || conv.status === "fermé";
  return false;
}

const WA_UPGRADE = "https://wa.me/22376753087?text=Bonjour%20RestoFlow%2C%20je%20souhaite%20passer%20au%20plan%20Pro.";

function PlanBanner() {
  return (
    <div style={{ padding: "32px 28px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 24px", letterSpacing: "-0.4px" }}>
        💬 Conversations
      </h1>
      <div style={{
        backgroundColor: "#fff", border: "1.5px solid #e2e8f0",
        borderRadius: 16, padding: "48px 32px",
        textAlign: "center" as const, maxWidth: 480, margin: "0 auto",
        boxShadow: "0 4px 24px rgba(0,0,0,.06)",
      }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
          Historique des conversations
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
          Disponible à partir du plan <strong>Pro</strong>.
          Passez au Pro pour voir l&apos;historique complet de toutes vos conversations WhatsApp.
        </p>
        <a href={WA_UPGRADE} target="_blank" rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            backgroundColor: "#1a4d2e", color: "#fff",
            padding: "11px 24px", borderRadius: 8,
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
          💬 Passer au Pro →
        </a>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConversationsPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("restaurants")
      .select("plan")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => setPlan((data as { plan?: string } | null)?.plan ?? "starter"));
  }, [restaurantId]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("conversations")
      .select("id, customer_phone, customer_name, status, metadata, created_at, updated_at")
      .eq("restaurant_id", restaurantId)
      .neq("customer_phone", "system")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (data) setConversations(data as Conversation[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 30_000);
    return () => clearInterval(poll);
  }, [load]);

  useEffect(() => {
    if (selected) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [selected]);

  const filtered = conversations.filter((conv) => {
    if (search.trim()) {
      const s = search.trim().toLowerCase().replace(/\s/g, "");
      const phone = (conv.customer_phone ?? "").toLowerCase().replace(/\s/g, "");
      const name = (conv.customer_name ?? "").toLowerCase();
      if (!phone.includes(s) && !name.includes(s)) return false;
    }
    return matchFilter(conv, filter);
  });

  const countFor = (f: FilterTab) =>
    conversations.filter((c) => matchFilter(c, f)).length;

  const historique = selected?.metadata?.historique ?? [];

  if (plan === "starter") return <PlanBanner />;

  return (
    <div style={{ padding: "32px 28px", minHeight: "100vh", backgroundColor: "#f8fafc" }}>

      {/* ── En-tête ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "#0f172a",
          margin: 0, letterSpacing: "-0.4px",
        }}>
          💬 Conversations
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "#64748b" }}>
          Historique des échanges WhatsApp avec vos clients
        </p>
      </div>

      {/* ── Recherche + Filtres ───────────────────────────────────────── */}
      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column" as const, gap: 10 }}>
        <input
          type="text"
          placeholder="🔍  Rechercher par numéro ou nom…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 420,
            padding: "10px 14px", fontSize: 13.5,
            border: "1px solid #e2e8f0", borderRadius: 8,
            backgroundColor: "#fff", outline: "none",
            color: "#0f172a", fontFamily: "inherit",
            boxSizing: "border-box" as const,
          }}
        />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {FILTER_TABS.map(({ id, label }) => {
            const active = filter === id;
            const count = id === "all" ? conversations.length : countFor(id);
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: "6px 14px", borderRadius: 20,
                  fontSize: 12.5, fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  border: active ? "1.5px solid #16a34a" : "1.5px solid #e2e8f0",
                  backgroundColor: active ? "#f0fdf4" : "#fff",
                  color: active ? "#16a34a" : "#64748b",
                  transition: "all 0.12s", fontFamily: "inherit",
                }}
              >
                {label}
                <span style={{
                  marginLeft: 5, fontWeight: 400,
                  opacity: 0.65, fontSize: 11.5,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Liste ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{
          textAlign: "center" as const, padding: "80px 0",
          color: "#94a3b8", fontSize: 14,
        }}>
          Chargement des conversations…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center" as const, padding: "80px 0",
          backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: "0 0 6px" }}>
            Aucune conversation
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            {search
              ? "Aucun résultat pour cette recherche."
              : "Les conversations WhatsApp apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          {filtered.map((conv, i) => {
            const st = getStatus(conv.status);
            const msgs = msgCount(conv);
            const convHistory = conv.metadata?.historique ?? [];
            const lastMsgText = convHistory[convHistory.length - 1]?.text;

            return (
              <div
                key={conv.id}
                onClick={() => setSelected(conv)}
                style={{
                  padding: "14px 20px",
                  borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                  cursor: "pointer",
                  transition: "background-color 0.1s",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 12,
                }}>
                  {/* Gauche : avatar + infos */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      backgroundColor: "#f0fdf4", flexShrink: 0,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 20,
                    }}>
                      📱
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: "flex", alignItems: "center",
                        gap: 8, marginBottom: 3,
                      }}>
                        <span style={{
                          fontSize: 13.5, fontWeight: 700,
                          color: "#0f172a", fontFamily: "monospace",
                        }}>
                          {maskPhone(conv.customer_phone)}
                        </span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 600,
                          padding: "2px 8px", borderRadius: 10,
                          backgroundColor: st.bg, color: st.color,
                          flexShrink: 0,
                        }}>
                          {st.label}
                        </span>
                      </div>

                      {lastMsgText && (
                        <p style={{
                          margin: 0, fontSize: 12, color: "#94a3b8",
                          overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap" as const, maxWidth: 380,
                        }}>
                          {lastMsgText.length > 90
                            ? lastMsgText.slice(0, 90) + "…"
                            : lastMsgText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Droite : date + compteur */}
                  <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                    <div style={{ fontSize: 11.5, color: "#94a3b8", marginBottom: 5 }}>
                      {fmtDate(conv.updated_at)}
                    </div>
                    {msgs > 0 && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        backgroundColor: "#f1f5f9", borderRadius: 10,
                        padding: "2px 8px", fontSize: 11, color: "#64748b", fontWeight: 600,
                      }}>
                        💬 {msgs}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Panneau latéral ───────────────────────────────────────────── */}
      {selected && (
        <>
          {/* Fond sombre */}
          <div
            onClick={() => setSelected(null)}
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.28)",
              zIndex: 200,
            }}
          />

          {/* Drawer */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 440,
            backgroundColor: "#ece5dd",
            zIndex: 201,
            display: "flex", flexDirection: "column" as const,
            boxShadow: "-4px 0 32px rgba(0,0,0,0.14)",
          }}>
            {/* Header du panneau */}
            <div style={{
              padding: "14px 18px",
              backgroundColor: "#1a4d2e",
              display: "flex", alignItems: "center", gap: 12,
              flexShrink: 0,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.15)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>
                📱
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: "#fff", fontFamily: "monospace",
                }}>
                  {maskPhone(selected.customer_phone)}
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
                  {getStatus(selected.status).label}
                  {" · "}
                  {msgCount(selected)} message{msgCount(selected) !== 1 ? "s" : ""}
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "#fff", fontSize: 15,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontFamily: "inherit",
                }}
              >
                ✕
              </button>
            </div>

            {/* Zone de messages */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "12px 10px",
              display: "flex", flexDirection: "column" as const, gap: 3,
            }}>
              {historique.length === 0 ? (
                <div style={{
                  textAlign: "center" as const, padding: "60px 0",
                  color: "#94a3b8", fontSize: 13,
                }}>
                  Aucun message dans cette conversation
                </div>
              ) : (
                historique.map((msg, idx) => {
                  const isBot = msg.role === "bot";
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: isBot ? "flex-end" : "flex-start",
                        marginBottom: 1,
                      }}
                    >
                      <div style={{
                        maxWidth: "75%",
                        padding: "8px 11px",
                        borderRadius: isBot
                          ? "12px 2px 12px 12px"
                          : "2px 12px 12px 12px",
                        backgroundColor: isBot ? "#dcf8c6" : "#fff",
                        color: "#1a1a1a",
                        fontSize: 13, lineHeight: 1.5,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
                        whiteSpace: "pre-wrap" as const,
                        wordBreak: "break-word" as const,
                      }}>
                        {msg.text}
                        <span style={{
                          display: "block", textAlign: "right" as const,
                          fontSize: 10, color: isBot ? "#5e8a65" : "#94a3b8",
                          marginTop: 3,
                        }}>
                          {isBot ? "Bot ·" : "Client ·"} {idx + 1}/{historique.length}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Footer info */}
            <div style={{
              padding: "10px 16px",
              backgroundColor: "#f0f0f0",
              borderTop: "1px solid #d9d9d9",
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11, color: "#94a3b8",
              flexShrink: 0,
            }}>
              <span>
                Depuis le{" "}
                {new Date(selected.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
              <span>Màj {fmtDate(selected.updated_at)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
