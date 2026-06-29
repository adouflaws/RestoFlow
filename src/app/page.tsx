"use client";

import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";

// ─── Stripe design tokens adaptés RestoFlow ────────────────────────────────
const G  = "#1a4d2e";   // brand
const GL = "#16a34a";   // brand-light (hover)
const RD = "#df1b41";   // danger — Stripe exact

// Text (Stripe: #30313d primary, #6b7c93 secondary, #8898aa tertiary)
const TX  = "#30313d";
const TX2 = "#6b7c93";
const TX3 = "#8898aa";

// Surfaces & borders (Stripe)
const SRF  = "#f6f9fc";
const BRD  = "#e0e6eb";

// Shadows Stripe multi-couche
const SH_SM = "0px 1px 1px rgba(0,0,0,0.03), 0px 3px 6px rgba(18,42,66,0.02)";
const SH_MD = "0 2px 5px 0 rgba(50,50,93,.10), 0 1px 1px 0 rgba(0,0,0,.07)";
const SH_LG = "0 30px 60px rgba(0,0,0,.12), 0 0 0 1px rgba(50,50,93,.05)";

// Font stack (Sohne web-safe equivalent)
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// ─── Data ──────────────────────────────────────────────────────────────────
const CHAT_MSGS = [
  { from: "client", text: "Bonsoir, vous avez du poulet braisé ?", time: "23:45" },
  { from: "bot",    text: "Bonsoir ! 😊 Oui, nous avons du Poulet braisé à 3 500 FCFA.\nVous souhaitez commander ?", time: "23:45" },
  { from: "client", text: "Oui 2 poulets et un jus de bissap", time: "23:46" },
  { from: "bot",    text: "Parfait ! Voici votre commande :\n2× Poulet braisé = 7 000 FCFA\n1× Jus de bissap = 500 FCFA\nTotal : 7 500 FCFA\n\nVous confirmez ?", time: "23:46" },
  { from: "client", text: "Oui", time: "23:47" },
  { from: "bot",    text: "Commande confirmée ✅\n\nVoici votre lien de paiement Wave :\n👆 [Payer 7 500 FCFA]", time: "23:47" },
];

const TESTIMONIALS = [
  { initials: "IK", color: "#f59e0b", name: "Ibrahim K.",    resto: "Chez Ibrahim — Hamdallaye",           text: "Avant je passais mes soirées à répondre aux messages. Maintenant le bot gère tout et je reçois les commandes directement sur mon écran. J'ai gagné 40% de commandes en plus le premier mois." },
  { initials: "FD", color: "#8b5cf6", name: "Fatoumata D.", resto: "Le Petit Bamako — ACI 2000",           text: "Mes clients adorent. Ils commandent même à minuit et reçoivent une confirmation immédiate. Mes ventes ont doublé le week-end." },
  { initials: "MC", color: "#0891b2", name: "Moussa C.",     resto: "Grillades du Fleuve — Badalabougou", text: "L'installation a pris 10 minutes. Maintenant je gère 3 fois plus de commandes sans stresser." },
];

const FEATURES = [
  { icon: "🤖", title: "Bot 24h/24",             desc: "Ne perdez plus les commandes de 20h à minuit, votre heure de pointe.",   roi: "+40% de CA en soirée" },
  { icon: "📦", title: "Prise de commande auto", desc: "Zéro erreur = zéro remboursement = plus de marge.",                      roi: "Économisez 2h/jour" },
  { icon: "💰", title: "Paiement intégré",        desc: "Encaissez avant de préparer — fini les impayés.",                        roi: "100% des commandes payées" },
  { icon: "🗺️", title: "Livraison par quartier", desc: "Frais calculés automatiquement = zéro dispute client.",                  roi: "Zéro litige livraison" },
  { icon: "📊", title: "Dashboard temps réel",   desc: "Gérez 10× plus de commandes avec le même staff.",                        roi: "×10 capacité de gestion" },
  { icon: "⏰", title: "Horaires automatiques",   desc: "Votre image professionnelle préservée même quand vous dormez.",           roi: "Image pro 24h/24" },
];

interface PlanFeature { ok: boolean; text: string; }
interface Plan {
  name: string; price: string; popular: boolean; desc: string;
  features: PlanFeature[]; cta: string; href: string; sub: string | null;
}
const PLANS: Plan[] = [
  {
    name: "Starter", price: "25 000", popular: false,
    desc: "Idéal pour : Petits restaurants et maquis",
    features: [
      { ok: true,  text: "Bot WhatsApp IA 24h/24" },
      { ok: true,  text: "Jusqu'à 200 commandes/mois" },
      { ok: true,  text: "Menu jusqu'à 20 plats" },
      { ok: true,  text: "1 zone de livraison" },
      { ok: true,  text: "Dashboard commandes" },
      { ok: true,  text: "7 jours d'essai gratuit" },
      { ok: false, text: "Statistiques avancées" },
      { ok: false, text: "Historique conversations" },
    ],
    cta: "Commencer gratuitement", href: "/signup", sub: null,
  },
  {
    name: "Pro", price: "45 000", popular: true,
    desc: "Idéal pour : Restaurants avec livraison",
    features: [
      { ok: true, text: "Commandes illimitées" },
      { ok: true, text: "Menu illimité" },
      { ok: true, text: "Zones de livraison illimitées" },
      { ok: true, text: "Statistiques complètes" },
      { ok: true, text: "Historique conversations" },
      { ok: true, text: "FAQ configurable" },
      { ok: true, text: "Notifications sonores cuisine" },
      { ok: true, text: "Support prioritaire WhatsApp" },
    ],
    cta: "Commencer gratuitement", href: "/signup", sub: "💰 Rentabilisé dès 15 commandes/mois",
  },
  {
    name: "Business", price: "75 000", popular: false,
    desc: "Idéal pour : Chaînes et groupes",
    features: [
      { ok: true, text: "Jusqu'à 5 établissements" },
      { ok: true, text: "Rapport mensuel automatique" },
      { ok: true, text: "Support dédié direct" },
      { ok: true, text: "Intégration personnalisée" },
      { ok: true, text: "Formation de votre équipe" },
    ],
    cta: "Nous contacter",
    href: "https://wa.me/22376753087?text=Bonjour%20RestoFlow%2C%20je%20souhaite%20le%20plan%20Business.",
    sub: null,
  },
];

const FAQS = [
  { q: "C'est trop cher pour mon restaurant",               a: "RestoFlow se rentabilise dès 15 commandes supplémentaires par mois. Si le bot vous apporte 1 commande de plus par jour, vous êtes largement rentable." },
  { q: "Mes clients ne sont pas à l'aise avec la technologie", a: "Vos clients n'ont rien à changer. Ils écrivent sur WhatsApp comme d'habitude. C'est le bot qui s'adapte à eux." },
  { q: "Et si le bot fait des erreurs ?",                   a: "Le bot confirme toujours la commande avec le client avant de l'enregistrer. Zéro commande erronée possible." },
  { q: "Dois-je changer de numéro WhatsApp ?",             a: "Non si vous avez un numéro dédié au restaurant. Nous vous guidons étape par étape lors de la configuration." },
  { q: "Que se passe-t-il après les 7 jours d'essai ?",   a: "Vous choisissez votre plan et continuez. Sinon votre compte est suspendu automatiquement, sans frais." },
  { q: "Puis-je annuler à tout moment ?",                  a: "Oui, sans engagement, sans frais de résiliation. Un message WhatsApp suffit." },
];

function fmt(n: number) { return Math.round(n).toLocaleString("fr-FR"); }

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [spots,     setSpots]     = useState(7);
  const [openFaq,   setOpenFaq]   = useState<number | null>(null);
  const [cmdPerDay, setCmdPerDay] = useState(20);
  const [avgPrice,  setAvgPrice]  = useState(3500);

  const caActuel = cmdPerDay * avgPrice * 30;
  const caAvec   = Math.round(caActuel * 1.3);
  const gain     = caAvec - caActuel;
  const coutPro  = 45_000;
  const benefice = gain - coutPro;

  useEffect(() => {
    try {
      const stored     = localStorage.getItem("rf_spots");
      const storedTime = localStorage.getItem("rf_spots_time");
      if (stored && storedTime) {
        const dec = Math.floor((Date.now() - parseInt(storedTime)) / (25 * 60_000));
        const val = Math.max(3, parseInt(stored) - dec);
        setSpots(val);
        if (dec > 0) localStorage.setItem("rf_spots", String(val));
      } else {
        localStorage.setItem("rf_spots", "7");
        localStorage.setItem("rf_spots_time", String(Date.now()));
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("rfv"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".rff").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        *{box-sizing:border-box;font-family:${FONT};}html{scroll-behavior:smooth;}body{margin:0;}
        .rff{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease;}
        .rff.rfv{opacity:1;transform:translateY(0);}
        .rff.d1{transition-delay:.08s;}.rff.d2{transition-delay:.16s;}
        .rff.d3{transition-delay:.24s;}.rff.d4{transition-delay:.32s;}
        .rff.d5{transition-delay:.40s;}.rff.d6{transition-delay:.48s;}
        @keyframes rfBubble{from{opacity:0;transform:translateY(8px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
        .chat-b{opacity:0;animation:rfBubble .35s ease forwards;}
        .chat-b:nth-child(1){animation-delay:.6s;}.chat-b:nth-child(2){animation-delay:1.9s;}
        .chat-b:nth-child(3){animation-delay:3.5s;}.chat-b:nth-child(4){animation-delay:4.9s;}
        .chat-b:nth-child(5){animation-delay:6.4s;}.chat-b:nth-child(6){animation-delay:7.8s;}
        @keyframes rfPulse{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,.45);}70%{box-shadow:0 0 0 10px rgba(22,163,74,0);}}
        .rf-pulse{animation:rfPulse 2.2s ease-in-out infinite;}
        @keyframes rfUrg{0%,100%{opacity:1;}50%{opacity:.75;}}
        .urg-blink{animation:rfUrg 2.5s ease-in-out infinite;}
        input[type=range]{-webkit-appearance:none;width:100%;height:5px;border-radius:3px;background:${BRD};outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${G};cursor:pointer;box-shadow:${SH_SM};}
        input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${G};cursor:pointer;border:none;}
        a:focus-visible,button:focus-visible{outline:2px solid ${G};outline-offset:2px;border-radius:4px;}
        input[type=range]:focus-visible{outline:2px solid ${G};outline-offset:3px;}
        @media(prefers-reduced-motion:reduce){
          .rff{opacity:1;transform:none;transition:none;}
          .chat-b{opacity:1;animation:none;}
          .rf-pulse,.urg-blink{animation:none;}
        }
        @media(max-width:960px){
          .rf-hero{flex-direction:column!important;text-align:center;align-items:center!important;}
          .rf-hero-btns{justify-content:center!important;}
          .rf-wa{display:none!important;}
          .rf-nav-links{display:none!important;}
          .rf-ps{flex-direction:column!important;}
          .rf-feat{grid-template-columns:repeat(2,1fr)!important;}
          .rf-plans{flex-direction:column!important;align-items:center!important;}
          .rf-plans>div{max-width:420px!important;width:100%!important;transform:none!important;}
          .rf-testi{flex-direction:column!important;}
          .rf-roi{flex-direction:column!important;}
          .rf-stats{flex-direction:column!important;gap:0!important;}
          .rf-stats>div{border-right:none!important;border-bottom:1px solid rgba(255,255,255,.08);}
          .rf-h1{font-size:32px!important;letter-spacing:-.5px!important;}
        }
        @media(max-width:540px){
          .rf-feat{grid-template-columns:1fr!important;}
          .rf-h1{font-size:26px!important;}
          .rf-sec{padding:60px 20px!important;}
          .rf-urg-txt{font-size:11px!important;}
        }
      `}</style>

      <div style={{ fontFamily: FONT, color: TX, backgroundColor: "#fff", overflowX: "hidden" }}>

        {/* Skip link accessibilité */}
        <a href="#main-content" style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}
          onFocus={(e) => { e.currentTarget.style.cssText = "position:fixed;top:0;left:0;z-index:9999;padding:8px 16px;background:#1a4d2e;color:#fff;font-weight:700;font-size:14px;border-radius:0 0 6px 0;width:auto;height:auto;overflow:auto;"; }}
          onBlur={(e)  => { e.currentTarget.style.cssText = "position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;"; }}
        >Aller au contenu principal</a>

        {/* ══ 1. BARRE D'URGENCE ══════════════════════════════════════ */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 300, backgroundColor: RD, height: "calc(44px + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "env(safe-area-inset-top) 16px 0" }}>
          <p className="rf-urg-txt urg-blink" style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" as const }}>
            🔥 Offre de lancement — Prix augmentent le 1er août 2026 — Il reste{" "}
            <strong aria-live="polite" style={{ borderBottom: "1px dashed rgba(255,255,255,.65)" }}>{spots} places</strong> au tarif actuel
          </p>
          <Link href="/signup" style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: RD, backgroundColor: "#fff", borderRadius: 4, padding: "4px 12px", textDecoration: "none", whiteSpace: "nowrap" as const }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >Profiter maintenant →</Link>
        </div>

        {/* ══ 2. NAVBAR ═══════════════════════════════════════════════ */}
        <nav style={{ position: "fixed", top: "calc(44px + env(safe-area-inset-top))", left: 0, right: 0, zIndex: 200, backgroundColor: "rgba(255,255,255,.97)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${BRD}`, boxShadow: SH_SM }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "-.5px" }}>RF</div>
              <span style={{ fontSize: 16, fontWeight: 800, color: TX, letterSpacing: "-.4px" }}>RestoFlow</span>
            </Link>
            <div className="rf-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {[["Fonctionnalités","#features"],["Tarifs","#pricing"],["Témoignages","#testimonials"],["FAQ","#faq"]].map(([label, href]) => (
                <a key={label} href={href} style={{ fontSize: 14, fontWeight: 500, color: TX2, textDecoration: "none", transition: "color .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = G)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = TX2)}
                >{label}</a>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: GL, backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 20, padding: "4px 12px", whiteSpace: "nowrap" as const }}>✦ 14 jours gratuits</span>
              <Link href="/signup" className="rf-pulse" style={{ fontSize: 13, fontWeight: 700, color: "#fff", padding: "8px 18px", borderRadius: 6, backgroundColor: G, textDecoration: "none", whiteSpace: "nowrap" as const, transition: "background .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GL)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = G)}
              >Commencer gratuitement</Link>
            </div>
          </div>
        </nav>

        {/* ══ 3. HERO ═════════════════════════════════════════════════ */}
        <section id="main-content" style={{ paddingTop: 44 + 64 + 64, paddingBottom: 88, paddingLeft: 28, paddingRight: 28, background: `linear-gradient(160deg,${SRF} 0%,#fff 60%)` }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="rf-hero" style={{ display: "flex", alignItems: "center", gap: 60 }}>

              {/* Gauche */}
              <div style={{ flex: "0 0 54%", maxWidth: 600 }}>
                <div className="rff" style={{ display: "inline-flex", alignItems: "center", gap: 7, backgroundColor: "#fff0f0", border: `1px solid #fecaca`, borderRadius: 20, padding: "5px 14px", marginBottom: 22 }}>
                  <span>⚡</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: RD }}>Plus de 12 restaurants sur liste d&apos;attente</span>
                </div>

                <h1 className="rff d1 rf-h1" style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1.6px", color: TX, margin: "0 0 22px", textWrap: "balance" } as React.CSSProperties}>
                  Votre restaurant <span style={{ color: RD }}>perd des commandes</span> chaque nuit pendant que vous dormez
                </h1>

                <p className="rff d2" style={{ fontSize: 17, color: TX2, lineHeight: 1.68, margin: "0 0 30px" }}>
                  RestoFlow transforme votre WhatsApp en assistant IA qui répond, prend les commandes et encaisse — 24h/24, 7j/7.{" "}
                  <strong style={{ color: TX }}>Même à 3h du matin.</strong>
                </p>

                {/* Stats choc */}
                <div className="rff d2 rf-stats" style={{ display: "flex", backgroundColor: TX, borderRadius: 8, overflow: "hidden", marginBottom: 32, boxShadow: SH_MD }}>
                  {[
                    { num: "73%", sub: "des clients n'envoient pas de 2ème message sans réponse" },
                    { num: "3×",  sub: "plus de commandes en moyenne avec le bot" },
                    { num: "2h",  sub: "économisées chaque jour par les gérants" },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, padding: "18px 14px", textAlign: "center" as const, borderRight: i < 2 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-1px", marginBottom: 4 }}>{s.num}</div>
                      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.45)", lineHeight: 1.4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="rff rf-hero-btns d3" style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                  <Link href="/signup" style={{ display: "inline-flex", flexDirection: "column" as const, alignItems: "center", backgroundColor: G, color: "#fff", padding: "14px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: `0 4px 14px rgba(26,77,46,.30)`, transition: "background-color .15s, transform .15s, box-shadow .15s, border-color .15s, color .15s", gap: 2 }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GL; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,77,46,.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = G; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 14px rgba(26,77,46,.30)`; }}
                  >
                    <span>Démarrer mon essai gratuit</span>
                    <span style={{ fontSize: 11, fontWeight: 500, opacity: .75 }}>7 jours — sans carte bancaire</span>
                  </Link>
                  <a href="#features" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: G, padding: "14px 22px", borderRadius: 8, fontSize: 14.5, fontWeight: 600, textDecoration: "none", border: `1.5px solid ${G}`, transition: "background .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ecfdf5")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >Voir comment ça marche ↓</a>
                </div>
              </div>

              {/* Droite — Mockup WhatsApp */}
              <div className="rf-wa" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 318, borderRadius: 16, overflow: "hidden", boxShadow: SH_LG, border: `1px solid ${BRD}` }}>
                  <div style={{ backgroundColor: "#075e54", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🍽️</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Chez Aminata BO</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>en ligne</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#ece5dd", padding: "10px 9px", minHeight: 350, display: "flex", flexDirection: "column" as const, gap: 5 }}>
                    {CHAT_MSGS.map((msg, i) => {
                      const isC = msg.from === "client";
                      return (
                        <div key={i} className="chat-b" style={{ display: "flex", justifyContent: isC ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "84%", padding: "7px 10px", borderRadius: isC ? "12px 2px 12px 12px" : "2px 12px 12px 12px", backgroundColor: isC ? "#dcf8c6" : "#fff", fontSize: 12, lineHeight: 1.5, color: "#111", boxShadow: "0 1px 2px rgba(0,0,0,.08)", whiteSpace: "pre-line" as const }}>
                            {msg.text}
                            <div style={{ fontSize: 9.5, color: TX3, textAlign: "right" as const, marginTop: 3 }}>{msg.time} {isC ? "" : "✓✓"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ backgroundColor: "#ecfdf5", padding: "8px 12px", display: "flex", alignItems: "center", gap: 7, borderTop: `1px solid ${BRD}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: GL, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: GL }}>🟢 Réponse en 2 secondes — à 23h47</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 4. PROBLÈME vs SOLUTION ═════════════════════════════════ */}
        <section className="rf-sec" style={{ padding: "80px 28px", backgroundColor: SRF }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 44 }}>
              <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", color: TX, margin: 0, textWrap: "balance" } as React.CSSProperties}>
                La réalité des restaurants à Bamako
              </h2>
            </div>
            <div className="rf-ps" style={{ display: "flex", gap: 20 }}>
              <div className="rff d1" style={{ flex: 1, backgroundColor: "#fff", border: `1px solid #fecaca`, borderRadius: 8, padding: "28px", boxShadow: SH_SM }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: RD, marginBottom: 20, letterSpacing: "0.02em", textTransform: "uppercase" as const }}>😓 Sans RestoFlow</div>
                {["Clients sans réponse la nuit","Commandes perdues pendant le service","Erreurs de commande manuelles","Paiements oubliés ou non encaissés","2-3h par jour à répondre aux messages"].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <span style={{ color: RD, fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 2 }}>✗</span>
                    <span style={{ fontSize: 14, color: "#7f1d1d", lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div className="rff d2" style={{ flex: 1, backgroundColor: "#fff", border: `1px solid #a7f3d0`, borderRadius: 8, padding: "28px", boxShadow: SH_SM }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: G, marginBottom: 20, letterSpacing: "0.02em", textTransform: "uppercase" as const }}>🚀 Avec RestoFlow</div>
                {["Bot répond en 2 secondes, 24h/24","Zéro commande perdue","Commandes extraites automatiquement","Paiement Orange Money/Wave automatique","Vous gérez, le bot travaille"].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <span style={{ color: GL, fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span style={{ fontSize: 14, color: "#14532d", lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ 5. TÉMOIGNAGES ══════════════════════════════════════════ */}
        <section id="testimonials" className="rf-sec" style={{ padding: "96px 28px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 52 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GL, letterSpacing: ".12em", textTransform: "uppercase" as const }}>Preuve sociale</span>
              <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", margin: "10px 0 0", color: TX, textWrap: "balance" } as React.CSSProperties}>
                Ce que disent les restaurants qui utilisent RestoFlow
              </h2>
            </div>
            <div className="rf-testi" style={{ display: "flex", gap: 20 }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={`rff d${i + 1}`} style={{ flex: 1, backgroundColor: "#fff", border: `1px solid ${BRD}`, borderRadius: 8, padding: "24px", display: "flex", flexDirection: "column" as const, gap: 14, boxShadow: SH_SM }}>
                  <div style={{ fontSize: 15 }}>⭐⭐⭐⭐⭐</div>
                  <p style={{ fontSize: 14, color: TX2, lineHeight: 1.72, margin: 0, fontStyle: "italic" as const, flex: 1 }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{t.initials}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: TX }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: TX3 }}>{t.resto}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 6. FONCTIONNALITÉS ══════════════════════════════════════ */}
        <section id="features" className="rf-sec" style={{ padding: "80px 28px", backgroundColor: SRF }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 48 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GL, letterSpacing: ".12em", textTransform: "uppercase" as const }}>Fonctionnalités</span>
              <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", margin: "10px 0 12px", color: TX, textWrap: "balance" } as React.CSSProperties}>
                Chaque fonctionnalité génère du revenu
              </h2>
            </div>
            <div className="rf-feat" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {FEATURES.map((f, i) => (
                <div key={i} className={`rff d${i + 1}`}
                  style={{ backgroundColor: "#fff", border: `1px solid ${BRD}`, borderRadius: 8, padding: "24px", transition: "box-shadow .2s, border-color .2s, transform .2s", cursor: "default", boxShadow: SH_SM }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 6px 16px rgba(50,50,93,.10), 0 2px 4px rgba(0,0,0,.06)`; e.currentTarget.style.borderColor = "#a7f3d0"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = SH_SM; e.currentTarget.style.borderColor = BRD; e.currentTarget.style.transform = ""; }}
                >
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: TX, margin: "0 0 6px", letterSpacing: "-0.2px" }}>{f.title}</h3>
                  <p style={{ fontSize: 13.5, color: TX2, margin: "0 0 14px", lineHeight: 1.6 }}>{f.desc}</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: "#ecfdf5", border: `1px solid #a7f3d0`, borderRadius: 20, padding: "3px 10px", fontSize: 11.5, fontWeight: 700, color: G }}>
                    ▲ {f.roi}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 7. TARIFS ═══════════════════════════════════════════════ */}
        <section id="pricing" className="rf-sec" style={{ padding: "96px 28px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 48 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GL, letterSpacing: ".12em", textTransform: "uppercase" as const }}>Tarifs</span>
              <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", margin: "10px 0 12px", color: TX, textWrap: "balance" } as React.CSSProperties}>
                Investissez moins qu&apos;un employé, gagnez comme une équipe
              </h2>
              <p style={{ fontSize: 16, color: TX2, margin: "0 auto 20px", maxWidth: 540 }}>
                Un employé coûte 50 000 FCFA/mois et fait des erreurs. RestoFlow travaille 24h/24 sans jamais se tromper.
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#fff0f0", border: `1px solid #fecaca`, borderRadius: 6, padding: "7px 16px" }}>
                <span>⚠️</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: RD }}>Prix de lancement — Augmentation le 1er août 2026</span>
              </div>
            </div>

            <div className="rf-plans" style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
              {PLANS.map((plan, i) => (
                <div key={i} className={`rff d${i + 1}`} style={{
                  flex: 1, borderRadius: 8, padding: "28px",
                  border: plan.popular ? `2px solid ${G}` : `1px solid ${BRD}`,
                  backgroundColor: plan.popular ? "#ecfdf5" : "#fff",
                  position: "relative" as const, display: "flex", flexDirection: "column" as const,
                  boxShadow: plan.popular ? `0 8px 30px rgba(26,77,46,.14), 0 1px 2px rgba(0,0,0,.06)` : SH_SM,
                  transform: plan.popular ? "scale(1.03)" : "none",
                }}>
                  {plan.popular && (
                    <div style={{ position: "absolute" as const, top: -13, left: "50%", transform: "translateX(-50%)", backgroundColor: G, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                      ⭐ Le plus populaire
                    </div>
                  )}
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: TX, margin: "0 0 4px", letterSpacing: "-0.3px" }}>{plan.name}</h3>
                  <p style={{ fontSize: 12, color: TX3, margin: "0 0 16px" }}>{plan.desc}</p>
                  <div style={{ marginBottom: 22 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: G, letterSpacing: "-1.5px" }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: TX3, marginLeft: 4 }}>FCFA / mois</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", flex: 1, display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {plan.features.map((feat, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, color: feat.ok ? TX2 : BRD }}>
                        <span style={{ color: feat.ok ? GL : BRD, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{feat.ok ? "✓" : "✗"}</span>
                        {feat.text}
                      </li>
                    ))}
                  </ul>
                  {plan.href.startsWith("http") ? (
                    <a href={plan.href} target="_blank" rel="noopener noreferrer"
                      style={{ display: "block", textAlign: "center" as const, padding: "12px 0", backgroundColor: "transparent", color: G, border: `1.5px solid ${G}`, borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "background-color .15s, transform .15s, box-shadow .15s, border-color .15s, color .15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = G; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = G; }}
                    >{plan.cta}</a>
                  ) : (
                    <Link href={plan.href}
                      style={{ display: "block", textAlign: "center" as const, padding: "12px 0", backgroundColor: plan.popular ? G : "transparent", color: plan.popular ? "#fff" : G, border: `1.5px solid ${G}`, borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "background-color .15s, transform .15s, box-shadow .15s, border-color .15s, color .15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GL; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = GL; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = plan.popular ? G : "transparent"; e.currentTarget.style.color = plan.popular ? "#fff" : G; e.currentTarget.style.borderColor = G; }}
                    >{plan.cta}</Link>
                  )}
                  {plan.sub && <div style={{ marginTop: 10, textAlign: "center" as const, fontSize: 12, color: GL, fontWeight: 700 }}>{plan.sub}</div>}
                </div>
              ))}
            </div>

            <div className="rff" style={{ textAlign: "center" as const, marginTop: 32, fontSize: 13, color: TX3 }}>
              🔒 Paiement sécurisé via Orange Money &amp; Wave — Annulation possible à tout moment — Aucune carte bancaire requise pour l&apos;essai
            </div>
          </div>
        </section>

        {/* ══ 8. CALCULATEUR ROI ══════════════════════════════════════ */}
        <section className="rf-sec" style={{ padding: "80px 28px", backgroundColor: SRF }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 48 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GL, letterSpacing: ".12em", textTransform: "uppercase" as const }}>ROI</span>
              <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", margin: "10px 0", color: TX }}>
                Calculez votre retour sur investissement
              </h2>
            </div>
            <div className="rf-roi" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              {/* Sliders */}
              <div className="rff d1" style={{ flex: 1, backgroundColor: "#fff", border: `1px solid ${BRD}`, borderRadius: 8, padding: "28px", boxShadow: SH_SM }}>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: TX }}>Commandes par jour</label>
                    <span style={{ fontSize: 18, fontWeight: 800, color: G }}>{cmdPerDay}</span>
                  </div>
                  <input id="slider-cmd" type="range" min={5} max={100} value={cmdPerDay} onChange={(e) => setCmdPerDay(Number(e.target.value))} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: TX3, marginTop: 5 }}><span>5</span><span>100</span></div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: TX }}>Prix moyen d&apos;une commande</label>
                    <span style={{ fontSize: 18, fontWeight: 800, color: G }}>{fmt(avgPrice)} FCFA</span>
                  </div>
                  <input id="slider-price" type="range" min={1000} max={10000} step={500} value={avgPrice} onChange={(e) => setAvgPrice(Number(e.target.value))} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: TX3, marginTop: 5 }}><span>1 000</span><span>10 000 FCFA</span></div>
                </div>
              </div>

              {/* Résultats */}
              <div className="rff d2" style={{ flex: 1, backgroundColor: "#fff", border: `1px solid ${BRD}`, borderRadius: 8, padding: "28px", boxShadow: SH_SM }}>
                <div style={{ marginBottom: 20 }}>
                  {[
                    { label: "CA mensuel actuel estimé", value: `${fmt(caActuel)} FCFA`, color: TX2 },
                    { label: "CA avec RestoFlow (+30%)",  value: `${fmt(caAvec)} FCFA`,   color: G },
                    { label: "Gain mensuel",             value: `+${fmt(gain)} FCFA`,    color: GL },
                    { label: "Coût RestoFlow Pro",       value: `-45 000 FCFA`,          color: RD },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid #f4f5f6` }}>
                      <span style={{ fontSize: 13.5, color: TX2 }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: benefice > 0 ? "#ecfdf5" : "#fff0f0", border: `2px solid ${benefice > 0 ? G : RD}`, borderRadius: 8, padding: "20px", textAlign: "center" as const }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: benefice > 0 ? G : RD, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em" }}>Bénéfice net mensuel</div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: benefice > 0 ? G : RD, letterSpacing: "-2px" }}>
                    {benefice > 0 ? "+" : ""}{fmt(benefice)} FCFA
                  </div>
                  <div style={{ fontSize: 13, color: TX2, marginTop: 8 }}>
                    {benefice > 0 ? `Vous gagnez ${fmt(benefice)} FCFA de plus par mois` : "Augmentez vos commandes pour couvrir le coût"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 9. FAQ ══════════════════════════════════════════════════ */}
        <section id="faq" className="rf-sec" style={{ padding: "80px 28px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 48 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GL, letterSpacing: ".12em", textTransform: "uppercase" as const }}>FAQ</span>
              <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", margin: "10px 0", color: TX }}>
                Vos objections, nos réponses
              </h2>
            </div>
            {FAQS.map((faq, i) => (
              <div key={i} className={`rff d${Math.min(i + 1, 6)}`} style={{ borderBottom: `1px solid ${BRD}` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}
                  style={{ width: "100%", textAlign: "left" as const, padding: "18px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: TX, lineHeight: 1.4 }}>{faq.q}</span>
                  <span style={{ fontSize: 18, color: openFaq === i ? G : TX3, transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform .25s", flexShrink: 0 }}>⌃</span>
                </button>
                <div style={{ maxHeight: openFaq === i ? 200 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                  <p style={{ fontSize: 14, color: TX2, lineHeight: 1.72, margin: "0 0 20px", paddingRight: 28 }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ 10. CTA FINAL ═══════════════════════════════════════════ */}
        <section style={{ padding: "100px 28px", backgroundColor: G, position: "relative" as const, overflow: "hidden" }}>
          <div style={{ position: "absolute" as const, inset: 0, backgroundImage: "radial-gradient(circle at 15% 50%,rgba(255,255,255,.04) 0%,transparent 55%),radial-gradient(circle at 85% 50%,rgba(255,255,255,.04) 0%,transparent 55%)", pointerEvents: "none" as const }} />
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" as const, position: "relative" as const }}>
            <div className="rff">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 20, padding: "6px 16px", marginBottom: 28 }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Il reste {spots} places au prix de lancement</span>
              </div>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "-1.5px", margin: "0 0 18px", lineHeight: 1.14 }}>
                Rejoignez les restaurants qui ne perdent plus de commandes
              </h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,.72)", margin: "0 0 36px", lineHeight: 1.6 }}>
                7 jours gratuits — Configuration en 10 minutes — Aucune carte requise
              </p>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#fff", color: G, padding: "16px 40px", borderRadius: 8, fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(0,0,0,.22)", transition: "background-color .15s, transform .15s, box-shadow .15s, border-color .15s, color .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,.28)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.22)"; }}
              >
                Démarrer mon essai gratuit maintenant →
              </Link>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 30 }}>
                <div style={{ display: "flex" }}>
                  {[{ ini: "IK", col: "#f59e0b" },{ ini: "FD", col: "#8b5cf6" },{ ini: "MC", col: "#0891b2" }].map((av, i) => (
                    <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: av.col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", marginLeft: i > 0 ? -8 : 0, border: "2px solid rgba(255,255,255,.2)", position: "relative" as const, zIndex: 3 - i }}>
                      {av.ini}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>
                  <strong style={{ color: "#fff" }}>12 restaurants</strong> nous ont rejoint ce mois-ci
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 11. FOOTER ══════════════════════════════════════════════ */}
        <footer style={{ backgroundColor: "#1a1f2e", padding: "40px 28px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as const, gap: 24, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>RF</div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>RestoFlow</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.38)", margin: 0 }}>L&apos;assistant WhatsApp des restaurants maliens</p>
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const, alignItems: "center" }}>
                {["CGU","Confidentialité","Contact"].map((l) => (
                  <a key={l} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,.38)", textDecoration: "none", transition: "color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.38)")}
                  >{l}</a>
                ))}
                <a href="https://wa.me/22376753087" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: "#25d366", textDecoration: "none" }}>
                  💬 Support WhatsApp
                </a>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 20, textAlign: "center" as const }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.28)", margin: 0 }}>© 2026 RestoFlow — Fait avec ❤️ au Mali 🇲🇱</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
