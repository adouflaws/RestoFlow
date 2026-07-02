"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { LoadingScreen } from "@/components/dashboard/LoadingScreen";
import { SH } from "@/lib/ds";
import { Store, Clock, Bot, AlertTriangle, Copy, Mail, Save, CheckCircle2 } from "lucide-react";

interface OpeningHours { [day: string]: string; }

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: "#fff", borderRadius: 14,
      border: "1px solid #e0e6eb",
      boxShadow: SH.md,
      marginBottom: 20, overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid #f4f5f6",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ color: "#6b7c93", display: "flex" }}>{icon}</span>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: "#30313d",
          margin: 0, letterSpacing: "-0.2px",
        }}>
          {title}
        </h3>
      </div>
      <div style={{ padding: "22px 24px" }}>{children}</div>
    </div>
  );
}

export default function ConfigPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [toast,   setToast]     = useState("");
  const [copied,  setCopied]    = useState(false);
  const [form,    setForm]      = useState({
    name: "", address: "", phone: "", description: "",
    opening_hours: {} as OpeningHours,
  });
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase
      .from("restaurants")
      .select("name, address, phone, description, opening_hours")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name:          data.name ?? "",
            address:       data.address ?? "",
            phone:         data.phone ?? "",
            description:   data.description ?? "",
            opening_hours: (data.opening_hours as OpeningHours) ?? {},
          });
        }
        setLoading(false);
      });
  }, [restaurantId, supabase]);

  function setHours(day: string, value: string) {
    setForm({ ...form, opening_hours: { ...form.opening_hours, [day]: value } });
  }

  function toggleDayClosed(day: string) {
    const current = form.opening_hours[day] ?? "";
    const isClosed = current.toLowerCase() === "fermé";
    setHours(day, isClosed ? "08:00 - 22:00" : "Fermé");
  }

  function isDayClosed(day: string) {
    return (form.opening_hours[day] ?? "").toLowerCase() === "fermé";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({
        name:          form.name,
        address:       form.address,
        phone:         form.phone,
        description:   form.description,
        opening_hours: form.opening_hours,
      })
      .eq("id", restaurantId);

    setSaving(false);
    if (error) {
      setToast("Erreur lors de l'enregistrement");
      setTimeout(() => setToast(""), 3000);
    } else {
      setSaved(true);
      setToast("Modifications sauvegardées ✓");
      setTimeout(() => { setSaved(false); setToast(""); }, 2500);
    }
  }

  async function copyPhone() {
    if (!form.phone) return;
    await navigator.clipboard.writeText(form.phone).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    border: "1px solid #e0e6eb", borderRadius: 8,
    fontSize: 13.5, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", color: "#30313d", backgroundColor: "#fff",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#6b7c93", marginBottom: 5,
  };

  if (loading) return <LoadingScreen message="Chargement…" />;

  return (
    <>
      <PageHeader title="Configuration" subtitle="Profil, horaires et paramètres du bot" />

      {/* ── Contenu ───────────────────────────────────────────────── */}
      <div style={{ padding: "28px 32px 100px", maxWidth: 720 }}>
        <form id="config-form" onSubmit={handleSave}>

          {/* ── Profil restaurant ─────────────────────────────────── */}
          <SectionCard title="Profil restaurant" icon={<Store size={17} />}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Nom du restaurant *</label>
                <input
                  type="text" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Téléphone / WhatsApp</label>
                <input
                  type="tel" value={form.phone}
                  placeholder="+223 XX XX XX XX"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Adresse</label>
                <input
                  type="text" value={form.address}
                  placeholder="Hamdallaye ACI 2000, Bamako"
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Description / Message d&apos;accueil</label>
                <textarea
                  value={form.description}
                  rows={3}
                  placeholder="Bienvenue ! Nous préparons votre commande avec amour 🍽️"
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                />
                <p style={{ fontSize: 11.5, color: "#8898aa", margin: "5px 0 0" }}>
                  Ce message est envoyé par le bot lors du premier contact
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── Horaires ──────────────────────────────────────────── */}
          <SectionCard title="Horaires d'ouverture" icon={<Clock size={17} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DAYS.map((day) => {
                const closed = isDayClosed(day);
                return (
                  <div key={day} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid #f6f9fc",
                  }}>
                    <span style={{
                      width: 88, fontSize: 13.5, fontWeight: 600,
                      color: closed ? "#8898aa" : "#30313d", flexShrink: 0,
                    }}>
                      {day}
                    </span>

                    {closed ? (
                      <span style={{
                        flex: 1, fontSize: 13, color: "#8898aa",
                        fontStyle: "italic",
                      }}>
                        Fermé
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={form.opening_hours[day] ?? ""}
                        placeholder="08:00 - 22:00"
                        onChange={(e) => setHours(day, e.target.value)}
                        style={{
                          flex: 1, padding: "7px 12px",
                          border: "1px solid #e0e6eb", borderRadius: 7,
                          fontSize: 13, outline: "none", fontFamily: "inherit", color: "#30313d",
                        }}
                      />
                    )}

                    {/* Toggle Fermé */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11.5, color: closed ? "#8898aa" : "#6b7c93" }}>
                        {closed ? "Fermé" : "Ouvert"}
                      </span>
                      <div
                        onClick={() => toggleDayClosed(day)}
                        style={{
                          width: 40, height: 22, borderRadius: 11,
                          backgroundColor: closed ? "#e0e6eb" : "#22c55e",
                          position: "relative", cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                      >
                        <div style={{
                          position: "absolute",
                          top: 2, left: closed ? 2 : 20,
                          width: 18, height: 18, borderRadius: "50%",
                          backgroundColor: "#fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          transition: "left 0.2s",
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </form>

        {/* ── Bot WhatsApp (lecture seule) ───────────────────────── */}
        <SectionCard title="Bot WhatsApp" icon={<Bot size={17} />}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              flex: 1, padding: "11px 14px",
              border: "1px solid #e0e6eb", borderRadius: 8,
              fontSize: 13.5, color: form.phone ? "#30313d" : "#8898aa",
              backgroundColor: "#f6f9fc",
            }}>
              {form.phone || "Aucun numéro configuré"}
            </div>
            <button
              onClick={copyPhone}
              disabled={!form.phone}
              style={{
                padding: "11px 16px", borderRadius: 8,
                border: "1px solid #e0e6eb", backgroundColor: "#fff",
                fontSize: 13, fontWeight: 600,
                color: form.phone ? "#30313d" : "#8898aa",
                cursor: form.phone ? "pointer" : "not-allowed",
                fontFamily: "inherit", flexShrink: 0,
              }}
            >
              {copied ? <><CheckCircle2 size={14} /> Copié !</> : <><Copy size={14} /> Copier</>}
            </button>
          </div>
          <div style={{
            backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 8, padding: "12px 16px",
          }}>
            <p style={{ fontSize: 12.5, color: "#15803d", margin: 0, lineHeight: 1.6 }}>
              <strong>Comment ça fonctionne :</strong> vos clients envoient un message à ce numéro WhatsApp,
              le bot prend automatiquement leur commande et vous l&apos;affiche dans le tableau de bord.
              Pour modifier le numéro, mettez à jour le champ Téléphone dans la section Profil ci-dessus.
            </p>
          </div>
        </SectionCard>

        {/* ── Danger zone ───────────────────────────────────────── */}
        <div style={{
          backgroundColor: "#fff", borderRadius: 14,
          border: "1px solid #fecaca",
          boxShadow: SH.md,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 24px", borderBottom: "1px solid #fef2f2",
            display: "flex", alignItems: "center", gap: 10,
            backgroundColor: "#fff5f5",
          }}>
            <AlertTriangle size={17} style={{ color: "#dc2626", flexShrink: 0 }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#dc2626", margin: 0 }}>
              Zone de danger
            </h3>
          </div>
          <div style={{ padding: "22px 24px" }}>
            <p style={{ fontSize: 13.5, color: "#6b7c93", margin: "0 0 16px", lineHeight: 1.6 }}>
              Pour supprimer votre compte ou réinitialiser vos données, contactez notre support.
              Ces actions sont irréversibles et nécessitent une confirmation manuelle.
            </p>
            <a
              href="mailto:adouflaws@gmail.com?subject=Demande suppression compte"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                backgroundColor: "#fef2f2", color: "#dc2626",
                border: "1px solid #fecaca", borderRadius: 8,
                padding: "9px 18px", fontSize: 13, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Mail size={14} /> Contacter le support
            </a>
          </div>
        </div>
      </div>

      {/* ── Bouton Sauvegarder fixe ────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 24, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
      }}>
        <button
          form="config-form"
          type="submit"
          disabled={saving}
          onMouseEnter={(e) => { if (!saving) e.currentTarget.style.backgroundColor = "#16a34a"; }}
          onMouseLeave={(e) => { if (!saving) e.currentTarget.style.backgroundColor = saved ? "#15803d" : "#1a4d2e"; }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            backgroundColor: saved ? "#15803d" : "#1a4d2e",
            color: "#fff", border: "none", borderRadius: 10,
            padding: "12px 32px", fontSize: 14, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            boxShadow: "0 4px 16px rgba(26,77,46,0.4)",
            transition: "background-color 0.15s",
            fontFamily: "inherit",
          }}
        >
          {saved ? <><CheckCircle2 size={15} /> Sauvegardé !</> : saving ? "Enregistrement…" : <><Save size={15} /> Sauvegarder</>}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 80, right: 32,
          backgroundColor: "#30313d", color: "#fff",
          padding: "12px 20px", borderRadius: 10,
          fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 999,
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
