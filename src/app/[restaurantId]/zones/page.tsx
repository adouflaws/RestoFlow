"use client";

export default function ZonesPage() {
  return (
    <>
      <header style={{
        height: 64, backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", padding: "0 32px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Zones de livraison
          </h1>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, marginTop: 1 }}>
            Gérez vos quartiers et frais de livraison
          </p>
        </div>
      </header>

      <div style={{
        padding: "80px 32px", textAlign: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🗺️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
          Zones de livraison
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
          Les zones configurées lors de l&apos;onboarding sont déjà actives. La gestion avancée des zones arrive bientôt.
        </p>
      </div>
    </>
  );
}
