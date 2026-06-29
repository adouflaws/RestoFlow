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

// ─── Stripe design tokens ─────────────────────────────────────────────────
const T = {
  brand:       "#1a4d2e",
  brandLight:  "#16a34a",
  textPrimary: "#30313d",
  textSec:     "#6b7c93",
  textTer:     "#8898aa",
  border:      "#e0e6eb",
  borderLight: "#f4f5f6",
  surface:     "#f6f9fc",
  danger:      "#df1b41",
  shadowSm:    "0px 1px 1px rgba(0,0,0,0.03), 0px 3px 6px rgba(18,42,66,0.02)",
  shadowMd:    "0 2px 5px 0 rgba(50,50,93,.10), 0 1px 1px 0 rgba(0,0,0,.07)",
  font:        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

// ─── Constantes ───────────────────────────────────────────────────────────
const STATUS_FLOW = ["pending", "preparing", "ready", "delivered"] as const;

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "En attente",     bg: "#f4f5f6", color: "#6b7c93" },
  preparing: { label: "En préparation", bg: "#fff8e6", color: "#b45309" },
  ready:     { label: "Prêt ✓",         bg: "#e8f0fd", color: "#2e6da4" },
  delivered: { label: "Livré",          bg: "#ecfdf5", color: "#16a34a" },
  cancelled: { label: "Annulé",         bg: "#fff0f0", color: "#df1b41" },
};

const ACTION_BTN: Record<string, { label: string; bg: string; hover: string }> = {
  pending:   { label: "Commencer ▶",    bg: "#f59e0b", hover: "#d97706" },
  preparing: { label: "Marquer prêt ▶", bg: "#2e6da4", hover: "#2563eb" },
  ready:     { label: "Livrer ✓",       bg: "#1a4d2e", hover: "#16a34a" },
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

  const [statut,        setStatut]        = useState("");
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [filter,        setFilter]        = useState<FilterType>("all");
  const [lastActivity,  setLastActivity]  = useState<Date | null>(null);
  const [activityLabel, setActLabel]      = useState("En attente du premier message");
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const soundRef    = useRef(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
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

  const baseOrders     = orders.filter((o) => o.status !== "cancelled");
  const filteredOrders = filter === "all" ? baseOrders : baseOrders.filter((o) => o.status === filter);

  const showTrial   = statut === "trial" && trialDaysLeft !== null && trialDaysLeft > 7;
  const trialUrgent = trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 3;
  const trialBg     = trialUrgent ? "#fff0f0" : "#fff8e6";
  const trialBorder = trialUrgent ? "#fecaca" : "#fed7aa";
  const trialColor  = trialUrgent ? "#df1b41"  : "#b45309";
  const trialLabel  = trialUrgent
    ? `🔴 Plus que ${trialDaysLeft} jour${(trialDaysLeft ?? 0) > 1 ? "s" : ""} !`
    : `⏳ ${trialDaysLeft} jour${(trialDaysLeft ?? 0) > 1 ? "s" : ""} d'essai restants`;

  const showOrangeBanner =
    statut === "trial" && trialDaysLeft !== null && trialDaysLeft > 0 && trialDaysLeft <= 7;
  const showRedBanner =
    (statut === "trial" && trialDaysLeft !== null && trialDaysLeft <= 0) ||
    statut === "suspendu";
  const WA_LINK =
    "https://wa.me/22376753087?text=Bonjour%20RestoFlow%2C%20je%20souhaite%20r%C3%A9activer%20mon%20abonnement%20pour%20mon%20restaurant.";

  function Delta({ today, yest }: { today: number; yest: number }) {
    const diff  = today - yest;
    const color = diff > 0 ? "#16a34a" : diff < 0 ? T.danger : T.textTer;
    return (
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>
        {diff > 0 ? "+" : ""}{diff} vs hier
      </span>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: T.font, backgroundColor: T.surface }}>
        <div style={{ textAlign: "center", color: T.textTer }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontSize: 14, margin: 0 }}>Chargement…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes rfDot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(.7);} }
        a:focus-visible,button:focus-visible{outline:2px solid #1a4d2e;outline-offset:2px;border-radius:4px;}
        @media(prefers-reduced-motion:reduce){
          *{animation:none!important;transition-duration:.01ms!important;}
        }
        * { font-family: ${T.font}; }
      `}</style>

      {/* ─── Header sticky ──────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "#fff",
        borderBottom: `1px solid ${T.border}`,
        boxShadow: T.shadowSm,
        padding: "0 24px",
      }}>
        <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flexShrink: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: "-0.3px" }}>
              Tableau de bord
            </h1>
            <p style={{ fontSize: 12, color: T.textTer, margin: 0, marginTop: 1 }}>{dateLabel()}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

            {/* Badge trial */}
            {showTrial && (
              <span style={{
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                backgroundColor: trialBg, border: `1px solid ${trialBorder}`,
                color: trialColor, padding: "5px 12px", borderRadius: 20,
                whiteSpace: "nowrap" as const,
              }}>
                {trialLabel}
              </span>
            )}

            {/* Bot actif */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                backgroundColor: "#ecfdf5", border: `1px solid #a7f3d0`,
                borderRadius: 20, padding: "4px 12px",
              }}>
                <span style={{
                  display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                  backgroundColor: "#16a34a",
                  animation: "rfDot 2s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>Bot actif</span>
              </div>
              <span style={{ fontSize: 10.5, color: T.textTer, marginTop: 3, paddingRight: 4 }}>
                {activityLabel}
              </span>
            </div>

            {/* Toggle son */}
            <button
              onClick={handleSoundToggle}
              aria-label={soundEnabled ? "Desactiver les notifications sonores" : "Activer les notifications sonores"}
              title={soundEnabled ? "Désactiver les notifications sonores" : "Activer les notifications sonores"}
              style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                border: `1px solid ${T.border}`,
                backgroundColor: soundEnabled ? "#ecfdf5" : "#fff",
                fontSize: 15, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "inherit",
              }}
            >
              {soundEnabled ? "🔔" : "🔕"}
            </button>

            {/* Aperçu bot */}
            <button
              onClick={() => setShowModal(true)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = T.surface)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
              style={{
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                border: `1px solid ${T.border}`, borderRadius: 6,
                padding: "6px 14px", backgroundColor: "#fff",
                fontSize: 13, fontWeight: 600, color: T.textPrimary,
                cursor: "pointer", transition: "background-color 0.15s",
                fontFamily: "inherit", boxShadow: T.shadowSm,
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
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                backgroundColor: restoPhone ? "#1a4d2e" : T.border,
                color: restoPhone ? "#fff" : T.textTer,
                border: "none", borderRadius: 6,
                padding: "7px 16px", fontSize: 13, fontWeight: 700,
                cursor: restoPhone ? "pointer" : "default",
                transition: "background-color 0.15s", fontFamily: "inherit",
              }}
            >
              {copied ? "✓ Copié !" : "📱 Partager WhatsApp"}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Banner orange ──────────────────────────────────────────── */}
      {showOrangeBanner && (
        <div style={{
          backgroundColor: "#fff8e6",
          borderBottom: `1px solid #fed7aa`,
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#b45309" }}>
                Votre période d&apos;essai expire dans{" "}
                {trialDaysLeft} jour{(trialDaysLeft ?? 0) > 1 ? "s" : ""}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#92400e", marginTop: 2 }}>
                Passez en compte actif pour continuer à utiliser votre bot WhatsApp sans interruption.
              </p>
            </div>
          </div>
          <a
            href={WA_LINK} target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
              backgroundColor: "#b45309", color: "#fff",
              borderRadius: 6, padding: "7px 16px",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}
          >
            💬 Passer en compte actif
          </a>
        </div>
      )}

      {/* ─── Banner rouge ───────────────────────────────────────────── */}
      {showRedBanner && (
        <div style={{
          backgroundColor: "#fff0f0",
          borderBottom: `1px solid #fecaca`,
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🚫</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.danger }}>
                Votre essai a expiré — Votre bot est suspendu
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#991b1b", marginTop: 2 }}>
                Les messages WhatsApp de vos clients ne sont plus traités. Contactez-nous pour réactiver.
              </p>
            </div>
          </div>
          <a
            href={WA_LINK} target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
              backgroundColor: T.danger, color: "#fff",
              borderRadius: 6, padding: "7px 16px",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}
          >
            💬 Contacter RestoFlow
          </a>
        </div>
      )}

      {/* ─── Contenu ────────────────────────────────────────────────── */}
      <div style={{ padding: "24px", backgroundColor: T.surface, minHeight: "calc(100vh - 60px)" }}>

        {/* ─── KPI cards ────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
          {([
            { icon: "💰", label: "CA du jour",               accent: "#16a34a", value: `${fmt(kpiCA)} FCFA`, delta: <Delta today={kpiCA} yest={ykpiCA} /> },
            { icon: "📦", label: "Commandes aujourd'hui",    accent: "#2e6da4", value: String(kpiTotal),     delta: <Delta today={kpiTotal} yest={ykpiTotal} /> },
            { icon: "⏳", label: "En attente / préparation", accent: "#f59e0b", value: String(kpiPending),   delta: <Delta today={kpiPending} yest={ykpiPending} /> },
            { icon: "✅", label: "Livrées",                  accent: T.textTer, value: String(kpiDone),      delta: <Delta today={kpiDone} yest={ykpiDone} /> },
          ] as const).map(({ icon, label, accent, value, delta }) => (
            <div key={label} style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              borderLeft: `3px solid ${accent}`,
              boxShadow: T.shadowSm,
              border: `1px solid ${T.border}`,
              borderLeftColor: accent,
              padding: "20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500, letterSpacing: "0.01em" }}>{label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.5px", marginBottom: 6 }}>{value}</div>
              {delta}
            </div>
          ))}
        </div>

        {/* ─── Filtres ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" as const }}>
          {FILTER_TABS.map(({ id, label }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: "6px 16px", borderRadius: 20,
                  border: active ? "none" : `1px solid ${T.border}`,
                  backgroundColor: active ? T.brand : "#fff",
                  color: active ? "#fff" : T.textSec,
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: "pointer", transition: "background-color 0.12s, color 0.12s, border-color 0.12s",
                  fontFamily: "inherit",
                  boxShadow: active ? "none" : T.shadowSm,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ─── Section commandes ──────────────────────────────────── */}
        <div aria-live="polite" aria-atomic="false" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
          {orders.length > 0 && `${orders.length} commande${orders.length > 1 ? "s" : ""}`}
        </div>
        {orders.length === 0 ? (
          <div style={{
            backgroundColor: "#fff", borderRadius: 8,
            boxShadow: T.shadowSm, border: `1px solid ${T.border}`,
            padding: "80px 32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 44, marginBottom: 18, letterSpacing: 4 }}>📱 → 🤖 → ✅</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary, marginBottom: 10 }}>
              Votre assistant attend des commandes
            </h2>
            <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.7, maxWidth: 400, margin: "0 auto 24px" }}>
              Partagez votre numéro WhatsApp avec vos clients. Dès qu&apos;un client envoie un message, les commandes apparaissent ici en temps réel.
            </p>
            <button
              onClick={copyWhatsApp}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a4d2e")}
              style={{
                backgroundColor: "#1a4d2e", color: "#fff",
                border: "none", borderRadius: 6, padding: "10px 24px",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                transition: "background-color 0.15s", fontFamily: "inherit",
              }}
            >
              {copied ? "✓ Numéro copié !" : "📱 Configurer mon WhatsApp"}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: "-0.2px" }}>
                {filter === "all"
                  ? "Toutes les commandes"
                  : (FILTER_TABS.find((f) => f.id === filter)?.label ?? "")}
              </h2>
              <span style={{
                backgroundColor: T.textPrimary, color: "#fff",
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
              }}>
                {filteredOrders.length}
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{
                backgroundColor: "#fff", borderRadius: 8, border: `1px solid ${T.border}`,
                padding: "40px 24px", textAlign: "center", color: T.textTer, fontSize: 14,
              }}>
                Aucune commande dans cette catégorie
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
                {filteredOrders.map((order, idx) => {
                  const badge  = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
                  const next   = nextStatus(order.status);
                  const action = next ? ACTION_BTN[order.status] : null;
                  const time   = new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                  const isHov  = hoveredBtn === order.id;

                  return (
                    <div key={order.id} style={{
                      backgroundColor: "#fff", borderRadius: 8,
                      boxShadow: T.shadowSm,
                      border: `1px solid ${T.border}`,
                      overflow: "hidden",
                    }}>
                      {/* En-tête card */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderBottom: `1px solid ${T.borderLight}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: T.textPrimary }}>{orderNum(idx)}</span>
                          <span style={{ fontSize: 11, color: T.textTer }}>· {time}</span>
                        </div>
                        <span style={{
                          backgroundColor: badge.bg, color: badge.color,
                          fontSize: 11, fontWeight: 700,
                          padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" as const,
                        }}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Client */}
                      <div style={{ padding: "10px 16px 8px", borderBottom: `1px solid ${T.borderLight}` }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                          👤 {maskName(order.customer_name)}
                        </span>
                        {order.customer_phone && (
                          <span style={{ fontSize: 12, color: T.textTer, marginLeft: 10 }}>
                            📱 {maskPhone(order.customer_phone)}
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div style={{ padding: "10px 16px 4px" }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "4px 0",
                            borderBottom: i < order.items.length - 1 ? `1px solid ${T.borderLight}` : "none",
                          }}>
                            <span style={{ fontSize: 13, color: T.textSec }}>
                              <strong style={{ color: T.textPrimary }}>{item.quantite}×</strong> {item.nom}
                            </span>
                            <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500, flexShrink: 0, marginLeft: 12 }}>
                              {fmt(item.quantite * item.prix_unitaire)} F
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Livraison */}
                      {order.zone_livraison && (
                        <div style={{
                          padding: "8px 16px", borderTop: `1px solid ${T.borderLight}`,
                          fontSize: 12, color: T.textSec, backgroundColor: T.surface,
                        }}>
                          🚚 {order.zone_livraison}
                          {order.adresse_livraison && ` — ${order.adresse_livraison}`}
                          {order.frais_livraison
                            ? <span style={{ color: T.textTer }}> (+{fmt(order.frais_livraison)} F)</span>
                            : null}
                        </div>
                      )}

                      {/* Total + action */}
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderTop: `1px solid ${T.borderLight}`,
                      }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.3px" }}>
                            {fmt(order.total)}{" "}
                            <span style={{ fontSize: 12, fontWeight: 500, color: T.textSec }}>FCFA</span>
                          </div>
                          <div style={{ fontSize: 11, color: T.textTer, marginTop: 2 }}>{payLabel(order.mode_paiement)}</div>
                        </div>

                        {action && next && (
                          <button
                            onClick={() => updateStatus(order.id, next)}
                            onMouseEnter={() => setHoveredBtn(order.id)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              backgroundColor: isHov ? action.hover : action.bg,
                              color: "#fff", border: "none",
                              padding: "8px 14px", borderRadius: 6,
                              fontSize: 12, fontWeight: 700, cursor: "pointer",
                              transition: "background-color 0.15s",
                              fontFamily: "inherit", whiteSpace: "nowrap" as const,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
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

      {/* ─── Modal aperçu bot ───────────────────────────────────────── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-bot-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(30,30,40,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            width: 360, height: 620, borderRadius: 12, overflow: "hidden",
            display: "flex", flexDirection: "column",
            boxShadow: "0 30px 60px rgba(0,0,0,.35), 0 0 0 1px rgba(50,50,93,.05)",
            overscrollBehavior: "contain",
          }}>
            {/* Header WhatsApp */}
            <div style={{
              backgroundColor: "#075e54", height: 58, flexShrink: 0,
              display: "flex", alignItems: "center", padding: "0 14px", gap: 12,
            }}>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Fermer"
                  style={{
                  background: "none", border: "none",
                  color: "rgba(255,255,255,0.8)", fontSize: 20,
                  cursor: "pointer", padding: 4, lineHeight: 1, fontFamily: "inherit",
                }}
              >←</button>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                backgroundColor: "#25d366",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>🤖</div>
              <div>
                <div id="modal-bot-title" style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
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
                      boxShadow: "0 1px 2px rgba(0,0,0,0.10)",
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

            {/* Zone saisie */}
            <div style={{
              backgroundColor: "#f0f2f5", height: 52, flexShrink: 0,
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
                width: 34, height: 34, borderRadius: "50%",
                backgroundColor: "#00a884",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, opacity: 0.45, cursor: "not-allowed",
              }}>➤</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
