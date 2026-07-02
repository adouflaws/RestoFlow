"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingScreen } from "@/components/dashboard/LoadingScreen";
import { SH } from "@/lib/ds";
import { UtensilsCrossed, MessageCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
}

const CATEGORY_PRESETS = ["Plats", "Boissons", "Desserts", "Entrées", "Snacks", "Autres"];

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

// ─── Toggle switch ─────────────────────────────────────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  const [items,        setItems]        = useState<MenuItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [plan,         setPlan]         = useState("pro");
  const [showForm,     setShowForm]     = useState(false);
  const [filter,       setFilter]       = useState("Tous");
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [priceVal,     setPriceVal]     = useState("");
  const [toast,        setToast]        = useState("");
  const [form,         setForm]         = useState({
    name: "", description: "", price: "", category: "Plats", customCat: "",
  });

  const apiBase = `/api/restaurants/${restaurantId}/menu`;

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
    const res  = await fetch(apiBase);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [restaurantId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const price    = parseInt(form.price, 10);
    const category = form.category === "__custom__" ? form.customCat.trim() : form.category;
    if (!form.name.trim() || isNaN(price) || !category) return;

    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null, price, category }),
    });

    if (!res.ok) { showToast("Erreur lors de l'ajout"); return; }
    setForm({ name: "", description: "", price: "", category: "Plats", customCat: "" });
    setShowForm(false);
    showToast("Plat ajouté ✓");
    load();
  }

  async function toggleAvailable(id: string, current: boolean) {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, is_available: !current } : m)));
    const res = await fetch(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: id, is_available: !current }),
    });
    if (!res.ok) setItems((prev) => prev.map((m) => (m.id === id ? { ...m, is_available: current } : m)));
  }

  async function savePrice(id: string) {
    const price    = parseInt(priceVal, 10);
    if (isNaN(price) || price < 0) { setEditingId(null); return; }
    const oldPrice = items.find((m) => m.id === id)?.price ?? price;
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, price } : m)));
    setEditingId(null);
    const res = await fetch(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: id, price }),
    });
    if (!res.ok) setItems((prev) => prev.map((m) => (m.id === id ? { ...m, price: oldPrice } : m)));
  }

  // Catégories extraites des items + "Tous"
  const categories = ["Tous", ...new Set(items.map((m) => m.category))];

  const displayedItems = filter === "Tous"
    ? items
    : items.filter((m) => m.category === filter);

  const groupedByCategory = displayedItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] ?? []).push(item);
    return acc;
  }, {});

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #e0e6eb", borderRadius: 8,
    fontSize: 13.5, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", color: "#30313d",
    backgroundColor: "#fff",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#6b7c93", marginBottom: 5,
  };

  if (loading) return <LoadingScreen message="Chargement du menu…" />;

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
              Menu
            </h1>
            <p style={{ fontSize: 12, color: "#8898aa", margin: 0, marginTop: 1 }}>
              {items.length} plat{items.length !== 1 ? "s" : ""} · {items.filter(m => m.is_available).length} disponibles
            </p>
          </div>

          {plan === "starter" && items.length >= 20 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "#8898aa" }}>Limite Starter : 20 plats</span>
              <a href={WA_UPGRADE} target="_blank" rel="noopener noreferrer"
                style={{
                  backgroundColor: "#1a4d2e", color: "#fff",
                  border: "none", borderRadius: 8, padding: "9px 18px",
                  fontSize: 13, fontWeight: 700, textDecoration: "none", cursor: "pointer",
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
              {showForm ? "✕ Annuler" : "+ Nouveau plat"}
            </button>
          )}
        </div>

        {/* Filtres catégorie */}
        <div style={{
          display: "flex", gap: 6, paddingBottom: 14, overflowX: "auto",
        }}>
          {categories.map((cat) => {
            const active = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: "5px 14px", borderRadius: 20, flexShrink: 0,
                  border: active ? "none" : "1px solid #e0e6eb",
                  backgroundColor: active ? "#30313d" : "#fff",
                  color: active ? "#fff" : "#6b7c93",
                  fontSize: 12.5, fontWeight: active ? 700 : 500,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {cat}
                {cat !== "Tous" && (
                  <span style={{ marginLeft: 5, opacity: 0.6, fontSize: 11 }}>
                    ({items.filter(m => m.category === cat).length})
                  </span>
                )}
              </button>
            );
          })}
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
              Nouveau plat
            </h3>
            <form onSubmit={handleAdd}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nom du plat *</label>
                  <input
                    type="text" value={form.name} required
                    placeholder="Poulet braisé"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Catégorie *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ ...inputStyle }}
                  >
                    {CATEGORY_PRESETS.map((c) => <option key={c}>{c}</option>)}
                    <option value="__custom__">Autre (personnalisé)</option>
                  </select>
                </div>

                {form.category === "__custom__" && (
                  <div>
                    <label style={labelStyle}>Nom de la catégorie</label>
                    <input
                      type="text" value={form.customCat}
                      placeholder="Ma catégorie"
                      onChange={(e) => setForm({ ...form, customCat: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Prix (FCFA) *</label>
                  <input
                    type="number" value={form.price} required min={0}
                    placeholder="3 500"
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Description</label>
                  <input
                    type="text" value={form.description}
                    placeholder="Servi avec frites et salade"
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={inputStyle}
                  />
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
                  Ajouter au menu
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

        {/* Liste par catégorie */}
        {items.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            border: "1px solid #e0e6eb", padding: "80px 32px", textAlign: "center",
          }}>
            <UtensilsCrossed size={48} style={{ color: "#8898aa", marginBottom: 20 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#30313d", marginBottom: 10 }}>
              Votre menu est vide
            </h2>
            <p style={{ fontSize: 14, color: "#6b7c93", marginBottom: 24 }}>
              Ajoutez votre premier plat pour que le bot puisse le proposer à vos clients.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                backgroundColor: "#1a4d2e", color: "#fff",
                border: "none", borderRadius: 8, padding: "10px 24px",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              + Ajouter un plat
            </button>
          </div>
        ) : Object.keys(groupedByCategory).length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e0e6eb",
            padding: "40px", textAlign: "center", color: "#8898aa", fontSize: 14,
          }}>
            Aucun plat dans cette catégorie
          </div>
        ) : (
          Object.entries(groupedByCategory).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: 32 }}>
              {/* Titre catégorie */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, color: "#8898aa",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  {cat}
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: "#f4f5f6" }} />
                <span style={{ fontSize: 11, color: "#8898aa" }}>{catItems.length}</span>
              </div>

              {/* Cards items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#fff", borderRadius: 10,
                      border: "1px solid #f4f5f6",
                      boxShadow: SH.sm,
                      padding: "14px 18px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      opacity: item.is_available ? 1 : 0.55,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {/* Infos plat */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: "#30313d",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        {item.name}
                        {!item.is_available && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 600, color: "#8898aa",
                            backgroundColor: "#f4f5f6", padding: "2px 7px", borderRadius: 4,
                          }}>
                            Indisponible
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div style={{
                          fontSize: 12.5, color: "#8898aa", marginTop: 3,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {item.description}
                        </div>
                      )}
                    </div>

                    {/* Prix + toggle */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, marginLeft: 16 }}>
                      {/* Prix éditable au clic */}
                      {editingId === item.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="number" value={priceVal} min={0} autoFocus
                            onChange={(e) => setPriceVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") savePrice(item.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            style={{
                              width: 80, padding: "5px 8px",
                              border: "1px solid #1a4d2e", borderRadius: 6,
                              fontSize: 13, outline: "none", fontFamily: "inherit",
                              boxSizing: "border-box",
                            }}
                          />
                          <button
                            onClick={() => savePrice(item.id)}
                            style={{
                              background: "none", border: "none",
                              color: "#16a34a", fontWeight: 700, fontSize: 12,
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(item.id); setPriceVal(String(item.price)); }}
                          title="Cliquer pour modifier le prix"
                          style={{
                            background: "none", border: "none",
                            fontSize: 15, fontWeight: 800, color: "#30313d",
                            cursor: "pointer", fontFamily: "inherit",
                            padding: "2px 4px", borderRadius: 4,
                          }}
                        >
                          {fmt(item.price)}
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#6b7c93", marginLeft: 3 }}>FCFA</span>
                        </button>
                      )}

                      {/* Toggle disponibilité */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Toggle
                          on={item.is_available}
                          onChange={() => toggleAvailable(item.id, item.is_available)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 32,
          backgroundColor: "#30313d", color: "#fff",
          padding: "12px 20px", borderRadius: 10,
          fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 999, animation: "none",
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
