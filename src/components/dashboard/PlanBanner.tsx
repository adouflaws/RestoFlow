"use client";

import React from "react";
import { C, WA_UPGRADE } from "@/lib/ds";

interface PlanBannerProps {
  feature: string;
  description?: string;
}

export function PlanBanner({
  feature,
  description = "Cette fonctionnalité est disponible à partir du plan Pro. Passez au Pro pour débloquer toutes les fonctionnalités de votre restaurant.",
}: PlanBannerProps) {
  return (
    <div style={{ padding: "32px 32px" }}>
      <div
        style={{
          backgroundColor: C.white,
          border: `1.5px solid ${C.border}`,
          borderRadius: 16,
          padding: "48px 32px",
          textAlign: "center" as const,
          maxWidth: 480,
          margin: "60px auto 0",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.textPrimary, margin: "0 0 10px" }}>
          {feature}
        </h2>
        <p style={{ fontSize: 14, color: C.textSecondary, margin: "0 0 24px", lineHeight: 1.6 }}>
          {description}
        </p>
        <a
          href={WA_UPGRADE}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: C.brand,
            color: C.white,
            padding: "11px 24px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          💬 Passer au Pro →
        </a>
      </div>
    </div>
  );
}
