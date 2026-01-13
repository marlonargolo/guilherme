import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterAgentPanel } from "@/components/super-admin/MasterAgentPanel";
import { VoiceAgent } from "@/components/voice/VoiceAgent";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Zap,
  MessageSquare,
  Bot,
  Shield,
  Globe,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Mic
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const stats = [
    {
      title: "Usuários Ativos",
      value: "2,847",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Receita (MRR)",
      value: "R$ 89.4k",
      change: "+23.1%",
      trend: "up",
      icon: DollarSign,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Conversões",
      value: "94.2%",
      change: "+5.4%",
      trend: "up",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Taxa de Resposta IA",
      value: "97.8%",
      change: "-0.3%",
      trend: "down",
      icon: Bot,
      color: "from-orange-500 to-red-500"
    }
  ];

  const recentActivity = [
    { type: "user", message: "50 novos usuários registrados", time: "5 min atrás", status: "success" },
    { type: "payment", message: "R$ 4.8k em pagamentos processados", time: "12 min atrás", status: "success" },
    { type: "ai", message: "1.2k mensagens processadas pela IA", time: "23 min atrás", status: "info" },
    { type: "alert", message: "3 usuários atingiram limite de tokens", time: "1h atrás", status: "warning" },
  ];

  const platformStats = [
    { name: "WhatsApp", users: 1240, messages: 45680, color: "from-green-500 to-emerald-500" },
    { name: "Instagram", users: 980, messages: 38420, color: "from-pink-500 to-purple-500" },
    { name: "Facebook", users: 627, messages: 21340, color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-8 relative">
        {/* Fundo futurista */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
        </div>

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between pb-8 border-b border-border/30">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-2xl blur-xl" />
                <div className="relative bg-gradient-to-br from-primary to-accent p-3 rounded-2xl">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Dashboard Master
                </h1>
                <p className="text-muted-foreground/80 mt-1.5 text-base">Visão completa do sistema com controle por voz</p>
              </div>
            </div>
            <Badge className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary/50 transition-all" variant="outline">
              <Mic className="h-4 w-4 text-primary animate-pulse" />
              <span className="font-semibold">Voice AI Active</span>
            </Badge>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const isUp = stat.trend === "up";
            return (
              <Card key={i} className="group glass-card border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <p className="text-sm text-muted-foreground/80 font-medium uppercase tracking-wide">{stat.title}</p>
                      <p className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <div className="flex items-center gap-1.5 bg-muted/20 rounded-lg px-2.5 py-1.5 w-fit">
                        {isUp ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span className={`text-xs font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
                          {stat.change}
                        </span>
                        <span className="text-xs text-muted-foreground/60">vs mês</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity`} />
                      <div className={`relative p-3.5 rounded-xl bg-gradient-to-br ${stat.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Platform Stats */}
            <Card className="glass-card border-border/30 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="border-b border-border/30 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  Estatísticas por Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {platformStats.map((platform, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{platform.name}</p>
                          <p className="text-xs text-muted-foreground">{platform.users} usuários ativos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{platform.messages.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">mensagens/dia</p>
                      </div>
                    </div>
                    <Progress value={(platform.messages / 500) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass-card border-border/30 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="border-b border-border/30 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border hover:border-primary/30 transition-all">
                      <div className={`p-2 rounded-lg ${
                        activity.status === "success" ? "bg-green-500/10" :
                        activity.status === "warning" ? "bg-yellow-500/10" :
                        "bg-blue-500/10"
                      }`}>
                        {activity.type === "user" && <Users className="h-4 w-4 text-green-400" />}
                        {activity.type === "payment" && <DollarSign className="h-4 w-4 text-green-400" />}
                        {activity.type === "ai" && <Bot className="h-4 w-4 text-blue-400" />}
                        {activity.type === "alert" && <Shield className="h-4 w-4 text-yellow-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          activity.status === "success" ? "border-green-500/30 text-green-400" :
                          activity.status === "warning" ? "border-yellow-500/30 text-yellow-400" :
                          "border-blue-500/30 text-blue-400"
                        }
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Master Agent Panel */}
            <Card className="glass-card border-purple-500/20">
              <CardContent className="pt-6">
                <MasterAgentPanel />
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="glass-card border-green-500/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  Saúde do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">API Response</span>
                    <span className="font-semibold text-green-400">99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Database</span>
                    <span className="font-semibold text-green-400">98.7%</span>
                  </div>
                  <Progress value={98.7} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Edge Functions</span>
                    <span className="font-semibold text-green-400">99.5%</span>
                  </div>
                  <Progress value={99.5} className="h-1.5" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IA Gateway</span>
                    <span className="font-semibold text-green-400">97.8%</span>
                  </div>
                  <Progress value={97.8} className="h-1.5" />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className="w-full justify-start py-2 cursor-pointer hover:bg-primary/20 transition-all" variant="outline">
                  <Users className="mr-2 h-3 w-3" />
                  Gerenciar Usuários
                </Badge>
                <Badge className="w-full justify-start py-2 cursor-pointer hover:bg-primary/20 transition-all" variant="outline">
                  <Zap className="mr-2 h-3 w-3" />
                  Criar Automação
                </Badge>
                <Badge className="w-full justify-start py-2 cursor-pointer hover:bg-primary/20 transition-all" variant="outline">
                  <Bot className="mr-2 h-3 w-3" />
                  Configurar IA
                </Badge>
                <Badge className="w-full justify-start py-2 cursor-pointer hover:bg-primary/20 transition-all" variant="outline">
                  <Globe className="mr-2 h-3 w-3" />
                  Integrações
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Voice Agent - Controle Global */}
      <VoiceAgent />
    </SuperAdminLayout>
  );
}
