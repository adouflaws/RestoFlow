"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, MessageCircle } from "lucide-react";
import { SH } from "@/lib/ds";

export default function SuspenduPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;

  const WA_LINK =
    "https://wa.me/22376753087?text=Bonjour%20RestoFlow%2C%20je%20souhaite%20r%C3%A9activer%20mon%20abonnement%20pour%20mon%20restaurant.";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f6f9fc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    }}>
      <div style={{
        maxWidth: 480,
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 16,
        border: "1px solid #e0e6eb",
        boxShadow: SH.lg,
        padding: "48px 40px",
        textAlign: "center" as const,
      }}>
        {/* Icône */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          backgroundColor: "#fef2f2",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <AlertCircle size={36} style={{ color: "#dc2626" }} />
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: "#30313d",
          margin: "0 0 12px", letterSpacing: "-0.4px",
        }}>
          Abonnement suspendu
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 14.5, color: "#6b7c93",
          lineHeight: 1.6, margin: "0 0 8px",
        }}>
          Votre période d&apos;essai RestoFlow a expiré.
        </p>
        <p style={{
          fontSize: 14.5, color: "#6b7c93",
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
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
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
          <MessageCircle size={16} />
          Contacter RestoFlow sur WhatsApp
        </a>

        {/* Lien retour */}
        <Link
          href={`/${restaurantId}/commandes`}
          style={{
            display: "block",
            fontSize: 13, color: "#8898aa",
            textDecoration: "none", marginTop: 16,
          }}
        >
          ← Retour au tableau de bord
        </Link>

        {/* Divider + info */}
        <div style={{
          marginTop: 32, paddingTop: 24,
          borderTop: "1px solid #e0e6eb",
        }}>
          <p style={{ fontSize: 12, color: "#8898aa", margin: 0 }}>
            wa.me/22376753087 · RestoFlow
          </p>
        </div>
      </div>
    </div>
  );
}
