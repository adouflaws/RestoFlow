"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { SH } from "@/lib/ds";

const G  = "#1a4d2e";
const GH = "#246b3e";
const TX  = "#30313d";
const TX2 = "#6b7c93";
const BRD = "#e0e6eb";
const SRF = "#f6f9fc";

const field: React.CSSProperties = {
  height: 44, width: "100%", borderRadius: 8,
  border: `1px solid ${BRD}`, padding: "0 14px",
  fontSize: 14, color: TX, outline: "none",
  backgroundColor: "#fff", boxSizing: "border-box",
  fontFamily: "inherit",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) { setError("Saisissez votre email avant de réinitialiser."); return; }
    setError("");
    setResetLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://resto-flow-gold-ten.vercel.app/auth/callback",
    });
    setResetLoading(false);
    if (err) { setError(err.message); return; }
    setResetSent(true);
  }

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: SRF, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, backgroundColor: G,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 14,
            letterSpacing: "-0.5px",
          }}>
            RF
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TX, letterSpacing: "-0.5px" }}>
            RestoFlow
          </div>
        </div>

        {/* Carte */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 14,
          border: `1px solid ${BRD}`, padding: "36px 32px",
          boxShadow: SH.md,
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: TX, marginBottom: 6, letterSpacing: "-0.3px" }}>
            Connexion
          </h1>
          <p style={{ fontSize: 13, color: TX2, marginBottom: 28, lineHeight: 1.5 }}>
            Accédez à votre espace restaurant.
          </p>

          <form onSubmit={handleLogin} noValidate>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX2, marginBottom: 5 }}>
                Email
              </label>
              <input
                type="email" required autoFocus autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                style={field}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: TX2 }}>
                  Mot de passe
                </label>
                <button
                  type="button" onClick={handleForgotPassword} disabled={resetLoading}
                  style={{
                    background: "none", border: "none", fontSize: 12,
                    color: G, fontWeight: 600, cursor: "pointer", padding: 0,
                    opacity: resetLoading ? 0.5 : 1,
                  }}
                >
                  {resetLoading ? "Envoi…" : "Mot de passe oublié ?"}
                </button>
              </div>
              <input
                type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={field}
              />
            </div>

            {resetSent && (
              <div style={{
                marginBottom: 16, padding: "11px 14px", borderRadius: 8,
                backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
                fontSize: 13, color: "#15803d",
              }}>
                ✓ Email de réinitialisation envoyé.
              </div>
            )}

            {error && (
              <div style={{
                marginBottom: 16, padding: "11px 14px", borderRadius: 8,
                backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                fontSize: 13, color: "#dc2626",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = GH; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = loading ? "#9ca3af" : G; }}
              style={{
                width: "100%", height: 44, borderRadius: 8,
                backgroundColor: loading ? "#9ca3af" : G,
                color: "#fff", border: "none", fontSize: 14,
                fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.15s", fontFamily: "inherit",
              }}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Lien signup */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: TX2 }}>
          Pas encore de compte ?{" "}
          <Link
            href="/signup"
            style={{ color: G, fontWeight: 700, textDecoration: "none" }}
          >
            Commencer gratuitement →
          </Link>
        </p>
      </div>
    </div>
  );
}
