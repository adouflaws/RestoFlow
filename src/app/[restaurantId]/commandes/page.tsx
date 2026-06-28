"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────
interface OrderItem { nom: string; quantite: number; prix_unitaire: number; }

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

interface MenuItemBot { name: string; price: number; category: string; }
interface ConvMsg    { role: "bot" | "client"; text: string; }
type FilterType = "all" | "pending" | "preparing" | "ready" | "delivered";

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

const FILTER_TABS: { id: FilterType; label: string }[] = [
  { id: "all",       label: "Toutes" },
  { id: "pending",   label: "En attente" },
  { id: "preparing", label: "En préparation" },
  { id: "ready",     label: "Prêtes" },
  { id: "delivered", label: "Livrées" },
];

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

function isToday(iso: string)     { return new Date(iso) >= todayStart(); }
function isYesterday(iso: string) {
  const d = new Date(iso);
  return d >= yesterdayStart() && d < todayStart();
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

function timeAgo(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1)  return "il y a moins d'une min";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `il y a ${diffH} h`;
  return `il y a ${Math.floor(diffH / 24)} j`;
}

function renderText(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*[^*]+\*)/);
    return (
      <span key={i}>
        {i > 0 && <br />}
        {parts.map((p, j) =>
          p.startsWith("*") && p.endsWith("*") ? (
            <strong key={j}>{p.slice(1, -1)}</strong>
          ) : (
            <span key={j}>{p}</span>
          )
        )}
      </span>
    );
  });
}

function buildConversation(menu: MenuItemBot[], restoName: string): ConvMsg[] {
  const grouped = menu.reduce<Record<string, MenuItemBot[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] ?? []).push(item);
    return acc;
  }, {});

  const menuLines = Object.entries(grouped)
    .map(([cat, items]) => {
      const lines = items.map((i) => `• ${i.name} — ${fmt(i.price)} FCFA`).join("\n");
      return `*${cat}*\n${lines}`;
    })
    .join("\n\n");

  return [
    { role: "bot",    text: `Bonjour ! 👋 Bienvenue chez *${restoName || "notre restaurant"}*.\n\nTapez *menu* pour voir notre carte.` },
    { role: "client", text: "menu" },
    { role: "bot",    text: `🍽️ *Notre Menu*\n\n${menuLines || "Menu en cours de configuration…"}\n\nEnvoyez le nom du plat pour commander 😊` },
    { role: "client", text: "Je voudrais commander" },
    { role: "bot",    text: "Super ! 🎉 Quel plat vous intéresse ?\n\nExemple : *2 Poulet yassa*" },
    { role: "client", text: "1 Poulet yassa" },
    { role: "bot",    text: "Parfait ! 🛵 Livraison ou retrait sur place ?\n\nRépondez *livraison* ou *sur place*." },
    { role: "client", text: "Livraison stp" },
    { role: "bot",    text: "📍 À quelle adresse livrons-nous ?\nMerci d'indiquer le quartier et un point de repère." },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function CommandesPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  // ── State ──────────────────────────────────────────────────────────────
  const [orders,        setOrders]        = useState<Order[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [hoveredBtn,    setHoveredBtn]    = useState<string | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [restoPhone,    setRestoPhone]    = useState<string | null>(null);
  const [restoName,     setRestoName]     = useState("");

  // #1 Trial
  const [statut,        setStatut]        = useState("");
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  // #3 Filtre
  const [filter,        setFilter]        = useState<FilterType>("all");

  // #4 Activité bot
  const [lastActivity,  setLastActivity]  = useState<Date | null>(null);
  const [activityLabel, setActLabel]      = useState("En attente du premier message");

  // #5 Son
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const soundRef    = useRef(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // #6 Modal aperçu bot
  const [showModal,  setShowModal]  = useState(false);
  const [menuItems,  setMenuItems]  = useState<MenuItemBot[]>([]);
  const [convMsgs,   setConvMsgs]   = useState<ConvMsg[]>([]);

  // ── Chargement restaurant ──────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("restaurants")
      .select("phone, name, statut_abonnement, created_at")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.phone) setRestoPhone(data.phone);
        setRestoName(data.name ?? "");
        setStatut(data.statut_abonnement ?? "");
        if (data.statut_abonnement === "trial" && data.created_at) {
          const expiresAt = new Date(data.created_at);
          expiresAt.setDate(expiresAt.getDate() + 14);
          const days = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000);
          setTrialDaysLeft(days);
        }
      });
  }, [restaurantId]);

  // ── Activité bot (dernière conversation) ──────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("conversations")
      .select("updated_at")
      .eq("restaurant_id", restaurantId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.updated_at) setLastActivity(new Date(data.updated_at));
      });
  }, [restaurantId]);

  // ── Mise à jour label activité toutes les minutes ─────────────────────
  useEffect(() => {
    function update() {
      setActLabel(
        lastActivity
          ? "Dernier message " + timeAgo(lastActivity)
          : "En attente du premier message"
      );
    }
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [lastActivity]);

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

  // ── Supabase Realtime : nouvelles commandes ────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase
      .channel(`orders-live-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prev) => {
            if (prev.some((o) => o.id === newOrder.id)) return prev;
            if (soundRef.current) playBeep();
            return [newOrder, ...prev];
          });
          setLastActivity(new Date());
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // ── Menu pour modal aperçu bot ─────────────────────────────────────────
  useEffect(() => {
    if (!showModal || menuItems.length > 0) return;
    const supabase = createClient();
    supabase
      .from("menu_items")
      .select("name, price, category")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true)
      .order("category")
      .then(({ data }) => {
        const items = (data ?? []) as MenuItemBot[];
        setMenuItems(items);
        setConvMsgs(buildConversation(items, restoName));
      });
  }, [showModal, restaurantId, restoName, menuItems.length]);

  // ── Escape pour fermer la modal ────────────────────────────────────────
  useEffect(() => {
    if (!showModal) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setShowModal(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [showModal]);

  // ── Handlers ──────────────────────────────────────────────────────────
  async function updateStatus(orderId: string, newStatus: string) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
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

  async function copyWhatsApp() {
    if (!restoPhone) return;
    await navigator.clipboard.writeText(restoPhone).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function playBeep() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ctx = ((window as any).AudioContext ?? (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.55);
    } catch { /* silent fail */ }
  }

  function handleSoundToggle() {
    const next = !soundEnabled;
    soundRef.current = next;
    setSoundEnabled(next);
    if (next) playBeep();
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

  // ── Filtrage commandes ─────────────────────────────────────────────────
  const baseOrders     = orders.filter((o) => o.status !== "cancelled");
  const filteredOrders = filter === "all" ? baseOrders : baseOrders.filter((o) => o.status === filter);

  // ── Badge trial (header, seulement si > 7 jours restants) ────────────
  const showTrial   = statut === "trial" && trialDaysLeft !== null && trialDaysLeft > 7;
  const trialUrgent = trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 3;
  const trialBg     = trialUrgent ? "#fef2f2" : "#fff7ed";
  const trialBorder = trialUrgent ? "#fecaca" : "#fed7aa";
  const trialColor  = trialUrgent ? "#dc2626"  : "#c2410c";
  const trialLabel  = trialUrgent
    ? `🔴 Plus que ${trialDaysLeft} jour${(trialDaysLeft ?? 0) > 1 ? "s" : ""} !`
    : `⏳ ${trialDaysLeft} jour${(trialDaysLeft ?? 0) > 1 ? "s" : ""} d'essai restants`;

  // ── Banners (< 7j = orange, expiré / suspendu = rouge) ───────────────
  const showOrangeBanner =
    statut === "trial" && trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 7;
  const showRedBanner =
    (statut === "trial" && trialDaysLeft !== null && trialDaysLeft <= 0) ||
    statut === "suspendu";
  const mailtoUpgrade = `mailto:adouflaws@gmail.com?subject=${encodeURIComponent(
    `Passer en compte actif — ${restoName}`
  )}&body=${encodeURIComponent(
    `Bonjour,\n\nJe souhaite passer mon restaurant "${restoName}" en compte actif RestoFlow.\n\nMerci de me contacter.\n\nCordialement`
  )}`;

  // ── Delta helper ──────────────────────────────────────────────────────
  function Delta({ today, yest }: { today: number; yest: number }) {
    const diff  = today - yest;
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
      <style>{`
        @keyframes rfDot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(.7);} }
      `}</style>

      {/* ─── Header sticky ──────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 28px",
      }}>
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {/* Titre */}
          <div style={{ flexShrink: 0 }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
              Tableau de bord
            </h1>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, marginTop: 1 }}>{dateLabel()}</p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

            {/* #1 Badge trial */}
            {showTrial && (
              <span style={{
                fontSize: 12.5, fontWeight: 700, flexShrink: 0,
                backgroundColor: trialBg, border: `1px solid ${trialBorder}`,
                color: trialColor, padding: "6px 12px", borderRadius: 20,
                whiteSpace: "nowrap" as const,
              }}>
                {trialLabel}
              </span>
            )}

            {/* #4 Bot actif + dernière activité */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                borderRadius: 20, padding: "5px 12px",
              }}>
                <span style={{
                  display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  animation: "rfDot 2s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 12.5, color: "#16a34a", fontWeight: 700 }}>Bot actif</span>
              </div>
              <span style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 3, paddingRight: 4 }}>
                {activityLabel}
              </span>
            </div>

            {/* #5 Toggle son */}
            <button
              onClick={handleSoundToggle}
              title={soundEnabled ? "Désactiver les notifications sonores" : "Activer les notifications sonores"}
              style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                border: "1px solid #e2e8f0",
                backgroundColor: soundEnabled ? "#f0fdf4" : "#f8fafc",
                fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              {soundEnabled ? "🔔" : "🔕"}
            </button>

            {/* #6 Bouton aperçu bot */}
            <button
              onClick={() => setShowModal(true)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
              style={{
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "7px 14px", backgroundColor: "#fff",
                fontSize: 13, fontWeight: 600, color: "#334155",
                cursor: "pointer", transition: "background-color 0.15s",
                fontFamily: "inherit",
              }}
            >
              🤖 Aperçu bot
            </button>

            {/* WhatsApp */}
            <button
              onClick={copyWhatsApp}
              disabled={!restoPhone}
              onMouseEnter={(e) => { if (restoPhone) e.currentTarget.style.backgroundColor = "#16a34a"; }}
              onMouseLeave={(e) => { if (restoPhone) e.currentTarget.style.backgroundColor = "#1a4d2e"; }}
              style={{
                display: "flex", alignItems: "center", gap: 7, flexShrink: 0,
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
        </div>
      </header>

      {/* ─── Banner orange : < 7 jours restants ────────────────────── */}
      {showOrangeBanner && (
        <div style={{
          backgroundColor: "#fff7ed",
          borderBottom: "1px solid #fed7aa",
          padding: "14px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#c2410c" }}>
                Votre période d&apos;essai expire dans{" "}
                {trialDaysLeft} jour{(trialDaysLeft ?? 0) > 1 ? "s" : ""}
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: "#9a3412", marginTop: 2 }}>
                Passez en compte actif pour continuer à utiliser votre bot WhatsApp sans interruption.
              </p>
            </div>
          </div>
          <a
            href={mailtoUpgrade}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
              backgroundColor: "#c2410c", color: "#fff",
              borderRadius: 8, padding: "8px 18px",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}
          >
            Passer en compte actif →
          </a>
        </div>
      )}

      {/* ─── Banner rouge : expiré ou suspendu ──────────────────────── */}
      {showRedBanner && (
        <div style={{
          backgroundColor: "#fef2f2",
          borderBottom: "1px solid #fecaca",
          padding: "14px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🚫</span>
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#dc2626" }}>
                Votre essai a expiré — Votre bot est suspendu
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: "#991b1b", marginTop: 2 }}>
                Les messages WhatsApp de vos clients ne sont plus traités. Contactez-nous pour réactiver.
              </p>
            </div>
          </div>
          <a
            href="mailto:adouflaws@gmail.com?subject=R%C3%A9activation%20abonnement%20RestoFlow"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
              backgroundColor: "#dc2626", color: "#fff",
              borderRadius: 8, padding: "8px 18px",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}
          >
            Contacter RestoFlow →
          </a>
        </div>
      )}

      {/* ─── Contenu ────────────────────────────────────────────────── */}
      <div style={{ padding: "28px 32px" }}>

        {/* ─── KPI cards ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {([
            { icon: "💰", label: "CA du jour",              border: "#22c55e", value: `${fmt(kpiCA)} FCFA`, delta: <Delta today={kpiCA} yest={ykpiCA} /> },
            { icon: "📦", label: "Commandes aujourd'hui",   border: "#3b82f6", value: String(kpiTotal),     delta: <Delta today={kpiTotal} yest={ykpiTotal} /> },
            { icon: "⏳", label: "En attente / préparation",border: "#f59e0b", value: String(kpiPending),   delta: <Delta today={kpiPending} yest={ykpiPending} /> },
            { icon: "✅", label: "Livrées",                 border: "#94a3b8", value: String(kpiDone),      delta: <Delta today={kpiDone} yest={ykpiDone} /> },
          ] as const).map(({ icon, label, border, value, delta }) => (
            <div key={label} style={{
              backgroundColor: "#fff", borderRadius: 12,
              borderLeft: `4px solid ${border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
              padding: "20px 20px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>{label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", marginBottom: 6 }}>{value}</div>
              {delta}
            </div>
          ))}
        </div>

        {/* #3 ── Filtres par statut ────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const }}>
          {FILTER_TABS.map(({ id, label }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: "7px 16px", borderRadius: 20,
                  border: active ? "none" : "1px solid #e2e8f0",
                  backgroundColor: active ? "#1a4d2e" : "#fff",
                  color: active ? "#fff" : "#64748b",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: "pointer", transition: "all 0.12s",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ─── Section commandes ──────────────────────────────────── */}
        {orders.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            padding: "80px 32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 20, letterSpacing: 4 }}>📱 → 🤖 → ✅</div>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {filter === "all"
                  ? "Toutes les commandes"
                  : (FILTER_TABS.find((f) => f.id === filter)?.label ?? "")}
              </h2>
              <span style={{
                backgroundColor: "#0f172a", color: "#fff",
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
              }}>
                {filteredOrders.length}
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{
                backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                padding: "40px 24px", textAlign: "center", color: "#94a3b8", fontSize: 14,
              }}>
                Aucune commande dans cette catégorie
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {filteredOrders.map((order, idx) => {
                  const badge  = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
                  const next   = nextStatus(order.status);
                  const action = next ? ACTION_BTN[order.status] : null;
                  const time   = new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                  const isHov  = hoveredBtn === order.id;

                  return (
                    <div key={order.id} style={{
                      backgroundColor: "#fff", borderRadius: 12,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
                      overflow: "hidden", border: "1px solid #f1f5f9",
                    }}>
                      {/* En-tête card */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 18px 12px", borderBottom: "1px solid #f1f5f9",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{orderNum(idx)}</span>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>· {time}</span>
                        </div>
                        <span style={{
                          backgroundColor: badge.bg, color: badge.color,
                          fontSize: 11.5, fontWeight: 700,
                          padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap" as const,
                        }}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Client */}
                      <div style={{ padding: "10px 18px 8px", borderBottom: "1px solid #f1f5f9" }}>
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
                        {order.items.map((item, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "4px 0",
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
                          padding: "8px 18px", borderTop: "1px solid #f1f5f9",
                          fontSize: 12, color: "#64748b", backgroundColor: "#fafafa",
                        }}>
                          🚚 {order.zone_livraison}
                          {order.adresse_livraison && ` — ${order.adresse_livraison}`}
                          {order.frais_livraison
                            ? <span style={{ color: "#94a3b8" }}> (+{fmt(order.frais_livraison)} F)</span>
                            : null}
                        </div>
                      )}

                      {/* Total + action */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 18px", borderTop: "1px solid #f1f5f9",
                      }}>
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                            {fmt(order.total)}{" "}
                            <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>FCFA</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{payLabel(order.mode_paiement)}</div>
                        </div>

                        {action && next && (
                          <button
                            onClick={() => updateStatus(order.id, next)}
                            onMouseEnter={() => setHoveredBtn(order.id)}
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

      {/* ─── #6 Modal aperçu bot (WhatsApp) ────────────────────────── */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            width: 360, height: 620, borderRadius: 16, overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
          }}>
            {/* Header WhatsApp */}
            <div style={{
              backgroundColor: "#075e54", height: 60, flexShrink: 0,
              display: "flex", alignItems: "center", padding: "0 14px", gap: 12,
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none", border: "none",
                  color: "rgba(255,255,255,0.8)", fontSize: 20,
                  cursor: "pointer", padding: 4, lineHeight: 1, fontFamily: "inherit",
                }}
              >
                ←
              </button>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                backgroundColor: "#25d366",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                  {restoName || "Mon Restaurant"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  Simulation — Bot WhatsApp
                </div>
              </div>
            </div>

            {/* Zone messages */}
            <div style={{
              flex: 1, overflowY: "auto",
              backgroundColor: "#e5ddd5",
              padding: "10px",
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              {convMsgs.map((msg, i) => {
                const isBot = msg.role === "bot";
                return (
                  <div key={i} style={{ display: "flex", justifyContent: isBot ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "76%",
                      backgroundColor: isBot ? "#dcf8c6" : "#fff",
                      borderRadius: isBot ? "12px 12px 0 12px" : "12px 12px 12px 0",
                      padding: "7px 12px 8px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                      fontSize: 13, lineHeight: 1.5, color: "#111b21",
                    }}>
                      <div style={{ wordBreak: "break-word" as const }}>{renderText(msg.text)}</div>
                      <div style={{ fontSize: 10.5, color: "#667781", textAlign: "right" as const, marginTop: 3 }}>
                        {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {isBot && <span style={{ marginLeft: 3 }}>✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Zone saisie (simulation non interactive) */}
            <div style={{
              backgroundColor: "#f0f2f5", height: 54, flexShrink: 0,
              display: "flex", alignItems: "center",
              padding: "0 12px", gap: 10,
              borderTop: "1px solid #d1d7db",
            }}>
              <div style={{
                flex: 1, backgroundColor: "#fff", borderRadius: 20,
                padding: "8px 14px", fontSize: 13, color: "#8696a0",
              }}>
                Tapez un message…
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                backgroundColor: "#00a884",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, opacity: 0.45, cursor: "not-allowed",
              }}>
                ➤
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
