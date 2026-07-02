"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { Lightbulb, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlanBanner } from "@/components/dashboard/PlanBanner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SH } from "@/lib/ds";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FaqItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Suggestions prédéfinies ──────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    q: "Acceptez-vous les cartes bancaires ?",
    a: "Oui, nous acceptons Wave, Orange Money et les paiements en espèces.",
    k: "carte, CB, paiement, wave, orange money",
  },
  {
    q: "Livrez-vous le dimanche ?",
    a: "Oui, nous livrons tous les jours de la semaine, y compris le dimanche.",
    k: "dimanche, livraison, week-end, samedi",
  },
  {
    q: "Quel est le délai de livraison ?",
    a: "Le délai moyen est de 30 à 45 minutes selon votre quartier.",
    k: "délai, temps, combien de temps, livraison, attente",
  },
];


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FaqPage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;

  const [faqs,    setFaqs]    = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan,    setPlan]    = useState<string | null>(null);
  const [formQ,   setFormQ]   = useState("");
  const [formA,   setFormA]   = useState("");
  const [formK,   setFormK]   = useState("");
  const [adding,  setAdding]  = useState(false);
  const [toast,   setToast]   = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("restaurants")
      .select("plan")
      .eq("id", restaurantId)
      .single()
      .then(({ data }) => setPlan((data as { plan?: string } | null)?.plan ?? "starter"));
  }, [restaurantId]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("faq_items")
      .select("id, question, answer, keywords, is_published, sort_order, created_at")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .order("created_at",  { ascending: true });

    if (data) setFaqs(data as FaqItem[]);
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!formQ.trim() || !formA.trim()) return;
    setAdding(true);

    const keywords = formK
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const supabase = createClient();
    const { error } = await supabase.from("faq_items").insert({
      restaurant_id: restaurantId,
      question:      formQ.trim(),
      answer:        formA.trim(),
      keywords,
      is_published:  true,
      sort_order:    faqs.length,
    });

    if (error) {
      showToast("Erreur lors de l'ajout");
    } else {
      setFormQ(""); setFormA(""); setFormK("");
      showToast("FAQ ajoutée ✓");
      await load();
    }
    setAdding(false);
  }

  async function togglePublished(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("faq_items").update({ is_published: !current }).eq("id", id);
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_published: !current } : f))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette FAQ ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("faq_items").delete().eq("id", id);
    if (!error) {
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      showToast("FAQ supprimée");
    }
  }

  function fillSuggestion(s: (typeof SUGGESTIONS)[0]) {
    setFormQ(s.q);
    setFormA(s.a);
    setFormK(s.k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (plan === "starter") {
    return (
      <PlanBanner
        feature="FAQ configurable"
        description="Disponible à partir du plan Pro. Passez au Pro pour créer des réponses automatiques personnalisées pour votre bot."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Questions fréquentes"
        subtitle={`Réponses automatiques du bot · ${faqs.length} FAQ${faqs.length > 1 ? "s" : ""}`}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 300,
          backgroundColor: "#1a4d2e", color: "#fff",
          padding: "11px 18px", borderRadius: 8,
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        }}>
          {toast}
        </div>
      )}

    <div style={{ padding: "28px 32px" }}>

      {/* ── Formulaire d'ajout ───────────────────────────────────────── */}
      <div style={{
        backgroundColor: "#fff",
        border: "1px solid #e0e6eb",
        borderRadius: 12,
        boxShadow: SH.md,
        padding: "24px",
        marginBottom: 28,
      }}>
        <h2 style={{
          fontSize: 14, fontWeight: 700, color: "#30313d",
          margin: "0 0 18px",
        }}>
          + Ajouter une FAQ
        </h2>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
          {/* Question */}
          <div>
            <label style={{
              fontSize: 12.5, fontWeight: 600, color: "#6b7c93",
              display: "block", marginBottom: 5,
            }}>
              Question
            </label>
            <input
              type="text"
              value={formQ}
              onChange={(e) => setFormQ(e.target.value)}
              placeholder="Ex : Acceptez-vous les cartes bancaires ?"
              style={{
                width: "100%", padding: "9px 12px",
                fontSize: 13.5, border: "1px solid #e0e6eb",
                borderRadius: 8, outline: "none",
                fontFamily: "inherit", color: "#30313d",
                boxSizing: "border-box" as const,
              }}
            />
          </div>

          {/* Réponse */}
          <div>
            <label style={{
              fontSize: 12.5, fontWeight: 600, color: "#6b7c93",
              display: "block", marginBottom: 5,
            }}>
              Réponse
            </label>
            <textarea
              value={formA}
              onChange={(e) => setFormA(e.target.value)}
              placeholder="Ex : Oui, nous acceptons Wave, Orange Money et les espèces."
              rows={3}
              style={{
                width: "100%", padding: "9px 12px",
                fontSize: 13.5, border: "1px solid #e0e6eb",
                borderRadius: 8, outline: "none", resize: "vertical" as const,
                fontFamily: "inherit", color: "#30313d",
                boxSizing: "border-box" as const, lineHeight: 1.5,
              }}
            />
          </div>

          {/* Mots-clés */}
          <div>
            <label style={{
              fontSize: 12.5, fontWeight: 600, color: "#6b7c93",
              display: "block", marginBottom: 5,
            }}>
              Mots-clés{" "}
              <span style={{ fontWeight: 400, color: "#8898aa" }}>
                (séparés par virgule)
              </span>
            </label>
            <input
              type="text"
              value={formK}
              onChange={(e) => setFormK(e.target.value)}
              placeholder="Ex : carte, CB, paiement, mobile money"
              style={{
                width: "100%", padding: "9px 12px",
                fontSize: 13.5, border: "1px solid #e0e6eb",
                borderRadius: 8, outline: "none",
                fontFamily: "inherit", color: "#30313d",
                boxSizing: "border-box" as const,
              }}
            />
            <p style={{ fontSize: 11.5, color: "#8898aa", margin: "5px 0 0" }}>
              Si un message client contient l&apos;un de ces mots, le bot répond directement sans appeler l&apos;IA
            </p>
          </div>

          {/* Bouton */}
          <div>
            <button
              onClick={handleAdd}
              disabled={adding || !formQ.trim() || !formA.trim()}
              style={{
                padding: "9px 22px",
                backgroundColor:
                  adding || !formQ.trim() || !formA.trim() ? "#e0e6eb" : "#1a4d2e",
                color:
                  adding || !formQ.trim() || !formA.trim() ? "#8898aa" : "#fff",
                border: "none", borderRadius: 8,
                fontSize: 13.5, fontWeight: 700,
                cursor:
                  adding || !formQ.trim() || !formA.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "background-color 0.12s",
              }}
            >
              {adding ? "Ajout en cours…" : "+ Ajouter cette FAQ"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Liste des FAQ ────────────────────────────────────────────── */}
      {loading ? (
        <div style={{
          textAlign: "center" as const, padding: "60px 0",
          color: "#8898aa", fontSize: 14,
        }}>
          Chargement…
        </div>
      ) : faqs.length === 0 ? (
        /* ── État vide + suggestions ── */
        <div>
          <div style={{
            textAlign: "center" as const, padding: "48px 24px",
            backgroundColor: "#fff", borderRadius: 12,
            border: "1px solid #e0e6eb", marginBottom: 20,
          }}>
            <Lightbulb size={38} style={{ color: "#8898aa", marginBottom: 12 }} />
            <p style={{
              fontSize: 15, fontWeight: 600, color: "#30313d",
              margin: "0 0 6px",
            }}>
              Aucune FAQ configurée
            </p>
            <p style={{ fontSize: 13, color: "#8898aa", margin: 0 }}>
              Ajoutez votre première FAQ ou utilisez une suggestion ci-dessous
            </p>
          </div>

          <p style={{
            fontSize: 12.5, fontWeight: 600, color: "#6b7c93",
            margin: "0 0 10px",
          }}>
            Suggestions — cliquez pour pré-remplir le formulaire :
          </p>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {SUGGESTIONS.map((s, i) => (
              <div
                key={i}
                onClick={() => fillSuggestion(s)}
                style={{
                  padding: "14px 18px",
                  backgroundColor: "#fff",
                  border: "1px solid #e0e6eb",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "border-color 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#16a34a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "#e0e6eb")
                }
              >
                <p style={{
                  margin: "0 0 4px", fontSize: 13.5,
                  fontWeight: 600, color: "#30313d",
                }}>
                  {s.q}
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: "#8898aa" }}>
                  {s.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Liste des FAQs ── */
        <div>
          <p style={{
            fontSize: 12.5, color: "#6b7c93", fontWeight: 600,
            margin: "0 0 10px",
          }}>
            {faqs.length} FAQ{faqs.length > 1 ? "s" : ""} configurée{faqs.length > 1 ? "s" : ""}
            {" "}· {faqs.filter((f) => f.is_published).length} active{faqs.filter((f) => f.is_published).length > 1 ? "s" : ""}
          </p>

          <div style={{
            backgroundColor: "#fff",
            border: "1px solid #e0e6eb",
            borderRadius: 12,
            boxShadow: SH.md,
            overflow: "hidden",
          }}>
            {faqs.map((faq, i) => (
              <div
                key={faq.id}
                style={{
                  padding: "18px 20px",
                  borderBottom: i < faqs.length - 1 ? "1px solid #f4f5f6" : "none",
                  opacity: faq.is_published ? 1 : 0.5,
                  transition: "opacity 0.2s",
                }}
              >
                <div style={{
                  display: "flex", alignItems: "flex-start",
                  justifyContent: "space-between", gap: 16,
                }}>
                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: "0 0 5px", fontSize: 14,
                      fontWeight: 700, color: "#30313d",
                    }}>
                      {faq.question}
                    </p>
                    <p style={{
                      margin: "0 0 10px", fontSize: 13,
                      color: "#6b7c93", lineHeight: 1.55,
                    }}>
                      {faq.answer}
                    </p>

                    {/* Mots-clés */}
                    {faq.keywords?.length > 0 ? (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const }}>
                        {faq.keywords.map((kw, j) => (
                          <span key={j} style={{
                            fontSize: 11, fontWeight: 600,
                            padding: "2px 8px", borderRadius: 10,
                            backgroundColor: "#f0fdf4", color: "#16a34a",
                            border: "1px solid #bbf7d0",
                          }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#8898aa" }}>
                        Aucun mot-clé — réponse via IA uniquement
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: 8, flexShrink: 0,
                  }}>
                    {/* Toggle actif / inactif */}
                    <button
                      onClick={() => togglePublished(faq.id, faq.is_published)}
                      title={faq.is_published ? "Désactiver" : "Activer"}
                      style={{
                        padding: "5px 12px", borderRadius: 20,
                        border: "1px solid",
                        fontSize: 11.5, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "all 0.12s",
                        backgroundColor: faq.is_published ? "#f0fdf4" : "#f4f5f6",
                        borderColor:     faq.is_published ? "#bbf7d0" : "#e0e6eb",
                        color:           faq.is_published ? "#16a34a" : "#8898aa",
                      }}
                    >
                      {faq.is_published ? "● Actif" : "○ Inactif"}
                    </button>

                    {/* Supprimer */}
                    <button
                      onClick={() => handleDelete(faq.id)}
                      title="Supprimer"
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: "1px solid #fee2e2",
                        backgroundColor: "#fef2f2",
                        color: "#dc2626", fontSize: 14,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "inherit",
                        transition: "background-color 0.12s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fecaca")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fef2f2")
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestions affichées même quand des FAQs existent */}
          {faqs.length < 3 && (
            <div style={{ marginTop: 20 }}>
              <p style={{
                fontSize: 12.5, fontWeight: 600, color: "#6b7c93",
                margin: "0 0 10px",
              }}>
                Suggestions supplémentaires :
              </p>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                {SUGGESTIONS.filter(
                  (s) => !faqs.some((f) => f.question === s.q)
                ).map((s, i) => (
                  <div
                    key={i}
                    onClick={() => fillSuggestion(s)}
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "#fff",
                      border: "1px solid #e0e6eb",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      transition: "border-color 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "#16a34a")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "#e0e6eb")
                    }
                  >
                    <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                      +
                    </span>
                    <span style={{ fontSize: 13, color: "#30313d", fontWeight: 500 }}>
                      {s.q}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
