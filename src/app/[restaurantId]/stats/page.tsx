"use client";

export default function StatsPage() {
  return (
    <>
      <header style={{
        height: 64, backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", padding: "0 32px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Statistiques
          </h1>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, marginTop: 1 }}>
            Analyse de vos performances
          </p>
        </div>
      </header>

      <div style={{
        padding: "80px 32px", textAlign: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
          Statistiques avancées
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
          CA hebdomadaire, plats les plus commandés, pics d&apos;activité — cette section arrive dans la prochaine mise à jour.
        </p>
      </div>
    </>
  );
}
