"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

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

const STATUS_FLOW = ["preparing", "ready", "delivered"] as const;

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "En attente", bg: "#f3f4f6", color: "#4b5563" },
  preparing: { label: "En préparation", bg: "#fff7ed", color: "#c2410c" },
  ready: { label: "Prêt", bg: "#eff6ff", color: "#1d4ed8" },
  delivered: { label: "Livré", bg: "#f0fdf4", color: "#15803d" },
  cancelled: { label: "Annulé", bg: "#fef2f2", color: "#b91c1c" },
};

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function maskPhone(phone: string | null): string {
  if (!phone) return "";
  const c = phone.replace(/\s/g, "");
  if (c.length < 8) return phone;
  return c.slice(0, c.length - 6) + " •• •• " + c.slice(-3);
}

export default function CommandesPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/commandes?restaurant_id=${restaurantId}`);
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 30000);
    return () => clearInterval(poll);
  }, [load]);

  async function updateStatus(orderId: string, newStatus: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const res = await fetch(`/api/commandes/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      load();
    }
  }

  function nextStatus(current: string): string | null {
    const idx = STATUS_FLOW.indexOf(current as (typeof STATUS_FLOW)[number]);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: "#999" }}>Chargement des commandes...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: "center", paddingTop: 120 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h2 style={{ color: "#111", fontSize: 18, marginBottom: 8 }}>
          Aucune commande pour le moment
        </h2>
        <p style={{ color: "#999", fontSize: 14 }}>
          Les nouvelles commandes WhatsApp apparaîtront ici en temps réel.
        </p>
      </div>
    );
  }

  const allDelivered = orders.length > 0 && orders.every((o) => o.status === "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const totalCA = deliveredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ padding: 32 }}>
      {allDelivered && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: "14px 20px",
            marginBottom: 20,
            fontSize: 15,
            fontWeight: 600,
            color: "#15803d",
          }}
        >
          ✓ {deliveredOrders.length} commande{deliveredOrders.length > 1 ? "s" : ""} livrée{deliveredOrders.length > 1 ? "s" : ""} — {fmt(totalCA)} FCFA
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ color: "#111", fontSize: 22, margin: 0 }}>Commandes du jour</h1>
        <span
          style={{
            backgroundColor: "#1a4d2e",
            color: "white",
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 20,
          }}
        >
          {orders.length}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        {orders.map((order) => {
          const s = STATUS[order.status] ?? STATUS.pending;
          const next = nextStatus(order.status);
          const nextLabel = next ? STATUS[next]?.label : null;

          return (
            <div
              key={order.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                    {order.customer_name}
                  </div>
                  {order.customer_phone && (
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                      {maskPhone(order.customer_phone)}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    backgroundColor: s.bg,
                    color: s.color,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </span>
              </div>

              <div style={{ padding: "0 20px 12px", borderTop: "1px solid #f3f4f6" }}>
                {(order.items as OrderItem[]).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      padding: "6px 0",
                    }}
                  >
                    <span style={{ color: "#333" }}>
                      <strong>{item.quantite}x</strong> {item.nom}
                    </span>
                    <span style={{ color: "#999" }}>
                      {fmt(item.quantite * item.prix_unitaire)} F
                    </span>
                  </div>
                ))}
              </div>

              {order.zone_livraison && (
                <div
                  style={{
                    padding: "8px 20px",
                    borderTop: "1px solid #f3f4f6",
                    fontSize: 12,
                    color: "#666",
                  }}
                >
                  🚚 {order.zone_livraison}
                  {order.adresse_livraison && ` — ${order.adresse_livraison}`}
                  {order.frais_livraison ? ` (+${fmt(order.frais_livraison)} F)` : ""}
                </div>
              )}

              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>
                    {fmt(order.total)} FCFA
                  </div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                    {order.mode_paiement === "mobile_money"
                      ? "Mobile Money"
                      : order.mode_paiement === "especes"
                        ? "Espèces"
                        : "—"}{" "}
                    ·{" "}
                    {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {next && nextLabel && (
                  <button
                    onClick={() => updateStatus(order.id, next)}
                    style={{
                      backgroundColor: "#1a4d2e",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {nextLabel} →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
