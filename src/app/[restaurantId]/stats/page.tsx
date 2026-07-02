"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LoadingScreen } from "@/components/dashboard/LoadingScreen";
import { PlanBanner } from "@/components/dashboard/PlanBanner";
import { SH } from "@/lib/ds";
import { TrendingUp, Package, ShoppingCart, CheckCircle2, UtensilsCrossed } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────
interface StatOrder {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: { nom: string; quantite: number; prix_unitaire: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3);
}

function last7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  const [orders,  setOrders]  = useState<StatOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan,    setPlan]    = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("restaurants")
      .select("plan")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => setPlan((data as { plan?: string } | null)?.plan ?? "starter"));
  }, [restaurantId]);

  useEffect(() => {
    fetch(`/api/stats?restaurant_id=${restaurantId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [restaurantId]);

  // ── Calculs ───────────────────────────────────────────────────────────
  const delivered  = orders.filter((o) => o.status === "delivered");
  const monthCA    = delivered.reduce((s, o) => s + o.total, 0);
  const monthTotal = orders.length;
  const avgBasket  = delivered.length > 0 ? monthCA / delivered.length : 0;
  const delivRate  = monthTotal > 0 ? Math.round((delivered.length / monthTotal) * 100) : 0;

  // Barres 7 jours
  const days7 = last7Days().map((d) => {
    const dayOrders = orders.filter((o) => isSameDay(new Date(o.created_at), d));
    const ca = dayOrders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
    return { label: dayLabel(d), ca, count: dayOrders.length, isToday: isSameDay(d, new Date()) };
  });
  const maxCA = Math.max(...days7.map((d) => d.ca), 1);

  // Top 5 plats
  const itemMap: Record<string, { count: number; revenue: number }> = {};
  delivered.forEach((o) => {
    (o.items ?? []).forEach((item) => {
      itemMap[item.nom] = itemMap[item.nom] ?? { count: 0, revenue: 0 };
      itemMap[item.nom].count   += item.quantite;
      itemMap[item.nom].revenue += item.quantite * item.prix_unitaire;
    });
  });
  const top5 = Object.entries(itemMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);
  const maxCount = top5.length > 0 ? top5[0][1].count : 1;

  // Heures de pointe (7h-23h)
  const hourMap: Record<number, number> = {};
  orders.forEach((o) => { const h = new Date(o.created_at).getHours(); hourMap[h] = (hourMap[h] ?? 0) + 1; });
  const hours = Array.from({ length: 17 }, (_, i) => i + 7); // 7h → 23h
  const maxHour = Math.max(...hours.map((h) => hourMap[h] ?? 0), 1);

  // Mois en cours
  const monthName = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  if (loading) return <LoadingScreen message="Calcul des statistiques…" />;

  if (plan === "starter") {
    return (
      <PlanBanner
        feature="Statistiques avancées"
        description="Disponible à partir du plan Pro. Passez au Pro pour débloquer toutes les statistiques de votre restaurant."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Statistiques"
        subtitle={`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} · ${monthTotal} commandes`}
      >
        <div style={{
          fontSize: 12, color: "#8898aa",
          backgroundColor: "#f6f9fc", border: "1px solid #e0e6eb",
          padding: "6px 12px", borderRadius: 20,
        }}>
          Ce mois-ci
        </div>
      </PageHeader>

      {/* ── Contenu ───────────────────────────────────────────────── */}
      <div style={{ padding: "28px 32px" }}>

        {/* ── KPI résumé du mois ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { Icon: TrendingUp,   label: "CA du mois",    dot: "#1a4d2e", value: `${fmt(monthCA)} FCFA` },
            { Icon: Package,      label: "Commandes",      dot: "#b45309", value: String(monthTotal) },
            { Icon: ShoppingCart, label: "Panier moyen",   dot: "#8898aa", value: avgBasket > 0 ? `${fmt(avgBasket)} F` : "—" },
            { Icon: CheckCircle2, label: "Taux livraison", dot: "#16a34a", value: `${delivRate} %` },
          ].map(({ Icon, label, dot, value }) => (
            <div key={label} style={{
              backgroundColor: "#fff", borderRadius: 12,
              border: "1px solid #e0e6eb",
              boxShadow: SH.sm,
              padding: "16px 20px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon size={16} style={{ color: dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "#6b7c93", fontWeight: 500 }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#30313d", letterSpacing: "-0.4px" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 20 }}>

          {/* ── Graphique CA 7 jours ─────────────────────────────── */}
          <div style={{
            backgroundColor: "#fff", borderRadius: 14,
            border: "1px solid #e0e6eb",
            boxShadow: SH.md,
            padding: "24px",
          }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#30313d", margin: "0 0 4px" }}>
                CA des 7 derniers jours
              </h2>
              <p style={{ fontSize: 12, color: "#8898aa", margin: 0 }}>Commandes livrées uniquement</p>
            </div>

            {/* Barres CSS */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 140 }}>
              {days7.map((day) => {
                const pct = maxCA > 0 ? (day.ca / maxCA) * 100 : 0;
                const barH = Math.max(pct * 1.3, day.ca > 0 ? 4 : 0);
                return (
                  <div key={day.label} style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "flex-end", height: "100%",
                  }}>
                    <div style={{
                      fontSize: 10, color: "#8898aa", marginBottom: 4,
                      fontWeight: day.ca > 0 ? 600 : 400,
                    }}>
                      {day.ca > 0 ? (day.ca >= 1000 ? `${fmt(Math.round(day.ca / 1000))}k` : fmt(day.ca)) : ""}
                    </div>
                    <div style={{
                      width: "100%",
                      height: `${barH}%`,
                      minHeight: day.ca > 0 ? 4 : 0,
                      backgroundColor: day.isToday ? "#1a4d2e" : "#bbf7d0",
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                      position: "relative",
                    }} />
                    <div style={{
                      fontSize: 11, color: day.isToday ? "#30313d" : "#8898aa",
                      marginTop: 6, fontWeight: day.isToday ? 700 : 400,
                    }}>
                      {day.label}
                    </div>
                    {day.count > 0 && (
                      <div style={{ fontSize: 10, color: "#8898aa" }}>{day.count}cmd</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f4f5f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#1a4d2e" }} />
                <span style={{ fontSize: 11.5, color: "#6b7c93" }}>Aujourd'hui</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#bbf7d0" }} />
                <span style={{ fontSize: 11.5, color: "#6b7c93" }}>Jours précédents</span>
              </div>
            </div>
          </div>

          {/* ── Top 5 plats ──────────────────────────────────────── */}
          <div style={{
            backgroundColor: "#fff", borderRadius: 14,
            border: "1px solid #e0e6eb",
            boxShadow: SH.md,
            padding: "24px",
          }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#30313d", margin: "0 0 4px" }}>
                Top 5 plats
              </h2>
              <p style={{ fontSize: 12, color: "#8898aa", margin: 0 }}>Ce mois-ci</p>
            </div>

            {top5.length === 0 ? (
              <div style={{ textAlign: "center", color: "#8898aa", paddingTop: 32 }}>
                <UtensilsCrossed size={32} style={{ color: "#8898aa", marginBottom: 8 }} />
                <p style={{ fontSize: 13 }}>Aucune commande ce mois-ci</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {top5.map(([name, stats], i) => {
                  const pct = Math.round((stats.count / maxCount) * 100);
                  const rankColors = ["#1a4d2e","#16a34a","#4ade80","#86efac","#bbf7d0"];
                  return (
                    <div key={name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: rankColors[i], display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: i < 2 ? "#fff" : "#1a4d2e", flexShrink: 0 }}>{i + 1}</span>
                          <span style={{
                            fontSize: 13, fontWeight: 600, color: "#30313d",
                            maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {name}
                          </span>
                        </div>
                        <span style={{ fontSize: 12.5, color: "#6b7c93", fontWeight: 700 }}>
                          {stats.count} cmd
                        </span>
                      </div>
                      <div style={{
                        height: 6, backgroundColor: "#f4f5f6", borderRadius: 3, overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          backgroundColor: i === 0 ? "#1a4d2e" : "#bbf7d0",
                          borderRadius: 3, transition: "width 0.4s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Heures de pointe ─────────────────────────────────── */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 14,
          border: "1px solid #e0e6eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          padding: "24px",
        }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#30313d", margin: "0 0 4px" }}>
              Heures de pointe
            </h2>
            <p style={{ fontSize: 12, color: "#8898aa", margin: 0 }}>Distribution des commandes par heure</p>
          </div>

          {Object.keys(hourMap).length === 0 ? (
            <div style={{ textAlign: "center", color: "#8898aa", padding: "32px 0" }}>
              <p style={{ fontSize: 13 }}>Aucune donnée disponible</p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {hours.map((h) => {
                const count = hourMap[h] ?? 0;
                const pct   = Math.round((count / maxHour) * 100);
                const now   = new Date().getHours();
                const isNow = h === now;
                return (
                  <div key={h} style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "flex-end", height: "100%",
                  }}>
                    <div style={{
                      width: "100%",
                      height: `${Math.max(pct, count > 0 ? 5 : 0)}%`,
                      minHeight: count > 0 ? 3 : 0,
                      backgroundColor: isNow ? "#1a4d2e" : count > 0 ? "#bbf7d0" : "#f4f5f6",
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.3s ease",
                    }} />
                    <div style={{
                      fontSize: 9.5, color: isNow ? "#30313d" : "#8898aa",
                      marginTop: 4, fontWeight: isNow ? 700 : 400,
                    }}>
                      {h}h
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pic d'affluence */}
          {Object.keys(hourMap).length > 0 && (() => {
            const peakHour = hours.reduce((best, h) => (hourMap[h] ?? 0) > (hourMap[best] ?? 0) ? h : best, hours[0]);
            return (
              <div style={{
                marginTop: 16, paddingTop: 14, borderTop: "1px solid #f4f5f6",
                display: "flex", gap: 24,
              }}>
                <div>
                  <span style={{ fontSize: 11.5, color: "#8898aa" }}>Pic d'affluence</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#30313d" }}>{peakHour}h — {peakHour + 1}h</div>
                </div>
                <div>
                  <span style={{ fontSize: 11.5, color: "#8898aa" }}>Commandes à cette heure</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#30313d" }}>{hourMap[peakHour] ?? 0}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11.5, color: "#8898aa" }}>Commandes livrées</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#30313d" }}>{delivered.length}</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
