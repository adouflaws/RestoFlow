"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

export default function MenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "Plats" });

  const apiBase = `/api/restaurants/${restaurantId}/menu`;

  async function load() {
    const res = await fetch(apiBase);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [restaurantId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const price = parseInt(form.price, 10);
    if (!form.name || isNaN(price)) return;

    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        price,
        category: form.category,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Erreur : " + err.error);
      return;
    }

    setForm({ name: "", description: "", price: "", category: "Plats" });
    setShowForm(false);
    load();
  }

  async function toggleAvailable(id: string, current: boolean) {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, is_available: !current } : m)));

    const res = await fetch(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: id, is_available: !current }),
    });

    if (!res.ok) {
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, is_available: current } : m)));
    }
  }

  async function savePrice(id: string) {
    const price = parseInt(priceValue, 10);
    if (isNaN(price) || price < 0) return;
    const oldPrice = items.find((m) => m.id === id)?.price ?? price;
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, price } : m)));
    setEditingPrice(null);

    const res = await fetch(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: id, price }),
    });

    if (!res.ok) {
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, price: oldPrice } : m)));
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
    marginBottom: 4,
  };

  const categories = [...new Set(items.map((m) => m.category))];

  if (loading) {
    return <div style={{ padding: 32, color: "#999" }}>Chargement du menu...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#111", fontSize: 22, margin: 0 }}>
          Menu ({items.length} plat{items.length > 1 ? "s" : ""})
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: showForm ? "#666" : "#1a4d2e",
            color: "white",
            border: "none",
            padding: "8px 18px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showForm ? "Fermer" : "+ Ajouter un plat"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Nom du plat</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Poulet braisé"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Catégorie</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Plats"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Prix (FCFA)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                min={0}
                placeholder="3500"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Servi avec alloco et salade"
                style={inputStyle}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{
              marginTop: 16,
              backgroundColor: "#1a4d2e",
              color: "white",
              border: "none",
              padding: "8px 20px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ajouter au menu
          </button>
        </form>
      )}

      {categories.map((cat) => (
        <div key={cat} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            {cat}
          </h3>
          {items
            .filter((m) => m.category === cat)
            .map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "14px 20px",
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  opacity: item.is_available ? 1 : 0.5,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{item.name}</div>
                  {item.description && (
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{item.description}</div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {editingPrice === item.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="number"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value)}
                        min={0}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePrice(item.id);
                          if (e.key === "Escape") setEditingPrice(null);
                        }}
                        style={{ width: 70, padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13 }}
                      />
                      <button
                        onClick={() => savePrice(item.id)}
                        style={{ background: "none", border: "none", color: "#1a4d2e", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPrice(item.id);
                        setPriceValue(String(item.price));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111",
                        cursor: "pointer",
                      }}
                      title="Modifier le prix"
                    >
                      {fmt(item.price)} F
                    </button>
                  )}
                  <button
                    onClick={() => toggleAvailable(item.id, item.is_available)}
                    style={{
                      backgroundColor: item.is_available ? "#f0fdf4" : "#f3f4f6",
                      color: item.is_available ? "#15803d" : "#999",
                      border: "none",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {item.is_available ? "Disponible" : "Indisponible"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
