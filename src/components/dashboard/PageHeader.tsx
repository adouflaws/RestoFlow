"use client";

import React from "react";
import { C } from "@/lib/ds";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: C.white,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: C.textPrimary,
            margin: 0,
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: C.textTertiary, margin: 0, marginTop: 1 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </header>
  );
}
