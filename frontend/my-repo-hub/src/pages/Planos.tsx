import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Sparkles, TrendingUp, Users, Shield, Clock, ShoppingCart, Info, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionStatus } from "@/lib/subscription";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  token_limit: number;
  features: string[];
  stripe_price_id: string;
  stripe_product_id: string;
}

const FEATURE_CATALOG: Record<string, string[]> = {
  bronze: [
    "Painel básico, com visão geral das conversas.",
    "Caixa de entrada omnichanel com WhatsApp e Instagram.",
    "12 automações de mensagens diretas (DM) para agilizar respostas.",
    "Bate-papo com IA para responder automaticamente.",
    "Estúdio de Criação com acesso básico a ferramentas de texto e imagem.",
    "Comentários com monitoramento manual.",
    "Gerente de Prompt na versão padrão.",
    "Agente de IA simples, focado em suporte automático.",
  ],
  prata: [
    "Painel intermediário, com métricas em tempo real.",
    "Caixa de entrada omnichanel para WhatsApp, Instagram e Facebook.",
    "25 automações de DM, com fluxos inteligentes.",
    "Bate-papo IA aprimorado, que entende contexto e histórico de conversas.",
    "Estúdio de Criação completo, com modelos prontos para posts e campanhas.",
    "Comentários com monitoramento e resposta direta.",
    "Gerente de Prompt com personalização total.",
    "Agente de IA que interage proativamente com leads e clientes.",
  ],
  ouro: [
    "Painel avançado, com dashboards e relatórios automáticos.",
    "Caixa de entrada omnicanal completa, integrando WhatsApp, Instagram, Facebook e E-mail.",
    "Automações DM ilimitadas, com fluxos condicionais.",
    "Bate-papo IA personalizado, com voz, tom e persona da marca.",
    "Estúdio de Criação premium, com acesso a recursos avançados de IA.",
    "Comentários gerenciados automaticamente pela IA.",
    "Gerente de Prompt avançado, com análise e otimização por inteligência artificial.",
    "Agente de IA completo, capaz de automatizar todo o atendimento e relacionamento com o cliente.",
  ],
};

export default function Planos() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
    checkCurrentSubscription();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      const formattedPlans: Plan[] = data.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: Number(plan.price),
        currency: plan.currency,
        token_limit: plan.token_limit,
        features:
          (plan.features as string[])?.length
            ? (plan.features as string[])
            : FEATURE_CATALOG[
                plan.name?.toLowerCase().includes("bronze")
                  ? "bronze"
                  : plan.name?.toLowerCase().includes("prata") || plan.name?.toLowerCase().includes("pro")
                    ? "prata"
                    : plan.name?.toLowerCase().includes("ouro")
                      ? "ouro"
                      : ""
              ] || [],
        stripe_price_id: plan.stripe_price_id,
        stripe_product_id: plan.stripe_product_id
      }));

      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentSubscription = async () => {
    try {
      const status = await getSubscriptionStatus();
      if (status?.subscribed && status?.product_id) {
        setCurrentPlan(status.product_id);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async (priceId: string, planName: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar logado para assinar');
        navigate('/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { data: checkoutData, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      if (checkoutData?.url) {
        // Open in new tab for mobile compatibility
        window.open(checkoutData.url, '_blank');
        toast.success(`Iniciando teste grátis do plano ${planName}...`);
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao criar checkout: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('bronze') || planName.toLowerCase().includes('básico')) return <Zap className="h-8 w-8 text-primary" />;
    if (planName.toLowerCase().includes('prata') || planName.toLowerCase().includes('pro')) return <Sparkles className="h-8 w-8 text-primary" />;
    return <Crown className="h-8 w-8 text-primary" />;
  };

  const formatTokens = (tokens: number) => {
    return (tokens / 1000).toFixed(0) + 'k';
  };

  const handleBuyTokens = async (priceId: string, packName: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Você precisa estar logado para comprar tokens');
        navigate('/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { data: paymentData, error } = await supabase.functions.invoke('create-payment', {
        body: { priceId },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      if (paymentData?.url) {
        // Open in new tab for mobile compatibility
        window.open(paymentData.url, '_blank');
        toast.success(`Iniciando compra do pacote ${packName}...`);
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error('Erro ao criar pagamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background relative overflow-hidden"
    >
      {/* Purple Ultra Modern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.08),transparent_50%)]" />

      {/* Animated gradient bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ x: -100, y: 50, scale: 0.9, opacity: 0.4 }}
          animate={{ x: 50, y: 0, scale: 1, opacity: 0.6 }}
          transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute -top-10 -left-20 h-64 w-64 rounded-full blur-3xl"
          style={{ background: 'var(--gradient-primary)' }}
        />
        <motion.div
          initial={{ x: 80, y: 120, scale: 1, opacity: 0.35 }}
          animate={{ x: -40, y: 60, scale: 1.1, opacity: 0.5 }}
          transition={{ duration: 14, repeat: Infinity, repeatType: 'reverse', delay: 1 }}
          className="absolute bottom-10 right-10 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'var(--gradient-accent)' }}
        />
        <motion.div
          initial={{ x: -50, y: 220, scale: 0.8, opacity: 0.25 }}
          animate={{ x: 0, y: 180, scale: 1, opacity: 0.4 }}
          transition={{ duration: 16, repeat: Infinity, repeatType: 'reverse', delay: 0.5 }}
          className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.3), transparent 60%)' }}
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-16">
        {/* Minimal Hero */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6"
          >
            <Users className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">
              + de 5.000 empresas transformando atendimento com SocialFlow
            </span>
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              Escolha seu plano
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Automatize seu atendimento e escale suas vendas com IA
          </p>
        </motion.div>

        {/* Minimal Stats */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-12 mb-16 text-sm"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">94% Taxa de Automação</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Dados 100% Seguros</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Resposta em 0.8s</span>
          </div>
        </motion.div>

        {/* Minimal Plans Grid */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20"
        >
          {plans.map((plan, idx) => {
            const isCurrentPlan = currentPlan === plan.stripe_product_id;
            const isPopular = idx === 1;

            return (
              <motion.div
                key={plan.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="relative"
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <Badge className="bg-primary text-primary-foreground border-0 text-xs px-3">
                      Mais escolhido
                    </Badge>
                  </div>
                )}
                
                <Card 
                  className={cn(
                    "relative overflow-hidden border transition-all duration-300 h-full backdrop-blur-sm",
                    isPopular 
                      ? "border-primary/30 bg-primary/5" 
                      : "border-border/50 bg-background/50",
                    isCurrentPlan && "ring-2 ring-primary/50"
                  )}
                >
                  <CardHeader className="pt-8 pb-4 text-center border-b border-border/30">
                    <div className="mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {plan.name}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
                        R${plan.price}
                      </span>
                      <span className="text-muted-foreground text-sm">/mês</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                      <Zap className="h-3 w-3 text-primary" />
                      {formatTokens(plan.token_limit)} IA Points
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 pb-8">
                    <div className="space-y-2.5 mb-8 min-h-[200px]">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={() => handleSubscribe(plan.stripe_price_id, plan.name)}
                      disabled={loading || isCurrentPlan}
                      className={cn(
                        "w-full h-11 transition-all duration-300",
                        isPopular 
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" 
                          : "bg-secondary hover:bg-secondary/80",
                        isCurrentPlan && "bg-primary/20 text-primary cursor-not-allowed"
                      )}
                    >
                      {isCurrentPlan ? "✓ Plano atual" : "Começar grátis"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Benefícios e Soluções Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Por que escolher SocialFlow?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transforme seus desafios em oportunidades com IA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* Problemas → Soluções */}
            <Card className="glass-card p-8 border-border/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Problemas Comuns</h3>
                  <p className="text-sm text-muted-foreground">O que você enfrenta hoje</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Sobrecarga de Mensagens</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Equipe pequena não consegue responder todas as mensagens a tempo
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Perda de Vendas</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clientes desistem quando não recebem resposta rápida
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Atendimento 24/7 Impossível</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Custos proibitivos para manter equipe sempre disponível
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Dificuldade em Escalar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Crescimento limitado pela capacidade da equipe
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass-card p-8 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Soluções SocialFlow</h3>
                  <p className="text-sm text-muted-foreground">Como resolvemos para você</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">IA responde instantaneamente</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      94% das mensagens respondidas em menos de 1 segundo
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Aumento de 3x em conversões</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Respostas imediatas convertem mais leads em clientes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Atendimento 24/7 sem custo extra</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      IA trabalha continuamente, sua equipe foca no estratégico
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Escale sem limites</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atenda 10x mais clientes com a mesma equipe
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Token Packs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Pacotes de Tokens Extras
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Precisa de mais créditos? Adquira tokens extras a qualquer momento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { 
                name: "Bronze", 
                tokens: 50000, 
                price: 49, 
                icon: Sparkles, 
                priceId: "price_1SLrVECn7iEIWiur1QNSTFjF"
              },
              { 
                name: "Prata", 
                tokens: 150000, 
                price: 119, 
                icon: Zap, 
                popular: true,
                priceId: "price_1SLrWOCn7iEIWiurEmiOrXvV"
              },
              { 
                name: "Ouro", 
                tokens: 500000, 
                price: 349, 
                icon: Crown, 
                priceId: "price_1SLrWjCn7iEIWiurkAYlGDMo"
              }
            ].map((pack, idx) => (
              <motion.div
                key={pack.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative"
              >
                <Card className={cn(
                  "glass-card p-8 border-border/30 relative overflow-hidden group backdrop-blur-xl bg-background/50",
                  "hover:border-primary/50 transition-all duration-300",
                  pack.popular && "border-primary/50"
                )}>
                  {pack.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground border-0">
                      Melhor Custo
                    </Badge>
                  )}
                  
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                        <pack.icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-center mb-2">{pack.name}</h3>
                    
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {formatTokens(pack.tokens)}
                      </div>
                      <div className="text-sm text-muted-foreground">IA Points</div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold">R$ {pack.price}</div>
                      <div className="text-sm text-muted-foreground">compra única</div>
                    </div>
                    
                    {/* Cost per token */}
                    <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-xs text-primary text-center font-medium">
                        💰 Economize {Math.round(((0.002 - (pack.price / (pack.tokens / 1000))) / 0.002) * 100)}%
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleBuyTokens(pack.priceId, pack.name)}
                      disabled={loading}
                      className="w-full rounded-xl py-6 bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Comprar Tokens
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Token Info */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 max-w-3xl mx-auto"
          >
            <Card className="glass-card p-6 border-primary/20 backdrop-blur-xl bg-background/50">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Como funcionam os IA Points?
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Os <strong className="text-primary">IA Points</strong> são unidades de uso de IA. Cada interação consome créditos conforme sua complexidade.
                    <span className="block mt-3 space-y-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        1 resposta simples = 5 pontos
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                        1 arte gerada = 100 pontos
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        1 análise completa = 50 pontos
                      </span>
                    </span>
                    <span className="block mt-3 text-primary font-medium">
                      💡 Seus tokens não expiram enquanto sua assinatura estiver ativa!
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Perguntas Frequentes
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <Card className="glass-card p-6 backdrop-blur-xl bg-background/70 border-primary/20">
              <h3 className="font-semibold mb-2 text-primary">Como funciona o trial de 3 dias?</h3>
              <p className="text-sm text-muted-foreground">
                Você precisa cadastrar um cartão válido, mas nada será cobrado nos primeiros 3 dias. Você recebe 10 mil tokens grátis para testar. Após os 3 dias, a cobrança do plano escolhido será automática, a menos que você cancele antes.
              </p>
            </Card>
            <Card className="glass-card p-6 backdrop-blur-xl bg-background/70 border-primary/20">
              <h3 className="font-semibold mb-2 text-primary">Posso cancelar a qualquer momento?</h3>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode cancelar sua assinatura a qualquer momento durante ou após o período de teste. Não há multas ou taxas de cancelamento.
              </p>
            </Card>
            <Card className="glass-card p-6 backdrop-blur-xl bg-background/70 border-primary/20">
              <h3 className="font-semibold mb-2 text-primary">O que são IA Points?</h3>
              <p className="text-sm text-muted-foreground">
                IA Points são créditos de uso da inteligência artificial. Cada ação (resposta, análise, criação) consome uma quantidade específica de pontos. Seus tokens não expiram enquanto você tiver uma assinatura ativa.
              </p>
            </Card>
            <Card className="glass-card p-6 backdrop-blur-xl bg-background/70 border-primary/20">
              <h3 className="font-semibold mb-2 text-primary">Posso comprar mais tokens depois?</h3>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode adquirir pacotes de tokens adicionais a qualquer momento. Configure também a recarga automática ao atingir 10% dos seus créditos para nunca ficar sem.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 text-center"
        >
          <Card className="glass-card p-12 backdrop-blur-xl bg-background/70 border-primary/20 max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Pronto para Transformar seu Negócio?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se a mais de 2.500 empresas que já estão automatizando vendas com IA
            </p>
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/50 text-lg px-8 py-6 rounded-xl"
              onClick={() => {
                const plansSection = document.querySelector('[data-plans-section]');
                plansSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Zap className="mr-2 h-6 w-6" />
              Começar Teste Grátis Agora
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              3 dias grátis • 10 mil tokens bônus • Sem compromisso
            </p>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
