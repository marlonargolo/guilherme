import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { motion } from "framer-motion";
import { Sparkles, Brain, Rocket } from "lucide-react";
import { AppCard } from "@/components/super-admin/AppCard";

export default function SuperAdmin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    messagesTotal: 0,
    totalRevenue: 0,
    totalTokensUsed: 0,
  });

  useEffect(() => {
    loadQuickStats();
  }, []);

  const loadQuickStats = async () => {
    try {
      const [profilesRes, messagesTotalRes, paymentsRes, tokenUsageRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('omnichannel_messages').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'paid'),
        supabase.from('user_token_usage').select('tokens_used'),
      ]);

      const revenue = paymentsRes.data?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
      const tokensUsed = tokenUsageRes.data?.reduce((sum: number, t: any) => sum + Number(t.tokens_used), 0) || 0;

      setStats({
        totalUsers: profilesRes.count || 0,
        messagesTotal: messagesTotalRes.count || 0,
        totalRevenue: revenue,
        totalTokensUsed: tokensUsed,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const apps = [
    {
      id: 'social_flow',
      name: 'Social Flow',
      description: 'Automação Social & Engajamento',
      status: 'active' as const,
      color: '#00FF99',
      icon: Sparkles,
      route: '/super-admin/apps/social-flow',
      stats: [
        { label: 'Usuários', value: stats.totalUsers.toLocaleString(), trend: '+12% mês' },
        { label: 'Mensagens', value: stats.messagesTotal.toLocaleString(), trend: '+28 hoje' },
        { label: 'Receita', value: `R$ ${(stats.totalRevenue / 1000).toFixed(1)}k`, trend: 'MRR' },
      ],
    },
    {
      id: 'intelligent_agent',
      name: 'Intelligent Agent',
      description: 'IA Cognitiva & Automação',
      status: 'inactive' as const,
      color: '#A855F7',
      icon: Brain,
      route: '/super-admin/apps/intelligent-agent',
      stats: [
        { label: 'Tokens', value: stats.totalTokensUsed.toLocaleString(), trend: 'Processados' },
        { label: 'Precisão', value: '--%', trend: 'Em breve' },
        { label: 'Automação', value: '--%', trend: 'Em breve' },
      ],
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-8 pb-8">
        {/* Header Aitonomy */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl relative">
                <Rocket className="h-10 w-10 text-primary" />
                <div className="absolute inset-0 rounded-2xl blur-xl opacity-50 bg-gradient-to-br from-green-500 via-purple-500 to-pink-500" />
              </div>
              <h1 className="text-6xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-400 to-pink-400">
                  Aitonomy
                </span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-2">Plataforma SaaS Unificada</p>
            <p className="text-sm text-muted-foreground">Gerencie todos os seus aplicativos corporativos em um único lugar</p>
          </div>
        </motion.div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {apps.map((app) => (
            <AppCard key={app.id} {...app} />
          ))}
        </div>

      </div>
    </SuperAdminLayout>
  );
}
