"use client";

import { useState, useEffect, useRef } from "react";
import React from "react";
import Link from "next/link";
import {
  Bot, Package, CreditCard, MapPin, BarChart2, Clock,
  ChevronDown, MessageCircle, ArrowRight, CheckCircle2, X as XIcon, Star,
  Smartphone, Mail, Settings, Utensils,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────
const G   = "#1a4d2e";
const GL  = "#16a34a";
const TX  = "#0d1b10";
const TX2 = "#4a6354";
const BG  = "#fafaf8";
const BRD = "#e3ece5";

// ─── Data ─────────────────────────────────────────────────────────────────
const CHAT_MSGS = [
  { from: "client", text: "Bonsoir, vous avez du poulet braisé ?", time: "23:45" },
  { from: "bot",    text: "Bonsoir ! Oui, nous avons du Poulet braisé à 3 500 FCFA.\nVous souhaitez commander ?", time: "23:45" },
  { from: "client", text: "Oui 2 poulets et un jus de bissap", time: "23:46" },
  { from: "bot",    text: "2× Poulet braisé = 7 000 FCFA\n1× Jus de bissap = 500 FCFA\nTotal : 7 500 FCFA\n\nVous confirmez ?", time: "23:46" },
  { from: "client", text: "Oui", time: "23:47" },
  { from: "bot",    text: "Commande confirmée.\n\n[Payer 7 500 FCFA via Wave]", time: "23:47" },
];

const FEATURES: { Icon: React.ElementType; title: string; desc: string; roi: string }[] = [
  { Icon: Bot,        title: "Bot 24h/24",             desc: "Répond instantanément la nuit, pendant le service, même à 3h du matin.",  roi: "+40% CA en soirée" },
  { Icon: Package,    title: "Commandes automatiques", desc: "Extrait, confirme et transmet chaque commande sans intervention manuelle.", roi: "2h économisées / jour" },
  { Icon: CreditCard, title: "Paiement intégré",       desc: "Orange Money et Wave encaissés avant la préparation. Zéro impayé.",       roi: "100% payé d'avance" },
  { Icon: MapPin,     title: "Livraison par zone",     desc: "Frais de livraison calculés automatiquement par quartier.",               roi: "Zéro litige livraison" },
  { Icon: BarChart2,  title: "Dashboard temps réel",   desc: "Toutes les commandes centralisées et actualisées en direct.",             roi: "Gestion 10× plus rapide" },
  { Icon: Clock,      title: "Horaires intelligents",  desc: "Le bot informe les clients et redirige automatiquement en dehors des heures.", roi: "Image pro 24h/24" },
];

const TESTIMONIALS = [
  { initials: "IK", color: "#f59e0b", name: "Ibrahim K.",    resto: "Chez Ibrahim, Hamdallaye",           text: "Avant je passais mes soirées à répondre aux messages. Maintenant le bot gère tout et je reçois les commandes directement. J'ai gagné 40% de commandes en plus le premier mois." },
  { initials: "FD", color: "#8b5cf6", name: "Fatoumata D.", resto: "Le Petit Bamako, ACI 2000",           text: "Mes clients adorent. Ils commandent même à minuit et reçoivent une confirmation immédiate. Mes ventes ont doublé le week-end." },
  { initials: "MC", color: "#0891b2", name: "Moussa C.",     resto: "Grillades du Fleuve, Badalabougou", text: "L'installation a pris 10 minutes. Maintenant je gère 3 fois plus de commandes sans stresser." },
];

interface PlanData {
  name: string; price: string; popular: boolean; desc: string;
  features: string[]; missing: string[]; cta: string; href: string;
}
const PLANS: PlanData[] = [
  {
    name: "Starter", price: "25 000", popular: false,
    desc: "Petits restaurants et maquis",
    features: ["Bot WhatsApp IA 24h/24","Jusqu'à 200 commandes/mois","Menu jusqu'à 20 plats","1 zone de livraison","Dashboard commandes","7 jours d'essai gratuit"],
    missing: ["Historique conversations","Support prioritaire"],
    cta: "Commencer gratuitement", href: "/signup",
  },
  {
    name: "Pro", price: "45 000", popular: true,
    desc: "Restaurants avec livraison active",
    features: ["Commandes illimitées","Menu illimité","Zones de livraison illimitées","Historique conversations","FAQ configurable","Notifications sonores cuisine","Support prioritaire WhatsApp"],
    missing: [],
    cta: "Commencer gratuitement", href: "/signup",
  },
  {
    name: "Business", price: "75 000", popular: false,
    desc: "Chaînes et groupes de restaurants",
    features: ["Jusqu'à 5 établissements","Rapport mensuel automatique","Support dédié direct","Intégration personnalisée","Formation de votre équipe"],
    missing: [],
    cta: "Nous contacter",
    href: "https://wa.me/22376753087?text=Bonjour%20RestoFlow%2C%20je%20souhaite%20le%20plan%20Business.",
  },
];

const FAQS = [
  { q: "RestoFlow est-il trop cher pour mon restaurant ?",     a: "RestoFlow se rentabilise dès 15 commandes supplémentaires par mois. Si le bot vous apporte 1 commande de plus par jour, vous êtes largement rentable." },
  { q: "Mes clients ne sont pas à l'aise avec la technologie.", a: "Vos clients n'ont rien à changer. Ils écrivent sur WhatsApp comme d'habitude. C'est le bot qui s'adapte à eux." },
  { q: "Et si le bot fait des erreurs ?",                       a: "Le bot confirme toujours la commande avec le client avant de l'enregistrer. Zéro commande erronée possible." },
  { q: "Dois-je changer de numéro WhatsApp ?",                 a: "Non si vous avez un numéro dédié au restaurant. Nous vous guidons étape par étape lors de la configuration." },
  { q: "Que se passe-t-il après les 7 jours d'essai ?",       a: "Vous choisissez votre plan et continuez. Sinon votre compte est suspendu automatiquement, sans frais." },
  { q: "Puis-je annuler à tout moment ?",                      a: "Oui, sans engagement, sans frais de résiliation. Un message WhatsApp suffit." },
];

const MARQUEE_ITEMS = [
  "Bot 24h/24","Paiement Wave","Commandes automatiques","Livraison par zone",
  "Orange Money","Dashboard temps réel","FAQ configurable","Notifications cuisine",
  "Horaires intelligents","Support WhatsApp","Zéro impayé","Installation en 10 min",
];

// ─── Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const scrubRef = useRef<HTMLDivElement>(null);

  // GSAP text scrub — words fade in on scroll
  useEffect(() => {
    if (typeof window === "undefined" || !scrubRef.current) return;
    let cleanup: (() => void) | undefined;

    (async () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const words = scrubRef.current?.querySelectorAll(".rf-word");
      if (!words?.length) return;

      gsap.fromTo(
        words,
        { opacity: 0.08, y: 6 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: {
            trigger: scrubRef.current,
            start: "top 78%",
            end: "bottom 45%",
            scrub: 1.2,
          },
        }
      );

      cleanup = () => ScrollTrigger.getAll().forEach((t) => t.kill());
    })();

    return () => cleanup?.();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; font-family: 'Outfit', system-ui, sans-serif; background: ${BG}; color: ${TX}; -webkit-font-smoothing: antialiased; }
        @keyframes rfMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .rf-marquee { animation: rfMarquee 30s linear infinite; }
        @media (hover: hover) { .rf-marquee:hover { animation-play-state: paused; } }
        @keyframes rfChat { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .rf-bubble { opacity: 0; animation: rfChat .4s ease-out forwards; }
        .rf-bubble:nth-child(1){animation-delay:.5s}.rf-bubble:nth-child(2){animation-delay:1.8s}
        .rf-bubble:nth-child(3){animation-delay:3.2s}.rf-bubble:nth-child(4){animation-delay:4.7s}
        .rf-bubble:nth-child(5){animation-delay:6.2s}.rf-bubble:nth-child(6){animation-delay:7.6s}
        .rf-btn-primary:active { transform: scale(0.97) !important; }
        .rf-btn-secondary:active { transform: scale(0.98) !important; }
        .rf-bento-card:active { transform: translateY(-1px) scale(0.99) !important; }
        @media (prefers-reduced-motion: reduce) {
          .rf-marquee { animation: none; }
          .rf-bubble { opacity: 1; animation: none; }
          *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; }
        }
      `}</style>

      <div className="overflow-x-hidden w-full max-w-full" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>

        {/* ── NAVIGATION ───────────────────────────────────────────── */}
        <header style={{ position: "fixed", top: 20, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "center", padding: "0 20px" }}>
          <nav style={{
            maxWidth: 860, width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            height: 52,
            backgroundColor: "rgba(255,255,255,0.90)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${BRD}`,
            borderRadius: 14,
            padding: "0 16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
          }}>
            {/* Colonne gauche — logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", justifySelf: "start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0 }}>RF</div>
              <span style={{ fontSize: 15, fontWeight: 800, color: TX, letterSpacing: "-0.3px" }}>RestoFlow</span>
            </Link>

            {/* Colonne centrale — liens (desktop uniquement) */}
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {[["Fonctionnalités","#features"],["Tarifs","#pricing"],["FAQ","#faq"]].map(([label, href]) => (
                <a key={label} href={href} style={{
                  fontSize: 13.5, fontWeight: 500, color: TX2,
                  textDecoration: "none", padding: "6px 14px", borderRadius: 8,
                  transition: "color .15s, background-color .15s",
                  display: "none",
                }}
                  className="rf-navlink"
                  onMouseEnter={(e) => { e.currentTarget.style.color = G; e.currentTarget.style.backgroundColor = "#f0fdf4"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = TX2; e.currentTarget.style.backgroundColor = "transparent"; }}
                >{label}</a>
              ))}
            </div>

            {/* Colonne droite — CTA */}
            <div style={{ justifySelf: "end" }}>
              <Link href="/signup" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                backgroundColor: G, color: "#fff",
                padding: "8px 18px", borderRadius: 9,
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                transition: "background-color .15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GL)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = G)}
              >
                Essai gratuit <ArrowRight size={13} />
              </Link>
            </div>
          </nav>

          <style>{`
            @media(min-width: 640px) { .rf-navlink { display: block !important; } }
          `}</style>
        </header>

        {/* ── HERO — Editorial Split ─────────────────────────────── */}
        <section
          id="main-content"
          style={{
            minHeight: "100dvh", display: "flex", alignItems: "center",
            paddingTop: "calc(88px + 64px)", paddingBottom: 80,
            paddingLeft: 24, paddingRight: 24,
            background: `linear-gradient(135deg, ${BG} 0%, #eff7f1 100%)`,
          }}
        >
          <div style={{ maxWidth: 1160, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
            className="rf-hero"
          >
            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 20, padding: "5px 14px", alignSelf: "flex-start" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: GL, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: G }}>7 jours d&apos;essai — aucune carte requise</span>
              </div>

              <h1 className="max-w-2xl" style={{
                fontSize: "clamp(2.4rem, 4.5vw, 4.8rem)",
                fontWeight: 900, lineHeight: 1.06, letterSpacing: "-2.5px",
                color: TX, margin: 0,
              }}>
                Votre restaurant prend des commandes{" "}
                <span style={{ color: G }}>pendant que vous dormez</span>
              </h1>

              <p style={{ fontSize: 17, color: TX2, lineHeight: 1.72, maxWidth: 460, margin: 0, fontWeight: 400 }}>
                RestoFlow transforme votre WhatsApp en assistant IA — il répond, prend les commandes et encaisse. Configuré en 10 minutes.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/signup"
                  className="rf-btn-primary"
                  style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", backgroundColor: G, color: "#fff", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 14px rgba(26,77,46,.28)", transition: "background-color .15s, transform .2s cubic-bezier(0.23,1,0.32,1), box-shadow .2s", gap: 2 }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GL; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = G; e.currentTarget.style.transform = ""; }}
                >
                  <span>Démarrer mon essai gratuit</span>
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: .7 }}>7 jours — sans carte bancaire</span>
                </Link>
                <a href="#features"
                  className="rf-btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, color: G, padding: "14px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none", border: `1.5px solid ${BRD}`, backgroundColor: "#fff", transition: "border-color .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = G)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = BRD)}
                >
                  Voir comment ça marche
                </a>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex" }}>
                  {[{ini:"IK",col:"#f59e0b"},{ini:"FD",col:"#8b5cf6"},{ini:"MC",col:"#0891b2"}].map((av, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: av.col, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", marginLeft: i > 0 ? -8 : 0, border: "2px solid #fff" }}>{av.ini}</div>
                  ))}
                </div>
                <span style={{ fontSize: 13, color: TX2 }}>
                  <strong style={{ color: TX }}>12 restaurants</strong> nous ont rejoints ce mois-ci
                </span>
              </div>
            </div>

            {/* Right — WhatsApp mockup */}
            <div style={{ display: "flex", justifyContent: "center" }} className="rf-wa">
              <div style={{ width: 308, borderRadius: 18, overflow: "hidden", boxShadow: "0 32px 72px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05)", flexShrink: 0 }}>
                <div style={{ backgroundColor: "#075e54", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Utensils size={16} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>Chez Aminata BO</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>en ligne</div>
                  </div>
                </div>
                <div style={{ backgroundColor: "#ece5dd", padding: "10px 8px", minHeight: 330, display: "flex", flexDirection: "column", gap: 5 }}>
                  {CHAT_MSGS.map((msg, i) => {
                    const isC = msg.from === "client";
                    return (
                      <div key={i} className="rf-bubble" style={{ display: "flex", justifyContent: isC ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "82%", padding: "7px 10px", borderRadius: isC ? "12px 2px 12px 12px" : "2px 12px 12px 12px", backgroundColor: isC ? "#dcf8c6" : "#fff", fontSize: 11.5, lineHeight: 1.5, color: "#111", boxShadow: "0 1px 2px rgba(0,0,0,.07)", whiteSpace: "pre-line" }}>
                          {msg.text}
                          <div style={{ fontSize: 9, color: "#8898aa", textAlign: "right", marginTop: 2 }}>{msg.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ backgroundColor: "#ecfdf5", padding: "8px 12px", display: "flex", alignItems: "center", gap: 7, borderTop: `1px solid ${BRD}` }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: GL, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: GL }}>Réponse en 2 secondes</span>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @media(max-width:900px){
              .rf-hero { grid-template-columns: 1fr !important; gap: 48px !important; }
              .rf-wa { display: none !important; }
            }
          `}</style>
        </section>

        {/* ── CE QU'IL VOUS FAUT ────────────────────────────────── */}
        <section style={{ padding: "80px 24px", backgroundColor: "#fff", borderBottom: `1px solid ${BRD}` }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 48 }}>
              <h2 style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.8px", color: TX, margin: "0 0 12px", lineHeight: 1.2 }}>
                Ce qu&apos;il vous faut pour démarrer
              </h2>
              <p style={{ fontSize: 16, color: TX2, margin: 0, lineHeight: 1.65 }}>
                Configuration en 10 minutes, nous vous guidons étape par étape
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }} className="rf-prereqs">
              {/* Card 1 — Numéro WhatsApp */}
              <div style={{ borderRadius: 16, border: `1px solid ${BRD}`, backgroundColor: BG, padding: "28px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: G, flexShrink: 0 }}>
                    <Smartphone size={22} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: G, backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" as const }}>Obligatoire</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: TX, margin: "0 0 8px", lineHeight: 1.3 }}>Un numéro WhatsApp dédié à votre restaurant</h3>
                  <p style={{ fontSize: 13.5, color: TX2, margin: 0, lineHeight: 1.7 }}>Ce numéro ne doit pas être utilisé sur WhatsApp personnelle. Idéalement un numéro réservé à votre restaurant. Une nouvelle carte SIM Orange Mali ou Moov suffit, à partir de 500 FCFA.</p>
                </div>
              </div>

              {/* Card 2 — Email */}
              <div style={{ borderRadius: 16, border: `1px solid ${BRD}`, backgroundColor: BG, padding: "28px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: G, flexShrink: 0 }}>
                    <Mail size={22} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: G, backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" as const }}>Obligatoire</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: TX, margin: "0 0 8px", lineHeight: 1.3 }}>Une adresse email</h3>
                  <p style={{ fontSize: 13.5, color: TX2, margin: 0, lineHeight: 1.7 }}>Pour créer votre compte RestoFlow. Un Gmail suffit parfaitement.</p>
                </div>
              </div>

              {/* Card 3 — Config technique */}
              <div style={{ borderRadius: 16, border: "1px solid #bfdbfe", backgroundColor: "#eff6ff", padding: "28px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
                    <Settings size={22} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", backgroundColor: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" as const }}>On s&apos;en occupe</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: TX, margin: "0 0 8px", lineHeight: 1.3 }}>La configuration technique</h3>
                  <p style={{ fontSize: 13.5, color: TX2, margin: 0, lineHeight: 1.7 }}>Connexion WhatsApp Business, configuration du bot, intégration des paiements — notre équipe vous accompagne lors de l&apos;installation. Vous n&apos;avez rien à faire techniquement.</p>
                </div>
              </div>
            </div>

            {/* Encadré vert */}
            <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: "16px 24px", textAlign: "center" as const }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: G }}>
                Essai gratuit de 7 jours — Aucune carte bancaire requise — Annulation possible à tout moment
              </p>
            </div>
          </div>

          <style>{`@media(max-width:900px){ .rf-prereqs { grid-template-columns: 1fr !important; } }`}</style>
        </section>

        {/* ── MARQUEE ────────────────────────────────────────────── */}
        <div style={{ paddingTop: 24, paddingBottom: 24, overflow: "hidden", borderTop: `1px solid ${BRD}`, borderBottom: `1px solid ${BRD}`, backgroundColor: "#fff" }}>
          <div className="rf-marquee" style={{ display: "flex", width: "max-content" }}>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, paddingLeft: 28, paddingRight: 28, whiteSpace: "nowrap", fontSize: 14, fontWeight: 600, color: TX2 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: G, display: "inline-block", flexShrink: 0 }} />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURES — Bento Grid ──────────────────────────────── */}
        <section id="features" style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>

            {/* Scrub heading */}
            <div ref={scrubRef} style={{ maxWidth: 720, marginBottom: 56 }}>
              <p style={{ fontSize: "clamp(1.7rem, 3vw, 3rem)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-1px", color: TX, margin: 0 }}>
                {("Chaque fonctionnalité est conçue pour augmenter vos revenus, pas juste votre charge de travail.").split(" ").map((word, i) => (
                  <span key={i} className="rf-word" style={{ display: "inline-block", marginRight: "0.28em" }}>{word}</span>
                ))}
              </p>
            </div>

            {/* Bento 3×2 — 6 cards × col-span-2 = 12 cells = 0 dead space */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gridAutoRows: "auto", gap: 14, gridAutoFlow: "dense" }}>
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="rf-bento-card"
                  style={{
                    gridColumn: "span 2",
                    backgroundColor: "#fff",
                    border: `1px solid ${BRD}`,
                    borderRadius: 16,
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    if (!window.matchMedia("(hover: hover)").matches) return;
                    e.currentTarget.style.transition = "box-shadow .18s cubic-bezier(0.23,1,0.32,1), transform .18s cubic-bezier(0.23,1,0.32,1), border-color .18s";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,77,46,.10), 0 2px 6px rgba(0,0,0,.05)";
                    e.currentTarget.style.borderColor = "#a7f3d0";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transition = "box-shadow .1s ease, transform .1s ease, border-color .1s";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = BRD;
                    e.currentTarget.style.transform = "";
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: G }}>
                    <f.Icon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: TX, margin: "0 0 6px", letterSpacing: "-0.2px" }}>{f.title}</h3>
                    <p style={{ fontSize: 13.5, color: TX2, margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
                  </div>
                  <div style={{ marginTop: "auto" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 20, padding: "3px 10px", fontSize: 11.5, fontWeight: 700, color: G }}>
                      {f.roi}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS — dark section ────────────────────────── */}
        <section id="testimonials" style={{ padding: "96px 24px", backgroundColor: TX }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GL, letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 16 }}>Preuve sociale</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.8px", margin: "0 0 52px", maxWidth: 520, lineHeight: 1.15 }}>
              Ce que disent les restaurants qui utilisent RestoFlow
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="rf-testi">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16, borderRadius: 16, padding: "28px", backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1,2,3,4,5].map((s) => <Star key={s} size={13} style={{ color: "#f59e0b", fill: "#f59e0b" }} />)}
                  </div>
                  <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", lineHeight: 1.78, margin: 0, fontStyle: "italic" as const, flex: 1 }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{t.initials}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>{t.name}</div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)" }}>{t.resto}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <style>{`
            @media(max-width:900px){ .rf-testi { grid-template-columns: 1fr !important; } }
          `}</style>
        </section>

        {/* ── PRICING ────────────────────────────────────────────── */}
        <section id="pricing" style={{ padding: "96px 24px", backgroundColor: BG }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 56 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: GL, letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 16 }}>Tarifs</p>
              <h2 style={{ fontSize: "clamp(1.9rem, 3.5vw, 3rem)", fontWeight: 800, letterSpacing: "-1px", color: TX, margin: "0 0 16px", lineHeight: 1.15 }}>
                Moins cher qu&apos;un employé.<br />Plus fiable que n&apos;importe qui.
              </h2>
              <p style={{ fontSize: 16, color: TX2, margin: "0 auto", maxWidth: 480, lineHeight: 1.65 }}>
                Un employé coûte 50 000 FCFA/mois et fait des erreurs. RestoFlow travaille 24h/24 sans jamais se tromper.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "start" }} className="rf-plans">
              {PLANS.map((plan, i) => (
                <div key={i} style={{
                  borderRadius: 16, padding: "32px",
                  border: plan.popular ? `2px solid ${G}` : `1px solid ${BRD}`,
                  backgroundColor: plan.popular ? G : "#fff",
                  position: "relative" as const,
                  display: "flex", flexDirection: "column" as const,
                  boxShadow: plan.popular ? "0 20px 48px rgba(26,77,46,.18)" : "0 2px 8px rgba(0,0,0,.04)",
                }}>
                  {plan.popular && (
                    <div style={{ position: "absolute" as const, top: -13, left: "50%", transform: "translateX(-50%)", backgroundColor: GL, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                      Le plus populaire
                    </div>
                  )}
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: plan.popular ? "#fff" : TX, margin: "0 0 4px", letterSpacing: "-0.3px" }}>{plan.name}</h3>
                  <p style={{ fontSize: 12, color: plan.popular ? "rgba(255,255,255,.5)" : TX2, margin: "0 0 20px" }}>{plan.desc}</p>
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: plan.popular ? "#fff" : G, letterSpacing: "-1.5px" }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: plan.popular ? "rgba(255,255,255,.5)" : TX2, marginLeft: 5 }}>FCFA / mois</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", flex: 1, display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {plan.features.map((feat, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, color: plan.popular ? "rgba(255,255,255,.85)" : TX2 }}>
                        <CheckCircle2 size={15} style={{ color: plan.popular ? "#86efac" : GL, flexShrink: 0, marginTop: 2 }} />
                        {feat}
                      </li>
                    ))}
                    {plan.missing.map((feat, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, color: "rgba(150,150,150,.45)" }}>
                        <XIcon size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  {plan.href.startsWith("http") ? (
                    <a href={plan.href} target="_blank" rel="noopener noreferrer"
                      style={{ display: "block", textAlign: "center" as const, padding: "13px 0", backgroundColor: "transparent", color: plan.popular ? "#fff" : G, border: `1.5px solid ${plan.popular ? "rgba(255,255,255,.25)" : G}`, borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "background-color .15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = plan.popular ? "rgba(255,255,255,.1)" : "#ecfdf5"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                    >{plan.cta}</a>
                  ) : (
                    <Link href={plan.href}
                      style={{ display: "block", textAlign: "center" as const, padding: "13px 0", backgroundColor: plan.popular ? "#fff" : G, color: plan.popular ? G : "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "opacity .15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = ".88")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >{plan.cta}</Link>
                  )}
                </div>
              ))}
            </div>

            <p style={{ textAlign: "center" as const, marginTop: 32, fontSize: 13, color: TX2 }}>
              Paiement sécurisé via Orange Money et Wave — Annulation possible à tout moment — Aucune carte bancaire pour l&apos;essai
            </p>
          </div>

          <style>{`
            @media(max-width:900px){ .rf-plans { grid-template-columns: 1fr !important; } }
          `}</style>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section id="faq" style={{ padding: "96px 24px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GL, letterSpacing: ".12em", textTransform: "uppercase" as const, marginBottom: 16 }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.8px", color: TX, margin: "0 0 48px", lineHeight: 1.15 }}>
              Vos questions,<br />nos réponses directes
            </h2>
            <div>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ borderBottom: `1px solid ${BRD}` }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    style={{ width: "100%", textAlign: "left" as const, padding: "20px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: TX, lineHeight: 1.4 }}>{faq.q}</span>
                    <ChevronDown size={18} style={{ color: openFaq === i ? G : TX2, transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1)", flexShrink: 0 }} />
                  </button>
                  <div style={{ display: "grid", gridTemplateRows: openFaq === i ? "1fr" : "0fr", transition: "grid-template-rows 220ms cubic-bezier(0.23, 1, 0.32, 1)", overflow: "hidden" }}>
                    <div style={{ overflow: "hidden" }}>
                      <p style={{ fontSize: 14, color: TX2, lineHeight: 1.78, margin: "0 0 20px", paddingRight: 28 }}>{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────── */}
        <section style={{ padding: "100px 24px", backgroundColor: G, position: "relative" as const, overflow: "hidden" }}>
          <div style={{ position: "absolute" as const, inset: 0, backgroundImage: "radial-gradient(ellipse at 15% 50%, rgba(255,255,255,.05) 0%, transparent 60%), radial-gradient(ellipse at 85% 50%, rgba(255,255,255,.05) 0%, transparent 60%)", pointerEvents: "none" as const }} />
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" as const, position: "relative" as const }}>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.8rem)", fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", margin: "0 0 20px", lineHeight: 1.1 }}>
              Rejoignez les restaurants qui ne perdent plus de commandes
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.65)", margin: "0 0 36px", lineHeight: 1.65 }}>
              7 jours gratuits. Configuration en 10 minutes. Aucune carte requise.
            </p>
            <Link href="/signup"
              className="rf-btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#fff", color: G, padding: "17px 40px", borderRadius: 10, fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 28px rgba(0,0,0,.2)", transition: "transform .2s cubic-bezier(0.23,1,0.32,1), box-shadow .2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.26)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,.2)"; }}
            >
              Démarrer mon essai gratuit <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer style={{ backgroundColor: "#0d1b10", padding: "40px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" as const, gap: 24, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>RF</div>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>RestoFlow</span>
                </div>
                <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.28)", margin: 0 }}>L&apos;assistant WhatsApp des restaurants maliens</p>
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const, alignItems: "center" }}>
                {["CGU","Confidentialité","Contact"].map((l) => (
                  <a key={l} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,.32)", textDecoration: "none", transition: "color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.32)")}
                  >{l}</a>
                ))}
                <a href="https://wa.me/22376753087" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#25d366", textDecoration: "none" }}
                >
                  <MessageCircle size={13} /> Support
                </a>
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: 20, textAlign: "center" as const }}>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.18)", margin: 0 }}>© 2026 RestoFlow — Mali</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
