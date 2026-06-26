"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Palette ───────────────────────────────────────────────────────────────
const G = "#1a4d2e";
const GL = "#edf7f1";
const GB = "#c3dece";
const TX = "#111827";
const SB = "#6b7280";
const BR = "#e5e7eb";
const BG = "#f9fafb";
const RD = "#dc2626";

// ─── Types ─────────────────────────────────────────────────────────────────
type DaySlot = { open: boolean; start: string; end: string };
type MenuItem = { name: string; price: string; category: string };
type Zone = { nom: string; frais: string };

// ─── Constantes ────────────────────────────────────────────────────────────
const DAYS = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

const CATEGORIES = ["Plat", "Boisson", "Dessert", "Entrée", "Accompagnement"];

const DEFAULT_HOURS: Record<string, DaySlot> = {
  lundi:    { open: true,  start: "08:00", end: "22:00" },
  mardi:    { open: true,  start: "08:00", end: "22:00" },
  mercredi: { open: true,  start: "08:00", end: "22:00" },
  jeudi:    { open: true,  start: "08:00", end: "22:00" },
  vendredi: { open: true,  start: "08:00", end: "22:00" },
  samedi:   { open: true,  start: "08:00", end: "22:00" },
  dimanche: { open: false, start: "08:00", end: "22:00" },
};

const STEP_LABELS = ["Bienvenue", "Profil", "Horaires", "Menu", "Livraison", "Terminé"];

// ─── Composants partagés ───────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  height: 44, width: "100%", borderRadius: 8,
  border: `1px solid ${BR}`, padding: "0 14px",
  fontSize: 14, color: TX, outline: "none",
  backgroundColor: "#fff", boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelSt: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6,
};

function Tip({ text }: { text: string }) {
  return (
    <div style={{
      backgroundColor: GL, border: `1px solid ${GB}`,
      borderRadius: 10, padding: "14px 18px", marginTop: 24,
      fontSize: 13, color: G, lineHeight: 1.7,
      display: "flex", gap: 10, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
      <span>{text}</span>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [restoName, setRestoName] = useState("");

  // ── Step 2 ──
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");

  // ── Step 3 ──
  const [hours, setHours] = useState<Record<string, DaySlot>>({ ...DEFAULT_HOURS });

  // ── Step 4 ──
  const [items, setItems] = useState<MenuItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCat, setItemCat] = useState("Plat");

  // ── Step 5 ──
  const [hasDelivery, setHasDelivery] = useState<boolean | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneName, setZoneName] = useState("");
  const [zoneFrais, setZoneFrais] = useState("");

  // ── Chargement données existantes ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("restaurants")
        .select("name, address, phone, description, opening_hours, onboarding_completed")
        .eq("id", restaurantId)
        .single();
      if (!data) return;
      if (data.onboarding_completed) {
        router.replace(`/${restaurantId}/commandes`);
        return;
      }
      setRestoName(data.name ?? "");
      setName(data.name ?? "");
      setAddress(data.address ?? "");
      setPhone(data.phone ?? "");
      setSpecialty(data.description ?? "");
      if (data.opening_hours && typeof data.opening_hours === "object") {
        const raw = data.opening_hours as Record<string, string>;
        const merged = { ...DEFAULT_HOURS };
        for (const { key } of DAYS) {
          const slot = raw[key];
          if (slot) {
            const [s, e] = slot.split("-");
            merged[key] = { open: true, start: s?.trim() ?? "08:00", end: e?.trim() ?? "22:00" };
          } else if (key in raw) {
            merged[key] = { ...merged[key], open: false };
          }
        }
        setHours(merged);
      }
    }
    load();
  }, [restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── API save ───────────────────────────────────────────────────────────
  async function apiSave(stepNum: number, data: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    setError("");
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: stepNum, restaurantId, data }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError("Erreur d'enregistrement : " + (j.error ?? "inconnue"));
      return false;
    }
    return true;
  }

  // ── Validation & next ──────────────────────────────────────────────────
  function isNextDisabled(): boolean {
    if (saving) return true;
    if (step === 2) return !name.trim() || !address.trim();
    if (step === 4) return items.length === 0;
    if (step === 5) return hasDelivery === null;
    return false;
  }

  async function handleNext() {
    setError("");
    let ok = true;

    if (step === 2) {
      ok = await apiSave(2, { name: name.trim(), address: address.trim(), phone: phone.trim(), specialty: specialty.trim() });
      if (ok) setRestoName(name.trim());
    } else if (step === 3) {
      const opening_hours: Record<string, string> = {};
      for (const { key } of DAYS) {
        if (hours[key]?.open) opening_hours[key] = `${hours[key].start}-${hours[key].end}`;
      }
      ok = await apiSave(3, { opening_hours });
    } else if (step === 4) {
      ok = await apiSave(4, { items });
    } else if (step === 5) {
      ok = await apiSave(5, { zones: hasDelivery ? zones : [] });
      if (ok) ok = await apiSave(6, {});
    } else if (step === 6) {
      router.push(`/${restaurantId}/commandes`);
      return;
    }

    if (ok) setStep((s) => s + 1);
  }

  function handlePrev() {
    setError("");
    setStep((s) => s - 1);
  }

  // ── Helpers menu ───────────────────────────────────────────────────────
  function addItem() {
    if (!itemName.trim() || !itemPrice.trim()) return;
    setItems((p) => [...p, { name: itemName.trim(), price: itemPrice.trim(), category: itemCat }]);
    setItemName(""); setItemPrice(""); setItemCat("Plat");
  }

  function removeItem(i: number) {
    setItems((p) => p.filter((_, idx) => idx !== i));
  }

  // ── Helpers zones ──────────────────────────────────────────────────────
  function addZone() {
    if (!zoneName.trim() || !zoneFrais.trim()) return;
    setZones((p) => [...p, { nom: zoneName.trim(), frais: zoneFrais.trim() }]);
    setZoneName(""); setZoneFrais("");
  }

  function removeZone(i: number) {
    setZones((p) => p.filter((_, idx) => idx !== i));
  }

  function setDay<K extends keyof DaySlot>(day: string, key: K, value: DaySlot[K]) {
    setHours((p) => ({ ...p, [day]: { ...p[day], [key]: value } }));
  }

  // ─── Rendu : Barre de progression ─────────────────────────────────────
  function renderProgress() {
    return (
      <div style={{
        backgroundColor: "#fff",
        borderBottom: `1px solid ${BR}`,
        padding: "18px 24px",
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 660, margin: "0 auto",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
        }}>
          {STEP_LABELS.map((label, idx) => {
            const num = idx + 1;
            const done = step > num;
            const active = step === num;
            return (
              <div key={num} style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: done || active ? G : "#e5e7eb",
                    color: done || active ? "#fff" : "#9ca3af",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: done ? 15 : 13, fontWeight: 700,
                    boxShadow: active ? `0 0 0 3px ${GL}, 0 0 0 5px ${GB}` : "none",
                    transition: "all 0.25s",
                  }}>
                    {done ? "✓" : num}
                  </div>
                  <span style={{
                    fontSize: 10, whiteSpace: "nowrap",
                    color: active ? G : done ? "#374151" : "#9ca3af",
                    fontWeight: active ? 700 : 400,
                  }}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div style={{
                    width: 52, height: 2, marginTop: 16, flexShrink: 0,
                    backgroundColor: step > num ? G : "#e5e7eb",
                    transition: "background-color 0.25s",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Étape 1 : Bienvenue ────────────────────────────────────────────────
  function renderStep1() {
    return (
      <div style={{ textAlign: "center", paddingTop: 12 }}>
        <div style={{ fontSize: 72, marginBottom: 20, lineHeight: 1 }}>🤖</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: TX, marginBottom: 12, lineHeight: 1.3 }}>
          Bienvenue sur <span style={{ color: G }}>RestoFlow</span>
          {restoName ? `, ${restoName}` : ""} !
        </h1>
        <p style={{ fontSize: 15, color: SB, lineHeight: 1.7, maxWidth: 440, margin: "0 auto 36px" }}>
          Configurez votre assistant WhatsApp en <strong style={{ color: TX }}>5 minutes</strong>. Il répondra à vos clients automatiquement, 24h/24 — même quand vous dormez.
        </p>

        <div style={{
          display: "inline-block", textAlign: "left",
          backgroundColor: BG, border: `1px solid ${BR}`,
          borderRadius: 16, padding: "28px 36px", marginBottom: 36,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: SB, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
            Ce qu'on va configurer ensemble :
          </p>
          {[
            ["🏪", "Profil du restaurant",     "Nom, adresse, spécialité"],
            ["🕐", "Horaires d'ouverture",      "7 jours, heure par heure"],
            ["🍽️", "Menu & prix",              "Plats, boissons, prix en FCFA"],
            ["🛵", "Zones de livraison",        "Quartiers et frais de livraison"],
            ["✅", "Assistant WhatsApp actif", "Prêt à recevoir des commandes"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 24, width: 32, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TX }}>{title}</div>
                <div style={{ fontSize: 12, color: SB }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: SB }}>
          Vos données sont sauvegardées automatiquement à chaque étape.
        </p>
      </div>
    );
  }

  // ─── Étape 2 : Profil ───────────────────────────────────────────────────
  function renderStep2() {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: TX, marginBottom: 8 }}>
            Parlez-nous de votre restaurant
          </h1>
          <p style={{ fontSize: 14, color: SB, lineHeight: 1.7 }}>
            Ces informations permettront à votre bot de répondre aux questions de vos clients.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelSt}>Nom du restaurant <span style={{ color: RD }}>*</span></label>
            <input
              style={inputSt}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Le Palais du Manding"
            />
          </div>

          <div>
            <label style={labelSt}>Adresse complète <span style={{ color: RD }}>*</span></label>
            <input
              style={inputSt}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex : Hamdallaye ACI 2000, Bamako"
            />
          </div>

          <div>
            <label style={labelSt}>
              Numéro WhatsApp public{" "}
              <span style={{ fontSize: 11, color: SB, fontWeight: 400 }}>(affiché aux clients)</span>
            </label>
            <input
              style={inputSt}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex : +22376000000"
              type="tel"
            />
          </div>

          <div>
            <label style={labelSt}>
              Spécialité{" "}
              <span style={{ fontSize: 11, color: SB, fontWeight: 400 }}>(cuisine, type de restauration…)</span>
            </label>
            <input
              style={inputSt}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex : Cuisine malienne traditionnelle, Grillades, Fast food…"
            />
          </div>
        </div>

        <Tip text="Ces informations sont utilisées par votre assistant quand un client demande 'Où êtes-vous ?' ou 'Quelle est votre spécialité ?'." />
      </div>
    );
  }

  // ─── Étape 3 : Horaires ─────────────────────────────────────────────────
  function renderStep3() {
    const openCount = Object.values(hours).filter((h) => h.open).length;
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: TX, marginBottom: 8 }}>
            Quand êtes-vous ouvert ?
          </h1>
          <p style={{ fontSize: 14, color: SB, lineHeight: 1.7 }}>
            Activez chaque jour d'ouverture et définissez vos heures. Votre bot informera les clients si vous êtes fermés.
          </p>
        </div>

        <div style={{ border: `1px solid ${BR}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
          {DAYS.map(({ key, label }, idx) => {
            const h = hours[key];
            return (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 20px",
                  backgroundColor: idx % 2 === 0 ? "#fff" : BG,
                  borderBottom: idx < DAYS.length - 1 ? `1px solid ${BR}` : "none",
                }}
              >
                <span style={{ width: 90, fontSize: 13, fontWeight: 600, color: TX, flexShrink: 0 }}>
                  {label}
                </span>

                {/* Toggle */}
                <div
                  onClick={() => setDay(key, "open", !h.open)}
                  title={h.open ? "Cliquer pour fermer" : "Cliquer pour ouvrir"}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: "pointer", flexShrink: 0,
                    backgroundColor: h.open ? G : "#d1d5db",
                    position: "relative", transition: "background-color 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
                    backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    left: h.open ? 23 : 3, transition: "left 0.2s",
                  }} />
                </div>

                <span style={{ fontSize: 12, fontWeight: 700, width: 44, flexShrink: 0, color: h.open ? G : "#9ca3af" }}>
                  {h.open ? "Ouvert" : "Fermé"}
                </span>

                {h.open && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <input
                      type="time"
                      value={h.start}
                      onChange={(e) => setDay(key, "start", e.target.value)}
                      style={{ ...inputSt, height: 36, width: 110, fontSize: 13, flex: "0 0 auto" }}
                    />
                    <span style={{ color: SB, fontSize: 14, flexShrink: 0 }}>→</span>
                    <input
                      type="time"
                      value={h.end}
                      onChange={(e) => setDay(key, "end", e.target.value)}
                      style={{ ...inputSt, height: 36, width: 110, fontSize: 13, flex: "0 0 auto" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          backgroundColor: GL, border: `1px solid ${GB}`, borderRadius: 10,
          padding: "12px 16px", fontSize: 13, color: G, textAlign: "center",
        }}>
          {openCount === 0
            ? "⚠️ Aucun jour d'ouverture sélectionné"
            : `✓ Ouvert ${openCount} jour${openCount > 1 ? "s" : ""} par semaine`}
        </div>

        <Tip text="Votre bot dira automatiquement aux clients quand vous êtes fermés et à quelle heure vous rouvrez." />
      </div>
    );
  }

  // ─── Étape 4 : Menu ─────────────────────────────────────────────────────
  function renderStep4() {
    const canAdd = itemName.trim().length > 0 && itemPrice.trim().length > 0;
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: TX, marginBottom: 8 }}>
            Ajoutez vos plats
          </h1>
          <p style={{ fontSize: 14, color: SB, lineHeight: 1.7 }}>
            Votre bot ne proposera que les plats listés ici. Vous pourrez modifier le menu à tout moment.
          </p>
        </div>

        {/* Formulaire d'ajout */}
        <div style={{
          backgroundColor: BG, border: `1px solid ${BR}`,
          borderRadius: 14, padding: "20px", marginBottom: 20,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: SB, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
            Nouveau plat
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 130px", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelSt}>Nom du plat</label>
              <input
                style={inputSt}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ex : Poulet yassa"
                onKeyDown={(e) => e.key === "Enter" && canAdd && addItem()}
              />
            </div>
            <div>
              <label style={labelSt}>Prix (FCFA)</label>
              <input
                style={{ ...inputSt, width: "100%" }}
                type="number"
                min="0"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="2500"
                onKeyDown={(e) => e.key === "Enter" && canAdd && addItem()}
              />
            </div>
            <div>
              <label style={labelSt}>Catégorie</label>
              <select
                style={{ ...inputSt, width: "100%", cursor: "pointer" }}
                value={itemCat}
                onChange={(e) => setItemCat(e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={addItem}
            disabled={!canAdd}
            style={{
              backgroundColor: canAdd ? G : "#e5e7eb",
              color: canAdd ? "#fff" : "#9ca3af",
              border: "none", borderRadius: 8, padding: "10px 22px",
              fontSize: 13, fontWeight: 700, cursor: canAdd ? "pointer" : "not-allowed",
              transition: "background-color 0.15s",
            }}
          >
            + Ajouter ce plat
          </button>
        </div>

        {/* Liste des plats */}
        {items.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "36px 0",
            border: `2px dashed ${BR}`, borderRadius: 14,
            color: SB, fontSize: 14,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            Aucun plat ajouté — ajoutez au moins 1 plat pour continuer
          </div>
        ) : (
          <div style={{ border: `1px solid ${BR}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 18px",
                  backgroundColor: i % 2 === 0 ? "#fff" : BG,
                  borderBottom: i < items.length - 1 ? `1px solid ${BR}` : "none",
                }}
              >
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: TX }}>{item.name}</span>
                  <span style={{
                    fontSize: 11, color: "#fff", backgroundColor: G,
                    borderRadius: 20, padding: "2px 8px", marginLeft: 8, fontWeight: 600,
                  }}>
                    {item.category}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: G }}>
                    {parseInt(item.price).toLocaleString("fr-FR")} FCFA
                  </span>
                  <button
                    onClick={() => removeItem(i)}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", border: "none",
                      backgroundColor: "#fee2e2", color: RD, cursor: "pointer",
                      fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1, fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            <div style={{
              padding: "10px 18px", backgroundColor: GL,
              borderTop: `1px solid ${GB}`,
              fontSize: 12, color: G, fontWeight: 600,
            }}>
              {items.length} plat{items.length > 1 ? "s" : ""} au total
            </div>
          </div>
        )}

        <Tip text="Commencez par vos 5 plats les plus commandés. Vous pourrez compléter votre menu depuis la page Menu du dashboard." />
      </div>
    );
  }

  // ─── Étape 5 : Livraison ────────────────────────────────────────────────
  function renderStep5() {
    const canAddZone = zoneName.trim().length > 0 && zoneFrais.trim().length > 0;
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: TX, marginBottom: 8 }}>
            Proposez-vous la livraison ?
          </h1>
          <p style={{ fontSize: 14, color: SB, lineHeight: 1.7 }}>
            Votre bot gérera les commandes en livraison ou à emporter selon votre choix.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          {[
            { value: true,  icon: "🛵", title: "Oui, je livre",    desc: "Je propose la livraison à domicile dans certains quartiers" },
            { value: false, icon: "🏪", title: "Non, à emporter",  desc: "Les clients viennent chercher leur commande au restaurant" },
          ].map((opt) => (
            <div
              key={String(opt.value)}
              onClick={() => setHasDelivery(opt.value)}
              style={{
                border: `2px solid ${hasDelivery === opt.value ? G : BR}`,
                backgroundColor: hasDelivery === opt.value ? GL : "#fff",
                borderRadius: 14, padding: "22px 18px", cursor: "pointer",
                textAlign: "center", transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 10 }}>{opt.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TX, marginBottom: 6 }}>{opt.title}</div>
              <div style={{ fontSize: 12, color: SB, lineHeight: 1.5 }}>{opt.desc}</div>
              {hasDelivery === opt.value && (
                <div style={{
                  marginTop: 12, fontSize: 12, color: G, fontWeight: 700,
                  backgroundColor: "#fff", borderRadius: 20, padding: "3px 10px",
                  display: "inline-block", border: `1px solid ${GB}`,
                }}>
                  ✓ Sélectionné
                </div>
              )}
            </div>
          ))}
        </div>

        {hasDelivery === true && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: TX, marginBottom: 14 }}>
              Zones de livraison{" "}
              <span style={{ fontSize: 12, color: SB, fontWeight: 400 }}>(quartiers desservis)</span>
            </p>

            <div style={{
              backgroundColor: BG, border: `1px solid ${BR}`,
              borderRadius: 14, padding: "20px", marginBottom: 16,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelSt}>Nom du quartier</label>
                  <input
                    style={inputSt}
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="Ex : Hamdallaye"
                    onKeyDown={(e) => e.key === "Enter" && canAddZone && addZone()}
                  />
                </div>
                <div>
                  <label style={labelSt}>Frais (FCFA)</label>
                  <input
                    style={{ ...inputSt, width: "100%" }}
                    type="number"
                    min="0"
                    value={zoneFrais}
                    onChange={(e) => setZoneFrais(e.target.value)}
                    placeholder="500"
                    onKeyDown={(e) => e.key === "Enter" && canAddZone && addZone()}
                  />
                </div>
              </div>
              <button
                onClick={addZone}
                disabled={!canAddZone}
                style={{
                  backgroundColor: canAddZone ? G : "#e5e7eb",
                  color: canAddZone ? "#fff" : "#9ca3af",
                  border: "none", borderRadius: 8, padding: "10px 22px",
                  fontSize: 13, fontWeight: 700, cursor: canAddZone ? "pointer" : "not-allowed",
                }}
              >
                + Ajouter une zone
              </button>
            </div>

            {zones.length > 0 && (
              <div style={{ border: `1px solid ${BR}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
                {zones.map((z, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 18px",
                      backgroundColor: i % 2 === 0 ? "#fff" : BG,
                      borderBottom: i < zones.length - 1 ? `1px solid ${BR}` : "none",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: TX }}>
                      📍 {z.nom}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: G }}>
                        {parseInt(z.frais).toLocaleString("fr-FR")} FCFA
                      </span>
                      <button
                        onClick={() => removeZone(i)}
                        style={{
                          width: 28, height: 28, borderRadius: "50%", border: "none",
                          backgroundColor: "#fee2e2", color: RD, cursor: "pointer",
                          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                          lineHeight: 1, fontWeight: 700,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {zones.length === 0 && (
              <div style={{
                textAlign: "center", padding: "24px", border: `2px dashed ${BR}`,
                borderRadius: 14, color: SB, fontSize: 13, marginBottom: 16,
              }}>
                Aucune zone ajoutée — vous pouvez en ajouter plus tard depuis le dashboard
              </div>
            )}
          </div>
        )}

        {hasDelivery === false && (
          <div style={{
            backgroundColor: GL, border: `1px solid ${GB}`,
            borderRadius: 12, padding: "20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ fontSize: 14, color: G, fontWeight: 600, margin: 0 }}>
              Parfait ! Votre bot précisera aux clients qu'ils doivent venir récupérer leur commande sur place.
            </p>
          </div>
        )}

        <Tip text="Vous pourrez ajouter, modifier ou supprimer des zones de livraison à tout moment depuis le dashboard." />
      </div>
    );
  }

  // ─── Étape 6 : Terminé ──────────────────────────────────────────────────
  function renderStep6() {
    const openDays = Object.values(hours).filter((h) => h.open).length;
    return (
      <div style={{ textAlign: "center", paddingTop: 12 }}>
        {/* Cercle vert succès */}
        <div style={{
          width: 88, height: 88, borderRadius: "50%", backgroundColor: G,
          margin: "0 auto 24px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, color: "#fff",
          boxShadow: `0 0 0 12px ${GL}, 0 0 0 16px ${GB}`,
        }}>
          ✓
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: TX, marginBottom: 10 }}>
          Félicitations ! 🎉
        </h1>
        <p style={{ fontSize: 15, color: SB, lineHeight: 1.7, marginBottom: 36 }}>
          Votre assistant WhatsApp est configuré et prêt à recevoir des commandes.
        </p>

        {/* Résumé */}
        <div style={{
          border: `1px solid ${BR}`, borderRadius: 16, padding: "28px 32px",
          textAlign: "left", marginBottom: 28, backgroundColor: BG,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: SB, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
            Résumé de votre configuration
          </p>
          {[
            ["🏪", "Restaurant",           restoName || name || "—"],
            ["🍽️", "Plats configurés",    `${items.length} plat${items.length > 1 ? "s" : ""}`],
            ["🕐", "Jours d'ouverture",    `${openDays} jour${openDays > 1 ? "s" : ""} par semaine`],
            ["🛵", "Mode de livraison",
              hasDelivery
                ? (zones.length > 0 ? `${zones.length} zone${zones.length > 1 ? "s" : ""} de livraison` : "Livraison (zones à configurer)")
                : "À emporter uniquement",
            ],
          ].map(([icon, label, value]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 26, width: 34, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 12, color: SB }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: TX }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Appel à l'action */}
        <div style={{
          backgroundColor: GL, border: `1px solid ${GB}`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 8,
        }}>
          <p style={{ fontSize: 14, color: G, lineHeight: 1.7, margin: 0, fontWeight: 600 }}>
            📣 Partagez votre numéro WhatsApp Business avec vos clients.<br />
            <span style={{ fontWeight: 400 }}>Ils peuvent déjà passer des commandes automatiquement !</span>
          </p>
        </div>
      </div>
    );
  }

  // ─── Rendu global ──────────────────────────────────────────────────────
  const steps = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];
  const showPrev = step > 1 && step < 6;
  const disabled = isNextDisabled();
  const nextLabel =
    step === 1 ? "Commencer la configuration →"
    : step === 5 ? "Terminer la configuration ✓"
    : step === 6 ? "Accéder à mon dashboard →"
    : "Suivant →";

  return (
    /* Overlay plein écran (flex colonne) par-dessus le layout sidebar */
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "#fff", zIndex: 1000,
      fontFamily: "system-ui, Arial, sans-serif",
      display: "flex", flexDirection: "column",
    }}>
      {/* Barre de progression — haut, sans scroll */}
      {renderProgress()}

      {/* Zone de contenu scrollable */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "44px 28px 32px" }}>
          {steps[step - 1]()}

          {error && (
            <div style={{
              marginTop: 24, padding: "12px 16px", borderRadius: 10,
              backgroundColor: "#fef2f2", border: "1px solid #fecaca",
              color: RD, fontSize: 13, lineHeight: 1.6,
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Barre de navigation — bas, sans scroll */}
      <div style={{
        flexShrink: 0, backgroundColor: "#fff", borderTop: `1px solid ${BR}`,
        padding: "16px 32px",
        display: "flex",
        justifyContent: step === 1 || step === 6 ? "center" : "space-between",
        alignItems: "center", gap: 12,
      }}>
        {showPrev && (
          <button
            onClick={handlePrev}
            disabled={saving}
            style={{
              backgroundColor: "#fff", color: TX,
              border: `1px solid ${BR}`, borderRadius: 8,
              padding: "12px 28px", fontSize: 14, fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            ← Précédent
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={disabled}
          style={{
            backgroundColor: disabled ? "#e5e7eb" : G,
            color: disabled ? "#9ca3af" : "#fff",
            border: "none", borderRadius: 8,
            padding: step === 1 || step === 6 ? "14px 40px" : "12px 28px",
            fontSize: step === 1 || step === 6 ? 15 : 14,
            fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
            minWidth: 220, transition: "background-color 0.15s",
            opacity: saving ? 0.75 : 1,
          }}
        >
          {saving ? "Enregistrement…" : nextLabel}
        </button>
      </div>
    </div>
  );
}
