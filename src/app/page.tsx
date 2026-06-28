"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const G  = "#1a4d2e";
const GL = "#16a34a";

// ─── Données statiques ────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "🤖", title: "Bot IA 24h/24",             desc: "Répond instantanément à chaque message WhatsApp, même la nuit et les week-ends, sans intervention humaine." },
  { icon: "📦", title: "Prise de commande auto",   desc: "Extrait les plats, calcule le total et confirme la commande directement avec le client." },
  { icon: "💰", title: "Orange Money & Wave",       desc: "Lien de paiement envoyé automatiquement au client après chaque commande confirmée." },
  { icon: "🗺️", title: "Livraison par quartier",   desc: "Frais de livraison configurables et calculés automatiquement selon le quartier du client." },
  { icon: "📊", title: "Dashboard temps réel",     desc: "Toutes vos commandes sur un seul écran, avec statuts mis à jour en direct." },
  { icon: "⏰", title: "Respect des horaires",      desc: "Le bot informe vos clients quand vous êtes fermés et leur indique la prochaine ouverture." },
];

const STEPS = [
  { n: "01", title: "Inscrivez-vous et configurez votre menu",   sub: "5 minutes suffisent pour paramétrer votre bot, ajouter vos plats et vos horaires." },
  { n: "02", title: "Partagez votre numéro WhatsApp",            sub: "Vos clients contactent votre numéro WhatsApp habituel — rien ne change pour eux." },
  { n: "03", title: "Recevez et gérez vos commandes",            sub: "Le bot gère tout automatiquement. Vous n'intervenez que pour préparer et livrer." },
];

const PLANS = [
  {
    name: "Starter", price: "15 000", popular: false,
    desc: "Pour démarrer sans risque",
    features: ["Jusqu'à 100 commandes/mois", "1 numéro WhatsApp", "Menu illimité", "FAQ configurable", "Support email"],
  },
  {
    name: "Pro", price: "30 000", popular: true,
    desc: "Le plus choisi par nos restaurants",
    features: ["Commandes illimitées", "Zones de livraison", "Statistiques avancées", "FAQ IA personnalisée", "Support prioritaire 7j/7"],
  },
  {
    name: "Business", price: "50 000", popular: false,
    desc: "Pour les groupes et chaînes",
    features: ["Multi-établissements", "Rapport mensuel détaillé", "Intégration personnalisée", "Manager dédié", "SLA garanti 99,9 %"],
  },
];

const FAQS = [
  { q: "Dois-je avoir un compte WhatsApp Business ?",      a: "Oui, mais nous vous guidons étape par étape pour configurer votre numéro WhatsApp Business gratuitement en moins de 10 minutes." },
  { q: "Que se passe-t-il si je suis fermé ?",             a: "Le bot informe automatiquement vos clients de vos horaires d'ouverture et leur propose de passer commande pour dès que vous ouvrez." },
  { q: "Puis-je modifier mon menu facilement ?",           a: "Oui, depuis votre dashboard en quelques clics. Le bot se met à jour instantanément, sans aucune manipulation technique." },
  { q: "Comment fonctionne le paiement des clients ?",    a: "Via Orange Money ou Wave — un lien de paiement est envoyé automatiquement au client après chaque commande confirmée par le bot." },
  { q: "Y a-t-il un engagement de durée ?",               a: "Aucun. Vous démarrez avec 14 jours gratuits et pouvez annuler à tout moment, sans frais ni pénalité." },
];

const CHAT = [
  { from: "client", text: "Bonsoir 👋 je voudrais commander", time: "18:42" },
  { from: "bot",    text: "Bonsoir ! 😊 Bienvenue chez *Chez Aminata*\n\nVoici notre menu :\n🍗 Poulet yassa — 3 500 FCFA\n🐟 Tilapia grillé — 4 000 FCFA\n🍚 Riz au gras — 2 500 FCFA\n\nQue souhaitez-vous ?", time: "18:42" },
  { from: "client", text: "1 Poulet yassa stp", time: "18:43" },
  { from: "bot",    text: "Super ! 🎉\n1× Poulet yassa = 3 500 FCFA\n\nLivraison ou retrait sur place ?", time: "18:43" },
  { from: "client", text: "Livraison à Hamdallaye", time: "18:44" },
  { from: "bot",    text: "✅ Commande confirmée !\n📦 Total : 4 000 FCFA\n🚚 Livraison : 500 FCFA\n\nLien Wave envoyé 📲", time: "18:45" },
];

const RESTAURANTS = ["Chez Aminata", "Saveur du Niger", "Le Baobab Gourmand", "Délices de Bamako"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [openFaq,  setOpenFaq]  = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Navbar shadow on scroll
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Scroll-triggered fade-in with IntersectionObserver
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
        *{box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{margin:0;}
        /* Fade-in scroll */
        .rff{opacity:0;transform:translateY(28px);transition:opacity .65s ease,transform .65s ease;}
        .rff.rfv{opacity:1;transform:translateY(0);}
        .rff.d1{transition-delay:.08s;} .rff.d2{transition-delay:.16s;}
        .rff.d3{transition-delay:.24s;} .rff.d4{transition-delay:.32s;}
        .rff.d5{transition-delay:.40s;} .rff.d6{transition-delay:.48s;}
        /* WhatsApp chat bubbles */
        @keyframes rfb{from{opacity:0;transform:translateY(8px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
        .chat-b{opacity:0;animation:rfb .35s ease forwards;}
        .chat-b:nth-child(1){animation-delay:.5s;}
        .chat-b:nth-child(2){animation-delay:1.6s;}
        .chat-b:nth-child(3){animation-delay:3.1s;}
        .chat-b:nth-child(4){animation-delay:4.3s;}
        .chat-b:nth-child(5){animation-delay:5.7s;}
        .chat-b:nth-child(6){animation-delay:7.0s;}
        /* Responsive */
        @media(max-width:900px){
          .rf-hero{flex-direction:column!important;text-align:center;align-items:center!important;}
          .rf-hero-btns{justify-content:center!important;}
          .rf-wa{display:none!important;}
          .rf-nav-links{display:none!important;}
          .rf-feat{grid-template-columns:repeat(2,1fr)!important;}
          .rf-steps{flex-direction:column!important;}
          .rf-plans{flex-direction:column!important;align-items:center!important;}
          .rf-plans>div{max-width:400px!important;width:100%!important;}
          .rf-hero-title{font-size:34px!important;letter-spacing:-1px!important;}
          .rf-trust{flex-wrap:wrap!important;gap:18px!important;}
          .rf-footer-inner{flex-direction:column!important;text-align:center!important;}
        }
        @media(max-width:540px){
          .rf-feat{grid-template-columns:1fr!important;}
          .rf-hero-title{font-size:28px!important;}
          .rf-section{padding:60px 20px!important;}
        }
      `}</style>

      <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", color: "#0f172a", backgroundColor: "#fff", overflowX: "hidden" }}>

        {/* ═══════════════════════════════════════════════════════════════
            NAVBAR
        ════════════════════════════════════════════════════════════════ */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          backgroundColor: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(8px)",
          borderBottom: scrolled ? "1px solid #e2e8f0" : "1px solid transparent",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.07)" : "none",
          transition: "border-color .2s, box-shadow .2s",
        }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", flexShrink: 0 }}>RF</div>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px" }}>RestoFlow</span>
            </Link>

            {/* Nav links */}
            <div className="rf-nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {[["Fonctionnalités", "#features"], ["Tarifs", "#tarifs"], ["FAQ", "#faq"]].map(([label, href]) => (
                <a key={label} href={href} style={{ fontSize: 14, fontWeight: 500, color: "#64748b", textDecoration: "none", transition: "color .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = G)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                >{label}</a>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/login" style={{ fontSize: 13.5, fontWeight: 600, color: G, padding: "7px 16px", borderRadius: 8, border: `1.5px solid ${G}`, textDecoration: "none", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = G; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = G; }}
              >Se connecter</Link>
              <Link href="/signup" style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", padding: "7px 18px", borderRadius: 8, backgroundColor: G, textDecoration: "none", transition: "background .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GL)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = G)}
              >Essai gratuit</Link>
            </div>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════ */}
        <section style={{ paddingTop: 130, paddingBottom: 80, paddingLeft: 28, paddingRight: 28, background: "linear-gradient(155deg,#f0fdf4 0%,#fff 55%)" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="rf-hero" style={{ display: "flex", alignItems: "center", gap: 60 }}>

              {/* ── Texte gauche */}
              <div style={{ flex: "0 0 52%", maxWidth: 590 }}>

                {/* Badge */}
                <div className="rff" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "5px 14px", marginBottom: 24 }}>
                  <span style={{ color: GL }}>✦</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: G }}>Nouveau — Assistant WhatsApp IA pour restaurants</span>
                </div>

                {/* Titre */}
                <h1 className="rff d1 rf-hero-title" style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.08, letterSpacing: "-1.8px", color: "#0f172a", margin: "0 0 22px" }}>
                  Votre restaurant prend des commandes WhatsApp{" "}
                  <span style={{ color: G }}>automatiquement</span>, 24h/24
                </h1>

                {/* Sous-titre */}
                <p className="rff d2" style={{ fontSize: 17.5, color: "#64748b", lineHeight: 1.65, margin: "0 0 34px", fontWeight: 400 }}>
                  RestoFlow transforme votre WhatsApp en assistant intelligent. Vos clients commandent, le bot répond, vous encaissez —{" "}
                  <strong style={{ color: "#0f172a", fontWeight: 600 }}>même pendant que vous dormez.</strong>
                </p>

                {/* Boutons */}
                <div className="rff rf-hero-btns d3" style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                  <Link href="/signup" style={{ display: "inline-flex", flexDirection: "column" as const, alignItems: "center", backgroundColor: G, color: "#fff", padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: "0 6px 24px rgba(26,77,46,0.32)", transition: "all .15s", gap: 1 }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GL; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = G; e.currentTarget.style.transform = ""; }}
                  >
                    <span>Commencer gratuitement</span>
                    <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.75 }}>14 jours d&apos;essai — sans carte</span>
                  </Link>
                  <a href="#features" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: G, padding: "14px 22px", borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none", border: `1.5px solid ${G}`, transition: "background .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0fdf4")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span style={{ fontSize: 13 }}>▶</span> Voir une démo
                  </a>
                </div>

                {/* Social proof */}
                <div className="rff d4" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 32 }}>
                  <div style={{ display: "flex" }}>
                    {["🧑‍🍳", "👨‍🍳", "👩‍🍳"].map((emoji, i) => (
                      <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: ["#fbbf24", "#f97316", "#10b981"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginLeft: i > 0 ? -9 : 0, border: "2px solid #fff", zIndex: 3 - i, position: "relative" as const }}>
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 13.5, color: "#64748b", margin: 0 }}>
                    <strong style={{ color: "#0f172a" }}>+25 restaurants</strong> l&apos;utilisent déjà à Bamako
                  </p>
                </div>
              </div>

              {/* ── Mockup WhatsApp droite */}
              <div className="rf-wa" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
                <div style={{ width: 310, borderRadius: 22, overflow: "hidden", boxShadow: "0 28px 80px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.05)" }}>

                  {/* Header WA */}
                  <div style={{ backgroundColor: G, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🍽️</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Chez Aminata</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>Bot IA · répond en &lt; 3s</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ backgroundColor: "#ece5dd", padding: "10px 9px", minHeight: 340, display: "flex", flexDirection: "column" as const, gap: 5 }}>
                    {CHAT.map((msg, i) => {
                      const isClient = msg.from === "client";
                      return (
                        <div key={i} className="chat-b" style={{ display: "flex", justifyContent: isClient ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "84%", padding: "7px 10px", borderRadius: isClient ? "12px 2px 12px 12px" : "2px 12px 12px 12px", backgroundColor: isClient ? "#dcf8c6" : "#fff", fontSize: 12, lineHeight: 1.5, color: "#111", boxShadow: "0 1px 2px rgba(0,0,0,.08)", whiteSpace: "pre-line" as const }}>
                            {msg.text}
                            <div style={{ fontSize: 9.5, color: "#94a3b8", textAlign: "right" as const, marginTop: 3 }}>{msg.time} {isClient ? "" : "✓✓"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer WA */}
                  <div style={{ backgroundColor: "#f0f0f0", padding: "9px 10px", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid #ddd" }}>
                    <div style={{ flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: "7px 13px", fontSize: 12, color: "#bbb", border: "1px solid #e5e7eb" }}>Écrivez un message…</div>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📤</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            LOGOS DE CONFIANCE
        ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: "32px 28px", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" as const }}>
            <p className="rff" style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, marginBottom: 18 }}>
              Déjà utilisé par des restaurants à Bamako
            </p>
            <div className="rf-trust" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
              {RESTAURANTS.map((name) => (
                <span key={name} style={{ fontSize: 15, fontWeight: 800, color: "#d1d5db", letterSpacing: "-0.2px" }}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FONCTIONNALITÉS
        ════════════════════════════════════════════════════════════════ */}
        <section id="features" className="rf-section" style={{ padding: "96px 28px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>

            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 56 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: GL, letterSpacing: ".1em", textTransform: "uppercase" as const }}>Fonctionnalités</span>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-1.2px", margin: "10px 0 14px", color: "#0f172a" }}>
                Tout ce dont votre restaurant a besoin
              </h2>
              <p style={{ fontSize: 17, color: "#64748b", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
                Un seul outil pour automatiser vos commandes WhatsApp de A à Z.
              </p>
            </div>

            <div className="rf-feat" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
              {FEATURES.map((f, i) => (
                <div key={i} className={`rff d${i + 1}`}
                  style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "28px 24px", transition: "all .2s", cursor: "default" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(26,77,46,0.1)"; e.currentTarget.style.borderColor = "#bbf7d0"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = ""; }}
                >
                  <div style={{ fontSize: 30, marginBottom: 14 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{f.title}</h3>
                  <p style={{ fontSize: 13.5, color: "#64748b", margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            COMMENT ÇA MARCHE
        ════════════════════════════════════════════════════════════════ */}
        <section className="rf-section" style={{ padding: "80px 28px", backgroundColor: "#f8fafc" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>

            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 56 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: GL, letterSpacing: ".1em", textTransform: "uppercase" as const }}>Simple comme bonjour</span>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-1.2px", margin: "10px 0", color: "#0f172a" }}>
                Comment ça marche ?
              </h2>
            </div>

            <div className="rf-steps" style={{ display: "flex", gap: 28 }}>
              {STEPS.map((s, i) => (
                <div key={i} className={`rff d${i + 1}`} style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#f0fdf4", border: `2px solid ${G}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: G, fontFamily: "monospace", letterSpacing: "-1px" }}>{s.n}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, backgroundColor: "#e2e8f0", borderRadius: 1 }} />
                    )}
                  </div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.65 }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            TARIFS
        ════════════════════════════════════════════════════════════════ */}
        <section id="tarifs" className="rf-section" style={{ padding: "96px 28px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>

            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 56 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: GL, letterSpacing: ".1em", textTransform: "uppercase" as const }}>Tarifs</span>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-1.2px", margin: "10px 0 14px", color: "#0f172a" }}>
                Des prix adaptés à votre restaurant
              </h2>
              <p style={{ fontSize: 17, color: "#64748b" }}>14 jours d&apos;essai gratuit — aucune carte bancaire requise</p>
            </div>

            <div className="rf-plans" style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
              {PLANS.map((plan, i) => (
                <div key={i} className={`rff d${i + 1}`} style={{ flex: 1, borderRadius: 16, padding: "32px 26px", border: plan.popular ? `2px solid ${G}` : "1.5px solid #e2e8f0", backgroundColor: plan.popular ? "#f0fdf4" : "#fff", position: "relative" as const, display: "flex", flexDirection: "column" as const }}>
                  {plan.popular && (
                    <div style={{ position: "absolute" as const, top: -14, left: "50%", transform: "translateX(-50%)", backgroundColor: G, color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "4px 16px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
                      ⭐ Populaire
                    </div>
                  )}

                  <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 18px" }}>{plan.desc}</p>

                  <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: G, letterSpacing: "-1.5px" }}>{plan.price}</span>
                    <span style={{ fontSize: 13.5, color: "#94a3b8", marginLeft: 5 }}>FCFA / mois</span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", flex: 1, display: "flex", flexDirection: "column" as const, gap: 10 }}>
                    {plan.features.map((feat, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 14, color: "#374151" }}>
                        <span style={{ color: GL, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup"
                    style={{ display: "block", textAlign: "center" as const, padding: "12px 0", backgroundColor: plan.popular ? G : "transparent", color: plan.popular ? "#fff" : G, border: `1.5px solid ${G}`, borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "all .15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = GL; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = GL; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = plan.popular ? G : "transparent"; e.currentTarget.style.color = plan.popular ? "#fff" : G; e.currentTarget.style.borderColor = G; }}
                  >
                    Commencer →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FAQ
        ════════════════════════════════════════════════════════════════ */}
        <section id="faq" className="rf-section" style={{ padding: "80px 28px", backgroundColor: "#f8fafc" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>

            <div className="rff" style={{ textAlign: "center" as const, marginBottom: 48 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: GL, letterSpacing: ".1em", textTransform: "uppercase" as const }}>FAQ</span>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-1.2px", margin: "10px 0", color: "#0f172a" }}>
                Questions fréquentes
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column" as const }}>
              {FAQS.map((faq, i) => (
                <div key={i} className={`rff d${i + 1}`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: "100%", textAlign: "left" as const, padding: "20px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}
                  >
                    <span style={{ fontSize: 15.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.4 }}>{faq.q}</span>
                    <span style={{ fontSize: 20, color: openFaq === i ? G : "#cbd5e1", transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform .25s, color .15s", flexShrink: 0 }}>
                      ⌃
                    </span>
                  </button>
                  <div style={{ maxHeight: openFaq === i ? 180 : 0, overflow: "hidden", transition: "max-height .3s ease" }}>
                    <p style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.72, margin: "0 0 22px", paddingRight: 28 }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CTA FINAL
        ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: "100px 28px", backgroundColor: G }}>
          <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" as const }}>
            <div className="rff">
              <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 24 }}>
                🚀
              </div>
              <h2 style={{ fontSize: 42, fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", margin: "0 0 16px", lineHeight: 1.12 }}>
                Prêt à automatiser votre restaurant ?
              </h2>
              <p style={{ fontSize: 17, color: "rgba(255,255,255,.72)", margin: "0 0 38px", lineHeight: 1.6 }}>
                14 jours gratuits, aucune carte bancaire requise.
                <br />Commencez à recevoir des commandes dès aujourd&apos;hui.
              </p>
              <Link href="/signup"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#fff", color: G, padding: "15px 36px", borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 6px 32px rgba(0,0,0,0.22)", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 40px rgba(0,0,0,0.28)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 32px rgba(0,0,0,0.22)"; }}
              >
                Commencer maintenant →
              </Link>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.45)", margin: "18px 0 0" }}>
                Sans engagement · Annulation à tout moment
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════════════════ */}
        <footer style={{ backgroundColor: "#0f172a", padding: "44px 28px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div className="rf-footer-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" as const }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff" }}>RF</div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>RestoFlow</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,.28)" }}>— Votre restaurant, automatisé.</span>
              </div>

              {/* Liens */}
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" as const }}>
                {["CGU", "Confidentialité", "Contact"].map((l) => (
                  <a key={l} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,.4)", textDecoration: "none", transition: "color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,.4)")}
                  >{l}</a>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", marginTop: 28, paddingTop: 22, textAlign: "center" as const }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", margin: 0 }}>
                © 2026 RestoFlow — Fait avec ❤️ au Mali 🇲🇱
              </p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
