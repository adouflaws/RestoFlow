"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface Restaurant {
  id: string;
  name: string;
  phone: string | null;
  statut_abonnement: string;
  whatsapp_phone_number_id: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  actif: { label: "Actif", bg: "#dcfce7", color: "#15803d" },
  trial: { label: "Trial", bg: "#fff7ed", color: "#c2410c" },
  suspendu: { label: "Suspendu", bg: "#fef2f2", color: "#b91c1c" },
};

export default function AdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/restaurants");
    const data = await res.json();
    if (Array.isArray(data)) setRestaurants(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(id: string, newStatut: string) {
    setUpdating(id);
    await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut_abonnement: newStatut }),
    });
    await load();
    setUpdating(null);
  }

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: "#999" }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "#111" }}>
          Restaurants ({restaurants.length})
        </h1>
        <Link
          href="/admin/nouveau"
          style={{
            backgroundColor: "#1a4d2e",
            color: "white",
            textDecoration: "none",
            padding: "10px 20px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + Nouveau restaurant
        </Link>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#555" }}>
                Nom
              </th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#555" }}>
                WhatsApp
              </th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#555" }}>
                Statut
              </th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#555" }}>
                Créé le
              </th>
              <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600, color: "#555" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => {
              const s = STATUS_CONFIG[r.statut_abonnement] ?? STATUS_CONFIG.trial;
              const isUpdating = updating === r.id;

              return (
                <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 500, color: "#111" }}>
                    {r.name}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#666" }}>
                    {r.phone || "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        backgroundColor: s.bg,
                        color: s.color,
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 20,
                        display: "inline-block",
                      }}
                    >
                      {s.label}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#666" }}>
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {r.statut_abonnement !== "actif" && (
                      <button
                        onClick={() => toggleStatus(r.id, "actif")}
                        disabled={isUpdating}
                        style={{
                          backgroundColor: "#15803d",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isUpdating ? "wait" : "pointer",
                          marginLeft: 6,
                          opacity: isUpdating ? 0.6 : 1,
                        }}
                      >
                        Activer
                      </button>
                    )}
                    {r.statut_abonnement !== "suspendu" && (
                      <button
                        onClick={() => toggleStatus(r.id, "suspendu")}
                        disabled={isUpdating}
                        style={{
                          backgroundColor: "#b91c1c",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isUpdating ? "wait" : "pointer",
                          marginLeft: 6,
                          opacity: isUpdating ? 0.6 : 1,
                        }}
                      >
                        Suspendre
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#999" }}>
                  Aucun restaurant enregistré
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
