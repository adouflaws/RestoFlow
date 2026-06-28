"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function SuspenduPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;

  const WA_LINK =
    "https://wa.me/22376753087?text=Bonjour%20RestoFlow%2C%20je%20souhaite%20r%C3%A9activer%20mon%20abonnement%20pour%20mon%20restaurant.";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        padding: "48px 40px",
        textAlign: "center" as const,
      }}>
        {/* Icône */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          backgroundColor: "#fef2f2",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 36,
        }}>
          🚫
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "#0f172a",
          margin: "0 0 12px", letterSpacing: "-0.4px",
        }}>
          Abonnement suspendu
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 14.5, color: "#64748b",
          lineHeight: 1.6, margin: "0 0 8px",
        }}>
          Votre période d&apos;essai RestoFlow a expiré.
        </p>
        <p style={{
          fontSize: 14.5, color: "#64748b",
          lineHeight: 1.6, margin: "0 0 32px",
        }}>
          Votre bot WhatsApp est <strong style={{ color: "#dc2626" }}>suspendu</strong> et
          ne répond plus à vos clients. Contactez-nous pour réactiver votre service.
        </p>

        {/* Bouton principal */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            backgroundColor: "#1a4d2e",
            color: "#fff",
            borderRadius: 10,
            padding: "14px 24px",
            fontSize: 14, fontWeight: 700,
            textDecoration: "none",
            marginBottom: 12,
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a4d2e")}
        >
          💬 Contacter RestoFlow sur WhatsApp
        </a>

        {/* Lien retour */}
        <Link
          href={`/${restaurantId}/commandes`}
          style={{
            display: "block",
            fontSize: 13, color: "#94a3b8",
            textDecoration: "none", marginTop: 16,
          }}
        >
          ← Retour au tableau de bord
        </Link>

        {/* Divider + info */}
        <div style={{
          marginTop: 32, paddingTop: 24,
          borderTop: "1px solid #f1f5f9",
        }}>
          <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>
            wa.me/22376753087 · RestoFlow
          </p>
        </div>
      </div>
    </div>
  );
}
