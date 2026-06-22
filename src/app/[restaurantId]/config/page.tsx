"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface OpeningHours {
  [day: string]: string;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function ConfigPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    opening_hours: {} as OpeningHours,
  });
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase
      .from("restaurants")
      .select("name, address, phone, description, opening_hours")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name ?? "",
            address: data.address ?? "",
            phone: data.phone ?? "",
            description: data.description ?? "",
            opening_hours: (data.opening_hours as OpeningHours) ?? {},
          });
        }
        setLoading(false);
      });
  }, [restaurantId, supabase]);

  function setHours(day: string, value: string) {
    setForm({ ...form, opening_hours: { ...form.opening_hours, [day]: value } });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase
      .from("restaurants")
      .update({
        name: form.name,
        address: form.address,
        phone: form.phone,
        description: form.description,
        opening_hours: form.opening_hours,
      })
      .eq("id", restaurantId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
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

  if (loading) {
    return <div style={{ padding: 32, color: "#999" }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: 32, maxWidth: 600 }}>
      <h1 style={{ color: "#111", fontSize: 22, marginBottom: 24, marginTop: 0 }}>Configuration</h1>

      <form onSubmit={handleSave}>
        {/* Infos générales */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#999", textTransform: "uppercase", marginTop: 0, marginBottom: 16 }}>
            Restaurant
          </h3>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nom du restaurant</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Hamdallaye ACI 2000, Bamako"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+223 XX XX XX XX"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description / Message d&apos;accueil</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Bienvenue chez nous !"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Horaires */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#999", textTransform: "uppercase", marginTop: 0, marginBottom: 16 }}>
            Horaires d&apos;ouverture
          </h3>

          {DAYS.map((day) => (
            <div
              key={day}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <span style={{ width: 90, fontSize: 14, fontWeight: 500, color: "#333" }}>{day}</span>
              <input
                type="text"
                value={form.opening_hours[day] ?? ""}
                onChange={(e) => setHours(day, e.target.value)}
                placeholder="08:00 - 22:00"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: "100%",
            padding: "12px 0",
            backgroundColor: saved ? "#15803d" : "#1a4d2e",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saved ? "✓ Enregistré" : saving ? "Enregistrement..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}
