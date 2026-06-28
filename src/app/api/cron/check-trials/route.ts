import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/cron/check-trials
// Appelé quotidiennement par Vercel Cron (voir vercel.json)
// Protégé par CRON_SECRET dans les headers

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Charger tous les restaurants en trial
  const { data: restaurants, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, created_at")
    .eq("statut_abonnement", "trial");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!restaurants?.length) {
    return NextResponse.json({ ok: true, checked: 0, notified: 0, expired: 0 });
  }

  const now = Date.now();
  let notified = 0;
  let expired = 0;

  for (const resto of restaurants) {
    const expiry = new Date(resto.created_at as string);
    expiry.setDate(expiry.getDate() + 14);
    const daysLeft = Math.ceil((expiry.getTime() - now) / 86_400_000);

    // Marquer comme suspendu si déjà expiré
    if (daysLeft <= 0) {
      await supabaseAdmin
        .from("restaurants")
        .update({ statut_abonnement: "suspendu" })
        .eq("id", resto.id);
      expired++;
      continue;
    }

    // Envoyer un email uniquement si expiration dans exactement 1, 2 ou 3 jours
    if (daysLeft <= 3) {
      const emails = await getOwnerEmails(resto.id as string);
      for (const email of emails) {
        await sendTrialWarningEmail(email, resto.name as string, daysLeft);
        notified++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    checked: restaurants.length,
    notified,
    expired,
  });
}

async function getOwnerEmails(restaurantId: string): Promise<string[]> {
  const { data: members } = await supabaseAdmin
    .from("restaurant_users")
    .select("user_id")
    .eq("restaurant_id", restaurantId)
    .in("role", ["owner", "manager"]);

  if (!members?.length) return [];

  const emails: string[] = [];
  for (const member of members) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(
      member.user_id as string
    );
    const email = data.user?.email;
    if (email) emails.push(email);
  }
  return emails;
}

async function sendTrialWarningEmail(
  to: string,
  restaurantName: string,
  daysLeft: number
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[cron/check-trials] Aucune RESEND_API_KEY — email simulé → ${to} (${restaurantName}, ${daysLeft}j restants)`
    );
    return;
  }

  const plural = daysLeft > 1 ? "s" : "";
  const subject = `⏳ Votre essai RestoFlow expire dans ${daysLeft} jour${plural}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="margin-bottom:24px;">
        <span style="background:#1a4d2e;color:#fff;font-size:13px;font-weight:700;padding:4px 10px;border-radius:4px;letter-spacing:.04em;">
          RESTOFLOW
        </span>
      </div>
      <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;font-weight:800;">
        Votre période d&apos;essai expire bientôt
      </h2>
      <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.6;">
        Bonjour,
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.6;">
        Votre période d&apos;essai RestoFlow pour <strong>${restaurantName}</strong> expire dans
        <strong>${daysLeft} jour${plural}</strong>.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#334155;line-height:1.6;">
        Pour continuer à recevoir vos commandes via WhatsApp sans interruption, contactez-nous dès maintenant.
      </p>
      <a
        href="mailto:adouflaws@gmail.com?subject=${encodeURIComponent(`Renouvellement abonnement — ${restaurantName}`)}"
        style="display:inline-block;background:#1a4d2e;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;"
      >
        Contacter RestoFlow →
      </a>
      <p style="margin:32px 0 0;font-size:12px;color:#94a3b8;">
        RestoFlow — Gestion de commandes WhatsApp pour restaurants
      </p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "RestoFlow <noreply@restoflow.co>",
      to: [to],
      subject,
      html,
    }),
  }).catch((err) => console.error("[cron/check-trials] Resend error:", err));
}
