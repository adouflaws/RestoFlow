"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/dashboard/LoadingScreen";
import { SH } from "@/lib/ds";
import { Map, CheckCircle2, DollarSign, MessageCircle, MapPin, Trash2 } from "lucide-react";

interface Zone {
  id: string;
  nom_zone: string;
  quartiers: string[];
  frais: number;
  actif: boolean;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      role="switch"
      aria-checked={on}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        backgroundColor: on ? "#22c55e" : "#8898aa",
        position: "relative", cursor: "pointer",
        transition: "background-color 0.2s",
      }}
    >
      <div style={{
        position: "absolute",
        top: 2, left: on ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%",
        backgroundColor: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

const WA_UPGRADE = "https://wa.me/22376753087?text=Bonjour%20RestoFlow%2C%20je%20souhaite%20passer%20au%20plan%20Pro.";

export default function ZonesPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  const [zones,     setZones]     = useState<Zone[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toast,     setToast]     = useState("");
  const [plan,      setPlan]      = useState("pro");
  const [form,      setForm]      = useState({
    nom_zone: "", quartiers: "", frais: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("restaurants")
      .select("plan")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => setPlan((data as { plan?: string } | null)?.plan ?? "starter"));
  }, [restaurantId]);

  async function load() {
    const res  = await fetch(`/api/zones?restaurant_id=${restaurantId}`);
    const data = await res.json();
    setZones(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [restaurantId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const nom_zone  = form.nom_zone.trim();
    const quartiers = form.quartiers.split(",").map((q) => q.trim()).filter(Boolean);
    const frais     = parseInt(form.frais, 10) || 0;
    if (!nom_zone) return;

    const res = await fetch("/api/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurant_id: restaurantId, nom_zone, quartiers, frais }),
    });

    if (!res.ok) { showToast("Erreur lors de l'ajout"); return; }
    setForm({ nom_zone: "", quartiers: "", frais: "" });
    setShowForm(false);
    showToast("Zone ajoutée ✓");
    load();
  }

  async function toggleActif(zone: Zone) {
    setZones((prev) => prev.map((z) => (z.id === zone.id ? { ...z, actif: !zone.actif } : z)));
    const res = await fetch(`/api/zones/${zone.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !zone.actif }),
    });
    if (!res.ok) setZones((prev) => prev.map((z) => (z.id === zone.id ? { ...z, actif: zone.actif } : z)));
  }

  async function deleteZone(id: string) {
    setDeleting(id);
    await fetch(`/api/zones/${id}`, { method: "DELETE" });
    setZones((prev) => prev.filter((z) => z.id !== id));
    setDeleting(null);
    showToast("Zone supprimée");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #e0e6eb", borderRadius: 8,
    fontSize: 13.5, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", color: "#30313d",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#6b7c93", marginBottom: 5,
  };

  if (loading) return <LoadingScreen message="Chargement des zones…" />;

  return (
    <>
      {/* ── Header sticky ─────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "#fff", borderBottom: "1px solid #e0e6eb",
        padding: "0 32px",
      }}>
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "#30313d", margin: 0, letterSpacing: "-0.3px" }}>
              Zones de livraison
            </h1>
            <p style={{ fontSize: 12, color: "#8898aa", margin: 0, marginTop: 1 }}>
              {zones.length} zone{zones.length !== 1 ? "s" : ""} · {zones.filter(z => z.actif).length} actives
            </p>
          </div>

          {plan === "starter" && zones.length >= 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "#8898aa" }}>Limite Starter : 1 zone</span>
              <a href={WA_UPGRADE} target="_blank" rel="noopener noreferrer"
                style={{
                  backgroundColor: "#1a4d2e", color: "#fff", border: "none",
                  borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700,
                  textDecoration: "none", cursor: "pointer",
                }}>
                <MessageCircle size={13} /> Passer au Pro
              </a>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(!showForm)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = showForm ? "#6b7c93" : "#16a34a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = showForm ? "#6b7c93" : "#1a4d2e")}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                backgroundColor: showForm ? "#6b7c93" : "#1a4d2e",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "9px 18px", fontSize: 13.5, fontWeight: 700,
                cursor: "pointer", transition: "background-color 0.15s",
                fontFamily: "inherit",
              }}
            >
              {showForm ? "✕ Annuler" : "+ Ajouter une zone"}
            </button>
          )}
        </div>
      </header>

      {/* ── Contenu ───────────────────────────────────────────────── */}
      <div style={{ padding: "28px 32px" }}>

        {/* Formulaire ajout */}
        {showForm && (
          <div style={{
            backgroundColor: "#fff", borderRadius: 12,
            border: "1px solid #e0e6eb",
            boxShadow: SH.lg,
            padding: "24px 28px", marginBottom: 28,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#30313d", margin: "0 0 20px" }}>
              Nouvelle zone de livraison
            </h3>
            <form onSubmit={handleAdd}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nom de la zone *</label>
                  <input
                    type="text" value={form.nom_zone} required
                    placeholder="Centre-ville"
                    onChange={(e) => setForm({ ...form, nom_zone: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Frais de livraison (FCFA)</label>
                  <input
                    type="number" value={form.frais} min={0}
                    placeholder="1 000"
                    onChange={(e) => setForm({ ...form, frais: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Quartiers couverts</label>
                  <input
                    type="text" value={form.quartiers}
                    placeholder="Hamdallaye, ACI 2000, Lafiabougou, Kalaban-coura"
                    onChange={(e) => setForm({ ...form, quartiers: e.target.value })}
                    style={inputStyle}
                  />
                  <p style={{ fontSize: 11.5, color: "#8898aa", margin: "5px 0 0" }}>
                    Séparez les quartiers par des virgules
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#1a4d2e", color: "#fff",
                    border: "none", borderRadius: 8, padding: "10px 24px",
                    fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Créer la zone
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  style={{
                    backgroundColor: "#f6f9fc", color: "#6b7c93",
                    border: "1px solid #e0e6eb", borderRadius: 8,
                    padding: "10px 18px", fontSize: 13.5, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* État vide */}
        {zones.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            border: "1px solid #e0e6eb", padding: "80px 32px", textAlign: "center",
          }}>
            <Map size={48} style={{ color: "#8898aa", marginBottom: 20 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#30313d", marginBottom: 10 }}>
              Aucune zone configurée
            </h2>
            <p style={{ fontSize: 14, color: "#6b7c93", marginBottom: 24 }}>
              Créez vos zones de livraison pour que le bot propose les bonnes options à vos clients.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                backgroundColor: "#1a4d2e", color: "#fff",
                border: "none", borderRadius: 8, padding: "10px 24px",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              + Ajouter une zone
            </button>
          </div>
        ) : (
          <>
            {/* Stats rapides */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Zones configurées", value: zones.length, Icon: Map,         color: "#6b7c93" },
                { label: "Zones actives", value: zones.filter(z => z.actif).length, Icon: CheckCircle2, color: "#16a34a" },
                { label: "Frais moyen", value: zones.length > 0 ? `${fmt(Math.round(zones.reduce((s,z) => s+z.frais,0)/zones.length))} F` : "—", Icon: DollarSign, color: "#b45309" },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} style={{
                  backgroundColor: "#fff", borderRadius: 12,
                  border: "1px solid #e0e6eb",
                  borderTop: `3px solid ${color}`,
                  boxShadow: SH.sm,
                  padding: "18px 20px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Icon size={16} style={{ color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#6b7c93", fontWeight: 500 }}>{label}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#30313d", letterSpacing: "-0.4px" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Cards zones */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  style={{
                    backgroundColor: "#fff", borderRadius: 12,
                    border: "1px solid #f4f5f6",
                    boxShadow: SH.md,
                    overflow: "hidden",
                    opacity: zone.actif ? 1 : 0.65,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* En-tête zone */}
                  <div style={{
                    padding: "16px 18px 12px",
                    borderBottom: "1px solid #f4f5f6",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#30313d", display: "flex", alignItems: "center", gap: 7 }}>
                        <MapPin size={15} style={{ color: "#1a4d2e", flexShrink: 0 }} /> {zone.nom_zone}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a4d2e", marginTop: 3 }}>
                        {zone.frais === 0 ? "Livraison gratuite" : `${fmt(zone.frais)} FCFA`}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: zone.actif ? "#16a34a" : "#8898aa", fontWeight: 600 }}>
                        {zone.actif ? "Active" : "Inactive"}
                      </span>
                      <Toggle on={zone.actif} onChange={() => toggleActif(zone)} />
                    </div>
                  </div>

                  {/* Quartiers */}
                  <div style={{ padding: "14px 18px 16px" }}>
                    {zone.quartiers.length > 0 ? (
                      <>
                        <p style={{ fontSize: 11, color: "#8898aa", fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Quartiers couverts
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {zone.quartiers.map((q) => (
                            <span key={q} style={{
                              backgroundColor: "#f0fdf4", color: "#16a34a",
                              border: "1px solid #bbf7d0",
                              fontSize: 12, fontWeight: 500,
                              padding: "3px 10px", borderRadius: 12,
                            }}>
                              {q}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: 12.5, color: "#8898aa", margin: 0, fontStyle: "italic" }}>
                        Aucun quartier spécifié
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{
                    padding: "10px 18px",
                    borderTop: "1px solid #f4f5f6",
                    display: "flex", justifyContent: "flex-end",
                  }}>
                    <button
                      onClick={() => deleteZone(zone.id)}
                      disabled={deleting === zone.id}
                      style={{
                        background: "none", border: "none",
                        fontSize: 12, color: deleting === zone.id ? "#8898aa" : "#ef4444",
                        cursor: deleting === zone.id ? "not-allowed" : "pointer",
                        fontWeight: 600, fontFamily: "inherit",
                        padding: "4px 8px",
                      }}
                    >
                      {deleting === zone.id ? "Suppression…" : <><Trash2 size={12} /> Supprimer</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 32,
          backgroundColor: "#30313d", color: "#fff",
          padding: "12px 20px", borderRadius: 10,
          fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 999,
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
