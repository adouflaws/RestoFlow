"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh">
      {/* ---- Panneau gauche : branding ---- */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between bg-[#1a4d2e] p-12 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
            <span className="text-[15px] font-bold text-white">RF</span>
          </div>
          <span className="text-[19px] font-semibold tracking-tight text-white">
            RestoFlow
          </span>
        </div>

        <div className="relative z-10">
          <h2 className="mb-4 text-[32px] font-semibold leading-[1.2] text-white xl:text-[38px]">
            Gérez votre
            <br />
            restaurant,
            <br />
            simplement.
          </h2>
          <p className="max-w-[340px] text-[15px] leading-relaxed text-white/50">
            Commandes, menus, livraisons et paiements — tout ce dont vous avez
            besoin dans une seule plateforme.
          </p>
        </div>

        <p className="relative z-10 text-[12px] text-white/25">
          &copy; {new Date().getFullYear()} RestoFlow
        </p>
      </div>

      {/* ---- Panneau droit : formulaire ---- */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-[380px]">
          {/* Logo mobile */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a4d2e]">
              <span className="text-[13px] font-bold text-white">RF</span>
            </div>
            <span className="text-[18px] font-semibold tracking-tight text-gray-900">
              RestoFlow
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-[24px] font-semibold text-gray-900">
              Connexion
            </h1>
            <p className="mt-1.5 text-[14px] text-gray-500">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-medium text-gray-700"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                placeholder="vous@exemple.com"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#1a4d2e] focus:ring-2 focus:ring-[#1a4d2e]/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[13px] font-medium text-gray-700"
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  className="text-[12px] font-medium text-[#1a4d2e] hover:text-[#246b3e] transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-[#1a4d2e] focus:ring-2 focus:ring-[#1a4d2e]/20"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1a4d2e] text-[14px] font-medium text-white transition-all hover:bg-[#246b3e] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
