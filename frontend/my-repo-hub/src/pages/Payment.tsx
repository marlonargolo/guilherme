import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionStatus } from "@/lib/subscription";
import { toast } from "sonner";
import { 
  Check, 
  Loader2, 
  CreditCard, 
  Calendar,
  Zap,
  MessageSquare,
  BarChart3,
  Users,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Plan {
  id: string;
  name: string;
  price: number;
  recurrence: string;
  stripe_price_id: string;
  features: string[];
  is_active: boolean;
  description: string | null;
}

export default function Payment() {
  const [loading, setLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscription();
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      
      // Map features from JSON to string array
      const plansData = (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        recurrence: plan.recurrence,
        stripe_price_id: plan.stripe_price_id,
        features: Array.isArray(plan.features) ? plan.features as string[] : [],
        is_active: plan.is_active,
        description: null as string | null
      }));
      
      setPlans(plansData);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoadingPlans(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscription(status);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async (priceId: string, planName: string) => {
    setLoading(priceId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecionando para o checkout...");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("portal");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error opening portal:", error);
      toast.error(error.message || "Erro ao abrir portal");
    } finally {
      setLoading(null);
    }
  };

  if (checkingSubscription || loadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Escolha seu plano
        </h1>
        <p className="text-muted-foreground text-lg">
          Potencialize suas redes sociais com automação inteligente
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription?.subscribed && (
        <Card className="p-6 mb-8 bg-primary/5 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">✨ Assinatura Ativa</h3>
              <p className="text-sm text-muted-foreground">
                Seu plano {subscription.plan === "annual" ? "anual" : "mensal"} está ativo
                {subscription.subscription_end && 
                  ` até ${new Date(subscription.subscription_end).toLocaleDateString("pt-BR")}`
                }
              </p>
            </div>
            <Button
              onClick={handleManageSubscription}
              disabled={loading === "portal"}
              variant="outline"
            >
              {loading === "portal" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Gerenciar Assinatura"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {plans.map((plan, index) => {
          const isCurrentPlan = subscription?.subscribed && subscription.product_id === plan.id;
          const isPopular = index === plans.length - 1; // Último plano é o mais popular

          return (
            <Card
              key={plan.id}
              className={`p-8 relative ${
                isPopular 
                  ? "border-primary shadow-lg scale-105" 
                  : ""
              }`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Mais Popular
                </Badge>
              )}

              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-6 bg-green-600">
                  Plano Atual
                </Badge>
              )}

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                )}
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">
                    R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">/{plan.recurrence}</span>
                </div>
              </div>

              <Button
                className="w-full mb-6"
                size="lg"
                onClick={() => handleSubscribe(plan.stripe_price_id, plan.name)}
                disabled={loading === plan.stripe_price_id || isCurrentPlan}
                variant={isPopular ? "default" : "outline"}
              >
                {loading === plan.stripe_price_id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : isCurrentPlan ? (
                  "Plano Atual"
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Assinar Agora
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground mb-6">
                💳 Cartão de crédito • PIX • Boleto
              </div>

              {/* Features do plano */}
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Cancele a qualquer momento. Sem taxas de cancelamento.
        </p>
        <p className="text-sm text-muted-foreground">
          Precisa de ajuda? Entre em contato com nosso suporte
        </p>
      </div>
    </div>
  );
}
