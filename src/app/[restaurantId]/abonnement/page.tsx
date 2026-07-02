"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, X as XIcon, ArrowLeft, CreditCard, AlertCircle, Loader } from "lucide-react";
import { SH } from "@/lib/ds";

const G   = "#1a4d2e";
const GL  = "#16a34a";
const TX  = "#30313d";
const TX2 = "#6b7c93";
const BRD = "#e0e6eb";
const SRF = "#f6f9fc";

interface PlanConfig {
  key: string;
  name: string;
  price: string;
  amount: number;
  desc: string;
  popular: boolean;
  features: string[];
  missing: string[];
}

const PLANS: PlanConfig[] = [
  {
    key: "starter",
    name: "Starter",
    price: "25 000",
    amount: 25_000,
    desc: "Petits restaurants et maquis",
    popular: false,
    features: [
      "Bot WhatsApp IA 24h/24",
      "Jusqu'à 200 commandes/mois",
      "Menu jusqu'à 20 plats",
      "1 zone de livraison",
      "Dashboard commandes",
    ],
    missing: ["Historique conversations", "Support prioritaire"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "45 000",
    amount: 45_000,
    desc: "Restaurants avec livraison active",
    popular: true,
    features: [
      "Commandes illimitées",
      "Menu illimité",
      "Zones de livraison illimitées",
      "Historique conversations",
      "FAQ configurable",
      "Notifications sonores cuisine",
      "Support prioritaire WhatsApp",
    ],
    missing: [],
  },
  {
    key: "business",
    name: "Business",
    price: "75 000",
    amount: 75_000,
    desc: "Chaînes et groupes de restaurants",
    popular: false,
    features: [
      "Jusqu'à 5 établissements",
      "Rapport mensuel automatique",
      "Support dédié direct",
      "Intégration personnalisée",
      "Formation de votre équipe",
    ],
    missing: [],
  },
];

export default function AbonnementPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const restaurantId = params.restaurantId as string;

  const [loading, setLoading]       = useState<string | null>(null);
  const [error,   setError]         = useState<string | null>(null);
  const success    = searchParams.get("success") === "true";
  const cancelled  = searchParams.get("cancelled") === "true";
  const successPlan = searchParams.get("plan");

  async function handlePay(planKey: string) {
    setLoading(planKey);
    setError(null);
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId, plan: planKey }),
      });

      const data = await res.json() as { payment_url?: string; error?: string };

      if (!res.ok || !data.payment_url) {
        setError(data.error ?? "Une erreur est survenue. Réessayez.");
        setLoading(null);
        return;
      }

      window.location.href = data.payment_url;
    } catch {
      setError("Impossible de contacter le service de paiement. Réessayez.");
      setLoading(null);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: SRF,
      padding: "40px 24px 80px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Retour */}
        <Link
          href={`/${restaurantId}/commandes`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: TX2, textDecoration: "none",
            marginBottom: 32,
          }}
        >
          <ArrowLeft size={14} /> Retour au tableau de bord
        </Link>

        {/* Succès */}
        {success && (
          <div style={{
            backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0",
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 32,
          }}>
            <CheckCircle2 size={20} style={{ color: GL, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: G }}>
                Paiement confirmé !
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#15803d" }}>
                Votre abonnement {successPlan ? `Plan ${successPlan.charAt(0).toUpperCase() + successPlan.slice(1)}` : ""} est maintenant actif. Le bot est opérationnel.
              </p>
            </div>
          </div>
        )}

        {/* Annulation */}
        {cancelled && (
          <div style={{
            backgroundColor: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 32,
          }}>
            <AlertCircle size={20} style={{ color: "#b45309", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, color: "#92400e" }}>
              Paiement annulé. Vous pouvez réessayer quand vous voulez.
            </p>
          </div>
        )}

        {/* Erreur API */}
        {error && (
          <div style={{
            backgroundColor: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 12, padding: "16px 20px",
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 32,
          }}>
            <AlertCircle size={20} style={{ color: "#dc2626", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, color: "#dc2626" }}>{error}</p>
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            fontWeight: 800, color: TX, margin: "0 0 12px",
            letterSpacing: "-0.6px", lineHeight: 1.2,
          }}>
            Choisissez votre abonnement
          </h1>
          <p style={{ fontSize: 16, color: TX2, margin: 0, lineHeight: 1.65 }}>
            Paiement sécurisé via Orange Money ou Wave — Activation immédiate
          </p>
        </div>

        {/* Grille plans */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
          className="rf-plans-grid"
        >
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              style={{
                borderRadius: 16,
                padding: "32px 28px",
                border: plan.popular ? `2px solid ${G}` : `1px solid ${BRD}`,
                backgroundColor: plan.popular ? G : "#fff",
                position: "relative",
                display: "flex", flexDirection: "column",
                boxShadow: plan.popular ? "0 20px 48px rgba(26,77,46,.18)" : SH.sm,
              }}
            >
              {plan.popular && (
                <div style={{
                  position: "absolute", top: -13, left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: GL, color: "#fff",
                  fontSize: 11, fontWeight: 700, padding: "4px 16px",
                  borderRadius: 20, whiteSpace: "nowrap",
                }}>
                  Le plus populaire
                </div>
              )}

              <h2 style={{
                fontSize: 19, fontWeight: 800,
                color: plan.popular ? "#fff" : TX,
                margin: "0 0 4px", letterSpacing: "-0.3px",
              }}>
                {plan.name}
              </h2>
              <p style={{
                fontSize: 12,
                color: plan.popular ? "rgba(255,255,255,.5)" : TX2,
                margin: "0 0 20px",
              }}>
                {plan.desc}
              </p>

              <div style={{ marginBottom: 24 }}>
                <span style={{
                  fontSize: 38, fontWeight: 900,
                  color: plan.popular ? "#fff" : G,
                  letterSpacing: "-1.5px",
                }}>
                  {plan.price}
                </span>
                <span style={{
                  fontSize: 13, marginLeft: 5,
                  color: plan.popular ? "rgba(255,255,255,.5)" : TX2,
                }}>
                  FCFA / mois
                </span>
              </div>

              {/* Features */}
              <ul style={{
                listStyle: "none", padding: 0,
                margin: "0 0 28px", flex: 1,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                {plan.features.map((f) => (
                  <li key={f} style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    fontSize: 13.5,
                    color: plan.popular ? "rgba(255,255,255,.85)" : TX2,
                  }}>
                    <CheckCircle2
                      size={15}
                      style={{ color: plan.popular ? "#86efac" : GL, flexShrink: 0, marginTop: 2 }}
                    />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    fontSize: 13.5, color: "rgba(150,150,150,.4)",
                  }}>
                    <XIcon size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Bouton paiement */}
              <button
                onClick={() => handlePay(plan.key)}
                disabled={loading !== null}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%",
                  padding: "13px 0",
                  backgroundColor: plan.popular ? "#fff" : G,
                  color: plan.popular ? G : "#fff",
                  border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 700,
                  cursor: loading !== null ? "not-allowed" : "pointer",
                  opacity: loading !== null && loading !== plan.key ? 0.5 : 1,
                  transition: "opacity .15s",
                  fontFamily: "inherit",
                }}
              >
                {loading === plan.key ? (
                  <>
                    <Loader size={14} style={{ animation: "spin .8s linear infinite" }} />
                    Redirection…
                  </>
                ) : (
                  <>
                    <CreditCard size={14} />
                    Payer avec Orange Money / Wave
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Note bas de page */}
        <p style={{
          textAlign: "center", marginTop: 32,
          fontSize: 13, color: TX2,
        }}>
          Paiement sécurisé via Geniuspay — Orange Money & Wave acceptés — Activation immédiate après paiement
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .rf-plans-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
