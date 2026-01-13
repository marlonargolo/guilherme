import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionStatus {
  subscribed: boolean;
  plan?: string | null;
  plan_name?: string | null;
  product_id?: string | null;
  subscription_end?: string | null;
  tokens_used?: number;
  tokens_limit?: number;
  tokens_remaining?: number;
  fallback?: boolean;
}

export const FALLBACK_SUBSCRIPTION_STATUS: SubscriptionStatus = {
  subscribed: true,
  plan: "lifetime",
  plan_name: "Acesso liberado",
  product_id: "internal-fallback",
  subscription_end: null,
  tokens_used: 0,
  tokens_limit: 1_000_000,
  tokens_remaining: 1_000_000,
  fallback: true,
};

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers = session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : undefined;

    const { data, error } = await supabase.functions.invoke("check-subscription", {
      headers,
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return (data as SubscriptionStatus) || FALLBACK_SUBSCRIPTION_STATUS;
  } catch (err) {
    console.warn("Falling back to default subscription status", err);
    return FALLBACK_SUBSCRIPTION_STATUS;
  }
}
