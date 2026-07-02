// Geniuspay — paiements des abonnements RestoFlow (gérants uniquement, pas les commandes clients)

const API_URL = process.env.GENIUSPAY_API_URL ?? "https://api.geniuspay.com/v1";
const API_KEY = process.env.GENIUSPAY_API_KEY ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://resto-flow-gold-ten.vercel.app";

export const PLANS = {
  starter:  { label: "Plan Starter",  amount: 25_000 },
  pro:      { label: "Plan Pro",      amount: 45_000 },
  business: { label: "Plan Business", amount: 75_000 },
} as const;

export type PlanKey = keyof typeof PLANS;

export interface GeniuspayPaymentResult {
  payment_url: string;
  transaction_id: string;
}

export async function createSubscriptionPayment(
  restaurantId: string,
  plan: PlanKey
): Promise<GeniuspayPaymentResult> {
  const { label, amount } = PLANS[plan];

  const response = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      amount,
      currency: "XOF",
      description: `Abonnement RestoFlow — ${label}`,
      callback_url: `${APP_URL}/api/webhook/geniuspay`,
      return_url: `${APP_URL}/${restaurantId}/abonnement?success=true&plan=${plan}`,
      cancel_url: `${APP_URL}/${restaurantId}/abonnement?cancelled=true`,
      metadata: { restaurant_id: restaurantId, plan },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Geniuspay error ${response.status}: ${text}`);
  }

  return response.json() as Promise<GeniuspayPaymentResult>;
}
