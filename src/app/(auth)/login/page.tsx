"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Palette ──────────────────────────────────────────────────────────────
const G = "#1a4d2e";
const GH = "#246b3e";
const TX = "#111827";
const SB = "#6b7280";
const BR = "#e5e7eb";
const RD = "#dc2626";

// ─── Validation helpers ───────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// ─── Styles partagés ──────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  height: 46, width: "100%", borderRadius: 8,
  border: `1px solid ${BR}`, padding: "0 14px",
  fontSize: 14, color: TX, outline: "none",
  backgroundColor: "#fff", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.15s",
};

const inputErr: React.CSSProperties = {
  ...inputBase,
  borderColor: "#fca5a5",
  backgroundColor: "#fff7f7",
};

const labelSt: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6,
};

const fieldSt: React.CSSProperties = { marginBottom: 16 };

const btnGreen: React.CSSProperties = {
  width: "100%", height: 48, borderRadius: 8,
  backgroundColor: G, color: "#fff",
  border: "none", fontSize: 15, fontWeight: 700,
  cursor: "pointer", transition: "background-color 0.15s",
  fontFamily: "inherit",
};

const btnGreenDisabled: React.CSSProperties = {
  ...btnGreen,
  backgroundColor: "#9ca3af",
  cursor: "not-allowed",
};

// ─── Page ─────────────────────────────────────────────────────────────────
type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Mode connexion ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // ── Mode inscription ──
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ── Validation inscription ──
  const v = {
    name: fullName.trim().length > 0,
    email: isValidEmail(regEmail),
    pass: regPassword.length >= 8,
    confirm: regPassword === confirmPwd && confirmPwd.length > 0,
    restaurant: restaurantName.trim().length > 0,
    whatsapp: whatsapp.trim().length > 6,
  };
  const canRegister = Object.values(v).every(Boolean);

  function touch(field: string) {
    setTouched((p) => ({ ...p, [field]: true }));
  }

  function showErr(field: string, ok: boolean) {
    return touched[field] && !ok;
  }

  // ── Basculer mode ──
  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setSuccess("");
    setForgotSent(false);
  }

  // ── Connexion ──────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  // ── Mot de passe oublié ────────────────────────────────────────────────
  async function handleForgotPassword() {
    if (!email) { setError("Saisissez votre email avant de réinitialiser."); return; }
    setError(""); setForgotLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://resto-flow-gold-ten.vercel.app/auth/callback",
    });
    setForgotLoading(false);
    if (err) { setError(err.message); return; }
    setForgotSent(true);
  }

  // ── Inscription ────────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!canRegister) return;
    setError(""); setSuccess(""); setLoading(true);

    const supabase = createClient();

    // 1. Créer le compte Supabase Auth
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpErr || !data.user) {
      setLoading(false);
      setError(signUpErr?.message ?? "Erreur lors de la création du compte.");
      return;
    }

    // 2. Créer le restaurant et lier l'utilisateur
    const res = await fetch("/api/onboarding/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: data.user.id,
        nom_restaurant: restaurantName.trim(),
        whatsapp_numero: whatsapp.trim(),
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Impossible de créer le restaurant.");
      return;
    }

    // 3. Rediriger
    if (data.session) {
      // Confirmation email désactivée → connexion immédiate
      router.push(`/${json.restaurant_id}/onboarding`);
    } else {
      // Confirmation email requise
      setSuccess(
        "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous."
      );
    }
  }

  // ─── Panneau gauche ────────────────────────────────────────────────────
  const leftPanel = (
    <div
      className="rf-left-panel"
      style={{
        width: 420, flexShrink: 0,
        backgroundColor: G,
        padding: "48px 44px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Motif fond subtil */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      {/* Logo */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 56 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 800, color: "#fff",
            letterSpacing: "-0.5px",
          }}>
            RF
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            RestoFlow
          </span>
        </div>

        {/* Slogan */}
        <h2 style={{
          fontSize: 26, fontWeight: 700, color: "#fff",
          lineHeight: 1.35, marginBottom: 16, letterSpacing: "-0.3px",
        }}>
          Votre assistant WhatsApp pour gérer les commandes automatiquement
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 48 }}>
          Rejoignez les restaurants maliens qui automatisent leurs commandes avec RestoFlow.
        </p>

        {/* 3 avantages */}
        {[
          { icon: "🤖", title: "Bot IA qui répond 24h/24",           desc: "Votre assistant WhatsApp ne dort jamais" },
          { icon: "📦", title: "Commandes gérées automatiquement",    desc: "De la prise de commande à la livraison" },
          { icon: "💰", title: "Orange Money & Wave intégré",         desc: "Paiement mobile en un message" },
        ].map(({ icon, title, desc }) => (
          <div key={title} style={{
            display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 24,
          }}>
            <span style={{
              fontSize: 26, width: 40, height: 40, borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {icon}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pied */}
      <p style={{ position: "relative", zIndex: 1, fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
        © 2026 RestoFlow — Fait au Mali 🇲🇱
      </p>
    </div>
  );

  // ─── Formulaire connexion ──────────────────────────────────────────────
  const loginForm = (
    <form onSubmit={handleLogin} noValidate>
      <div style={{ marginBottom: 32 }}>
        {/* Logo mobile */}
        <div className="rf-mobile-logo" style={{ display: "none", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: G,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff",
          }}>RF</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: TX, letterSpacing: "-0.5px" }}>RestoFlow</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: TX, letterSpacing: "-0.3px", marginBottom: 6 }}>
          Connexion
        </h1>
        <p style={{ fontSize: 14, color: SB }}>Accédez à votre espace restaurant.</p>
      </div>

      <div style={fieldSt}>
        <label style={labelSt}>Adresse email</label>
        <input
          type="email" required autoFocus autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          style={inputBase}
        />
      </div>

      <div style={fieldSt}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ ...labelSt, marginBottom: 0 }}>Mot de passe</label>
          <button
            type="button" onClick={handleForgotPassword} disabled={forgotLoading}
            style={{
              background: "none", border: "none", fontSize: 12, fontWeight: 600,
              color: G, cursor: "pointer", padding: 0,
              opacity: forgotLoading ? 0.5 : 1,
            }}
          >
            {forgotLoading ? "Envoi…" : "Mot de passe oublié ?"}
          </button>
        </div>
        <input
          type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputBase}
        />
      </div>

      {forgotSent && (
        <div style={{
          marginBottom: 16, padding: "12px 14px", borderRadius: 8,
          backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
          fontSize: 13, color: "#15803d",
        }}>
          ✓ Email de réinitialisation envoyé ! Vérifiez votre boîte mail.
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: 16, padding: "12px 14px", borderRadius: 8,
          backgroundColor: "#fef2f2", border: "1px solid #fecaca",
          fontSize: 13, color: RD,
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        style={loading ? btnGreenDisabled : btnGreen}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = GH; }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = G; }}
      >
        {loading ? "Connexion en cours…" : "Se connecter"}
      </button>

      <p style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: SB }}>
        Pas encore de compte ?{" "}
        <button
          type="button"
          onClick={() => switchMode("register")}
          style={{
            background: "none", border: "none", fontSize: 13,
            fontWeight: 700, color: G, cursor: "pointer", padding: 0,
          }}
        >
          Créer un compte
        </button>
      </p>
    </form>
  );

  // ─── Formulaire inscription ────────────────────────────────────────────
  const registerForm = (
    <form onSubmit={handleRegister} noValidate>
      <div style={{ marginBottom: 28 }}>
        {/* Logo mobile */}
        <div className="rf-mobile-logo" style={{ display: "none", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, backgroundColor: G,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff",
          }}>RF</div>
          <span style={{ fontSize: 20, fontWeight: 800, color: TX, letterSpacing: "-0.5px" }}>RestoFlow</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: TX, letterSpacing: "-0.3px", marginBottom: 6 }}>
          Créer votre compte
        </h1>
        <p style={{ fontSize: 14, color: SB }}>Lancez votre assistant WhatsApp en 5 minutes.</p>
      </div>

      {/* Nom complet */}
      <div style={fieldSt}>
        <label style={labelSt}>Nom complet <span style={{ color: RD }}>*</span></label>
        <input
          type="text" autoFocus autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => touch("name")}
          placeholder="Ex : Amadou Diallo"
          style={showErr("name", v.name) ? inputErr : inputBase}
        />
        {showErr("name", v.name) && <p style={{ fontSize: 12, color: RD, marginTop: 4 }}>Ce champ est obligatoire.</p>}
      </div>

      {/* Email */}
      <div style={fieldSt}>
        <label style={labelSt}>Adresse email <span style={{ color: RD }}>*</span></label>
        <input
          type="email" autoComplete="email"
          value={regEmail}
          onChange={(e) => setRegEmail(e.target.value)}
          onBlur={() => touch("email")}
          placeholder="vous@exemple.com"
          style={showErr("email", v.email) ? inputErr : inputBase}
        />
        {showErr("email", v.email) && <p style={{ fontSize: 12, color: RD, marginTop: 4 }}>Adresse email invalide.</p>}
      </div>

      {/* Mot de passe */}
      <div style={fieldSt}>
        <label style={labelSt}>
          Mot de passe <span style={{ color: RD }}>*</span>{" "}
          <span style={{ fontSize: 11, color: SB, fontWeight: 400 }}>(minimum 8 caractères)</span>
        </label>
        <input
          type="password" autoComplete="new-password"
          value={regPassword}
          onChange={(e) => setRegPassword(e.target.value)}
          onBlur={() => touch("pass")}
          placeholder="••••••••"
          style={showErr("pass", v.pass) ? inputErr : inputBase}
        />
        {/* Barre de force */}
        {regPassword.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{
                flex: 1, height: 3, borderRadius: 2,
                backgroundColor:
                  regPassword.length >= 12 ? "#16a34a"
                  : regPassword.length >= 8 ? "#f59e0b"
                  : n === 1 ? RD : BR,
                transition: "background-color 0.2s",
              }} />
            ))}
            <span style={{ fontSize: 11, color: SB, marginLeft: 4 }}>
              {regPassword.length < 8 ? "Trop court" : regPassword.length < 12 ? "Correct" : "Fort"}
            </span>
          </div>
        )}
        {showErr("pass", v.pass) && <p style={{ fontSize: 12, color: RD, marginTop: 4 }}>Au moins 8 caractères requis.</p>}
      </div>

      {/* Confirmer mot de passe */}
      <div style={fieldSt}>
        <label style={labelSt}>Confirmer le mot de passe <span style={{ color: RD }}>*</span></label>
        <input
          type="password" autoComplete="new-password"
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
          onBlur={() => touch("confirm")}
          placeholder="••••••••"
          style={showErr("confirm", v.confirm) ? inputErr : inputBase}
        />
        {showErr("confirm", v.confirm) && (
          <p style={{ fontSize: 12, color: RD, marginTop: 4 }}>
            {confirmPwd.length === 0 ? "Ce champ est obligatoire." : "Les mots de passe ne correspondent pas."}
          </p>
        )}
        {touched.confirm && v.confirm && (
          <p style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>✓ Mots de passe identiques</p>
        )}
      </div>

      {/* Séparateur */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
      }}>
        <div style={{ flex: 1, height: 1, backgroundColor: BR }} />
        <span style={{ fontSize: 12, color: SB, whiteSpace: "nowrap" }}>Votre restaurant</span>
        <div style={{ flex: 1, height: 1, backgroundColor: BR }} />
      </div>

      {/* Nom du restaurant */}
      <div style={fieldSt}>
        <label style={labelSt}>Nom du restaurant <span style={{ color: RD }}>*</span></label>
        <input
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          onBlur={() => touch("restaurant")}
          placeholder="Ex : Le Palais du Manding"
          style={showErr("restaurant", v.restaurant) ? inputErr : inputBase}
        />
        {showErr("restaurant", v.restaurant) && <p style={{ fontSize: 12, color: RD, marginTop: 4 }}>Ce champ est obligatoire.</p>}
      </div>

      {/* Numéro WhatsApp */}
      <div style={fieldSt}>
        <label style={labelSt}>
          Numéro WhatsApp du restaurant <span style={{ color: RD }}>*</span>
          <span style={{ fontSize: 11, color: SB, fontWeight: 400, marginLeft: 4 }}>(visible par les clients)</span>
        </label>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          onBlur={() => touch("whatsapp")}
          placeholder="Ex : +22376000000"
          style={showErr("whatsapp", v.whatsapp) ? inputErr : inputBase}
        />
        {showErr("whatsapp", v.whatsapp) && <p style={{ fontSize: 12, color: RD, marginTop: 4 }}>Numéro invalide (minimum 7 chiffres).</p>}
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: "12px 14px", borderRadius: 8,
          backgroundColor: "#fef2f2", border: "1px solid #fecaca",
          fontSize: 13, color: RD,
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{
          marginBottom: 16, padding: "12px 14px", borderRadius: 8,
          backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
          fontSize: 13, color: "#15803d", lineHeight: 1.6,
        }}>
          ✓ {success}
        </div>
      )}

      <button
        type="submit" disabled={!canRegister || loading}
        style={!canRegister || loading ? btnGreenDisabled : btnGreen}
        onMouseEnter={(e) => { if (canRegister && !loading) e.currentTarget.style.backgroundColor = GH; }}
        onMouseLeave={(e) => { if (canRegister && !loading) e.currentTarget.style.backgroundColor = G; }}
      >
        {loading ? "Création du compte…" : "Créer mon compte"}
      </button>

      <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: SB }}>
        Déjà un compte ?{" "}
        <button
          type="button"
          onClick={() => switchMode("login")}
          style={{
            background: "none", border: "none", fontSize: 13,
            fontWeight: 700, color: G, cursor: "pointer", padding: 0,
          }}
        >
          Se connecter
        </button>
      </p>
    </form>
  );

  // ─── Rendu ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Media queries pour responsive */}
      <style>{`
        @media (max-width: 768px) {
          .rf-left-panel { display: none !important; }
          .rf-mobile-logo { display: flex !important; }
          .rf-right-panel { padding: 40px 24px !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100dvh", fontFamily: "system-ui, Arial, sans-serif" }}>
        {leftPanel}

        {/* Panneau droit */}
        <div
          className="rf-right-panel"
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "#fff", padding: "48px 40px", overflowY: "auto",
          }}
        >
          <div style={{ width: "100%", maxWidth: 420 }}>
            {mode === "login" ? loginForm : registerForm}
          </div>
        </div>
      </div>
    </>
  );
}
