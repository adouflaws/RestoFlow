"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const G = "#1a4d2e";
const GH = "#246b3e";

const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const fieldStyle: React.CSSProperties = {
  height: 44, width: "100%", borderRadius: 8,
  border: "1px solid #e5e7eb", padding: "0 14px",
  fontSize: 14, color: "#111827", outline: "none",
  backgroundColor: "#fff", boxSizing: "border-box",
  fontFamily: "inherit",
};

const fieldErrStyle: React.CSSProperties = {
  ...fieldStyle,
  borderColor: "#fca5a5",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "#374151", marginBottom: 5,
};

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Règles de validation
  const rules = {
    fullName:       fullName.trim().length > 0,
    email:          isEmailValid(email),
    password:       password.length >= 8,
    restaurantName: restaurantName.trim().length > 0,
    whatsapp:       whatsapp.trim().length >= 7,
  };

  const canSubmit = Object.values(rules).every(Boolean);

  function touch(f: string) {
    setTouched((p) => ({ ...p, [f]: true }));
  }

  function hasErr(f: keyof typeof rules) {
    return touched[f] && !rules[f];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Marque tout comme touché pour afficher les erreurs
    const allTouched = Object.fromEntries(Object.keys(rules).map((k) => [k, true]));
    setTouched(allTouched);
    if (!canSubmit) return;

    setError(""); setSuccess(""); setLoading(true);

    const supabase = createClient();

    // 1. Créer le compte
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
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

    if (data.session) {
      // Email confirmation désactivée → redirection immédiate
      router.push(`/${json.restaurant_id}/onboarding`);
    } else {
      // Email confirmation requise
      setSuccess("Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "#f9fafb", fontFamily: "system-ui, Arial, sans-serif", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, backgroundColor: G,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 14,
            letterSpacing: "-0.5px",
          }}>
            RF
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
            RestoFlow
          </div>
        </div>

        {/* Carte */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 14,
          border: "1px solid #e5e7eb", padding: "36px 32px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
            Créez votre compte
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
            Votre assistant WhatsApp prêt en 5 minutes.
          </p>

          {/* Badge essai */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            backgroundColor: "#edf7f1", border: "1px solid #c3dece",
            borderRadius: 20, padding: "4px 12px", marginBottom: 24,
          }}>
            <span style={{ fontSize: 13 }}>✦</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: G }}>
              14 jours d&apos;essai gratuit — Aucune carte requise
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Nom complet */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nom complet</label>
              <input
                type="text" autoFocus autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => touch("fullName")}
                placeholder="Amadou Diallo"
                style={hasErr("fullName") ? fieldErrStyle : fieldStyle}
              />
              {hasErr("fullName") && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>Ce champ est obligatoire.</p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email professionnel</label>
              <input
                type="email" autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => touch("email")}
                placeholder="vous@exemple.com"
                style={hasErr("email") ? fieldErrStyle : fieldStyle}
              />
              {hasErr("email") && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>Adresse email invalide.</p>
              )}
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Mot de passe{" "}
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>min. 8 caractères</span>
              </label>
              <input
                type="password" autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => touch("password")}
                placeholder="••••••••"
                style={hasErr("password") ? fieldErrStyle : fieldStyle}
              />
              {/* Barre de force minimaliste */}
              {password.length > 0 && (
                <div style={{ display: "flex", gap: 3, marginTop: 6, alignItems: "center" }}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      backgroundColor:
                        password.length >= 12 ? "#16a34a"
                        : password.length >= 8  ? "#f59e0b"
                        : n === 1 ? "#dc2626" : "#e5e7eb",
                    }} />
                  ))}
                  <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4, flexShrink: 0 }}>
                    {password.length < 8 ? "Trop court" : password.length < 12 ? "Correct" : "Fort"}
                  </span>
                </div>
              )}
              {hasErr("password") && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>8 caractères minimum.</p>
              )}
            </div>

            {/* Séparateur */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>Votre restaurant</span>
              <div style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
            </div>

            {/* Nom du restaurant */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nom du restaurant</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                onBlur={() => touch("restaurantName")}
                placeholder="Le Palais du Manding"
                style={hasErr("restaurantName") ? fieldErrStyle : fieldStyle}
              />
              {hasErr("restaurantName") && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>Ce champ est obligatoire.</p>
              )}
            </div>

            {/* WhatsApp */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Numéro WhatsApp du restaurant</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                onBlur={() => touch("whatsapp")}
                placeholder="+22376000000"
                style={hasErr("whatsapp") ? fieldErrStyle : fieldStyle}
              />
              {hasErr("whatsapp") && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>Numéro invalide.</p>
              )}
            </div>

            {error && (
              <div style={{
                marginBottom: 16, padding: "11px 14px", borderRadius: 8,
                backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                fontSize: 13, color: "#dc2626", lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                marginBottom: 16, padding: "11px 14px", borderRadius: 8,
                backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                fontSize: 13, color: "#15803d", lineHeight: 1.6,
              }}>
                {success}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = GH; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = loading ? "#9ca3af" : G; }}
              style={{
                width: "100%", height: 46, borderRadius: 8,
                backgroundColor: loading ? "#9ca3af" : G,
                color: "#fff", border: "none", fontSize: 14,
                fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.15s", fontFamily: "inherit",
              }}
            >
              {loading ? "Création du compte…" : "Créer mon compte gratuitement — 14 jours d'essai"}
            </button>
          </form>
        </div>

        {/* Lien login */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: G, fontWeight: 700, textDecoration: "none" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
