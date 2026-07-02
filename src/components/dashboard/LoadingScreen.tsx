"use client";

import React from "react";
import { C } from "@/lib/ds";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Chargement…" }: LoadingScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <div style={{ textAlign: "center", color: C.textTertiary }}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          style={{ marginBottom: 12, animation: "rfSpin 0.8s linear infinite" }}
        >
          <style>{`@keyframes rfSpin { to { transform: rotate(360deg); } }`}</style>
          <circle
            cx="16" cy="16" r="13"
            stroke="#e0e6eb" strokeWidth="3"
          />
          <path
            d="M16 3 A13 13 0 0 1 29 16"
            stroke="#1a4d2e" strokeWidth="3" strokeLinecap="round"
          />
        </svg>
        <p style={{ fontSize: 14, margin: 0, color: C.textTertiary }}>{message}</p>
      </div>
    </div>
  );
}
