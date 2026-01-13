import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SocialFlowLayout } from "@/components/layout/SocialFlowLayout";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  DollarSign,
  RefreshCw,
  Users,
  TrendingUp,
  MessageSquare,
  Activity,
  Zap,
  Sparkles,
  Brain,
  ArrowUpRight,
  BarChart3,
  Target,
  Layers,
  Shield,
  TrendingDown,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';

export default function SocialFlowDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    messagesTotal: 0,
    messagesToday: 0,
    revenueThisMonth: 0,
    averageRevenuePerUser: 0,
    conversionRate: 0,
    retentionRate: 0,
    churnRate: 0,
    planBasic: 0,
    planPro: 0,
    planBusiness: 0,
    planFree: 0,
    totalTokensUsed: 0,
    totalTokensLimit: 0,
    tokenPacksSold: 0,
    tokenPacksRevenue: 0,
    pendingPayments: 0,
    paidPayments: 0,
    failedPayments: 0,
  });

  // Mock data for integrated charts
  const integratedRevenueData = [
    { month: 'Jan', socialFlow: 4200, intelligentAgent: 2800, total: 7000 },
    { month: 'Fev', socialFlow: 5400, intelligentAgent: 3400, total: 8800 },
    { month: 'Mar', socialFlow: 7100, intelligentAgent: 4600, total: 11700 },
    { month: 'Abr', socialFlow: 8800, intelligentAgent: 5900, total: 14700 },
    { month: 'Mai', socialFlow: 10200, intelligentAgent: 7500, total: 17700 },
    { month: 'Jun', socialFlow: 12500, intelligentAgent: 9200, total: 21700 },
  ];

  const comparativeMetrics = [
    { metric: 'Usuários', socialFlow: 68, intelligentAgent: 32 },
    { metric: 'Receita', socialFlow: 62, intelligentAgent: 38 },
    { metric: 'Engajamento', socialFlow: 75, intelligentAgent: 85 },
    { metric: 'Conversão', socialFlow: 58, intelligentAgent: 72 },
  ];

  const performanceTimeline = [
    { time: '00:00', socialFlow: 45, intelligentAgent: 32 },
    { time: '04:00', socialFlow: 52, intelligentAgent: 38 },
    { time: '08:00', socialFlow: 68, intelligentAgent: 55 },
    { time: '12:00', socialFlow: 85, intelligentAgent: 78 },
    { time: '16:00', socialFlow: 92, intelligentAgent: 88 },
    { time: '20:00', socialFlow: 78, intelligentAgent: 72 },
  ];

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const cached = sessionStorage.getItem('dashboard_stats');
    const cacheTime = sessionStorage.getItem('dashboard_stats_time');
    
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
      setStats(JSON.parse(cached));
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [profilesRes, paymentsRes, tokenUsageRes, tokenPacksRes, messagesTotalRes, messagesTodayRes] = await Promise.all([
        supabase.from('profiles').select('subscription_status, created_at, plan'),
        supabase.from('payments').select('amount, status, payment_date'),
        supabase.from('user_token_usage').select('tokens_used, tokens_limit'),
        supabase.from('token_packs').select('price'),
        supabase.from('omnichannel_messages').select('*', { count: 'exact', head: true }),
        supabase.from('omnichannel_messages').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      ]);

      const profiles = profilesRes.data || [];
      const allPayments = paymentsRes.data || [];
      const tokenUsage = tokenUsageRes.data || [];
      const tokenPacks = tokenPacksRes.data || [];

      const tokenPacksSold = tokenPacks.length || 0;
      const tokenPacksRevenue = tokenPacks.reduce((sum: number, p: any) => sum + Number(p.price), 0) || 0;
      const messagesTotal = messagesTotalRes.count || 0;
      const messagesToday = messagesTodayRes.count || 0;

      const active = profiles.filter((p: any) => p.subscription_status === 'active').length || 0;
      const cancelled = profiles.filter((p: any) => p.subscription_status === 'cancelled').length || 0;
      const newToday = profiles.filter((p: any) => p.created_at >= todayStart).length || 0;
      const newThisWeek = profiles.filter((p: any) => p.created_at >= weekStart).length || 0;
      const newThisMonth = profiles.filter((p: any) => p.created_at >= monthStart).length || 0;

      const planFree = profiles.filter((p: any) => p.plan === 'free').length || 0;
      const planBasic = profiles.filter((p: any) => p.plan === 'basic').length || 0;
      const planPro = profiles.filter((p: any) => p.plan === 'pro').length || 0;
      const planBusiness = profiles.filter((p: any) => p.plan === 'business').length || 0;

      const paidPayments = allPayments.filter((p: any) => p.status === 'paid').length || 0;
      const pendingPayments = allPayments.filter((p: any) => p.status === 'pending').length || 0;
      const failedPayments = allPayments.filter((p: any) => p.status === 'failed').length || 0;

      const revenue = allPayments.filter((p: any) => p.status === 'paid')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
      const revenueMonth = allPayments.filter((p: any) => p.status === 'paid' && p.payment_date >= monthStart)
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;

      const totalTokensUsed = tokenUsage.reduce((sum: number, t: any) => sum + Number(t.tokens_used), 0) || 0;
      const totalTokensLimit = tokenUsage.reduce((sum: number, t: any) => sum + Number(t.tokens_limit), 0) || 0;
      const totalUsers = profiles?.length || 0;
      const avgRevenue = totalUsers > 0 ? revenue / totalUsers : 0;
      const conversionRate = totalUsers > 0 ? (active / totalUsers) * 100 : 0;
      const retentionRate = (active + cancelled) > 0 ? (active / (active + cancelled)) * 100 : 0;
      const churnRate = totalUsers > 0 ? (cancelled / totalUsers) * 100 : 0;

      const newStats = {
        totalUsers,
        activeSubscriptions: active,
        cancelledSubscriptions: cancelled,
        totalRevenue: revenue,
        newUsersToday: newToday,
        newUsersThisWeek: newThisWeek,
        newUsersThisMonth: newThisMonth,
        messagesTotal,
        messagesToday,
        revenueThisMonth: revenueMonth,
        averageRevenuePerUser: avgRevenue,
        conversionRate,
        retentionRate,
        churnRate,
        planBasic,
        planPro,
        planBusiness,
        planFree,
        totalTokensUsed,
        totalTokensLimit,
        tokenPacksSold,
        tokenPacksRevenue,
        pendingPayments,
        paidPayments,
        failedPayments,
      };
      
      sessionStorage.setItem('dashboard_stats', JSON.stringify(newStats));
      sessionStorage.setItem('dashboard_stats_time', String(Date.now()));
      setStats(newStats);
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SocialFlowLayout>
      <div className="space-y-8 pb-8">
        {/* Header Social Flow */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                  <Sparkles className="h-8 w-8 text-green-400" />
                </div>
                <h1 className="text-5xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                    Social Flow
                  </span>
                </h1>
              </div>
              <p className="text-muted-foreground">Automação Social & Engajamento Inteligente</p>
            </div>
            <Button onClick={loadStats} variant="outline" disabled={isLoading} className="gap-2 relative overflow-hidden group border-green-500/30 hover:border-green-500/50">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} relative z-10 text-green-400`} />
              <span className="relative z-10">Atualizar</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </motion.div>

        {/* KPIs Social Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="glass-card border-green-500/20 relative overflow-hidden group hover:shadow-2xl hover:shadow-green-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Mensagens</h3>
              <p className="text-4xl font-bold text-green-400 mb-2">
                {stats.messagesTotal.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <ArrowUpRight className="h-3 w-3 text-green-400" />
                <span className="text-green-400 font-medium">+{stats.messagesToday}</span>
                <span className="text-muted-foreground">hoje</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-emerald-500/20 relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl">
                  <Target className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Conversão</h3>
              <p className="text-4xl font-bold text-emerald-400 mb-2">
                {stats.conversionRate.toFixed(1)}%
              </p>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-success font-medium">Taxa ativa</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-500/20 relative overflow-hidden group hover:shadow-2xl hover:shadow-green-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Receita</h3>
              <p className="text-4xl font-bold text-green-400 mb-2">
                R$ {(stats.totalRevenue / 1000).toFixed(1)}k
              </p>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-green-400" />
                <span className="text-green-400 font-medium">MRR: R$ {(stats.revenueThisMonth / 1000).toFixed(1)}k</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-emerald-500/20 relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/20 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl">
                  <Activity className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Retenção</h3>
              <p className="text-4xl font-bold text-emerald-400 mb-2">
                {stats.retentionRate.toFixed(0)}%
              </p>
              <div className="flex items-center gap-2 text-xs">
                <Activity className="h-3 w-3 text-success" />
                <span className="text-success font-medium">Saudável</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Planos Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Layers className="h-5 w-5" />
                Distribuição de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                  <Badge className="bg-muted/50 text-muted-foreground mb-2">Free</Badge>
                  <p className="text-3xl font-bold text-green-400">{stats.planFree}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                  <Badge className="bg-green-500/20 text-green-400 mb-2">Basic</Badge>
                  <p className="text-3xl font-bold text-green-400">{stats.planBasic}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                  <Badge className="bg-emerald-500/20 text-emerald-400 mb-2">Pro</Badge>
                  <p className="text-3xl font-bold text-emerald-400">{stats.planPro}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
                  <Badge className="bg-green-600/20 text-green-300 mb-2">Business</Badge>
                  <p className="text-3xl font-bold text-green-300">{stats.planBusiness}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SocialFlowLayout>
  );
}
