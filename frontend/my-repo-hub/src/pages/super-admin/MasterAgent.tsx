import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bot, 
  Send, 
  Loader2, 
  Brain, 
  Zap, 
  MessageSquare, 
  FileText,
  Settings,
  BarChart3,
  History,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MasterAgent() {
  const [testMessage, setTestMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [systemPrompt, setSystemPrompt] = useState("Você é o agente mestre do SocialFlow...");
  const [autoResponse, setAutoResponse] = useState(true);
  const [learningMode, setLearningMode] = useState(true);

  const testAgent = async () => {
    if (!testMessage.trim()) {
      toast.error("Digite uma mensagem para testar");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('master-agent', {
        body: {
          message: testMessage,
          context: [],
          user_id: (await supabase.auth.getUser()).data.user?.id,
          platform: 'instagram',
          sender_username: 'test_user'
        }
      });

      if (error) throw error;

      setResponse(data);
      toast.success("Resposta gerada com sucesso!");
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(error.message || "Erro ao testar agente");
    } finally {
      setIsLoading(false);
    }
  };

  const conversationHistory = [
    { platform: "instagram", user: "@cliente123", message: "Quanto custa?", reply: "Nossos planos começam em R$ 99/mês", status: "success", time: "2 min" },
    { platform: "whatsapp", user: "+55 11 99999-9999", message: "Preciso de ajuda", reply: "Claro! Como posso ajudar?", status: "success", time: "5 min" },
    { platform: "facebook", user: "João Silva", message: "Horário de atendimento?", reply: "Atendemos 24/7", status: "success", time: "8 min" },
    { platform: "tiktok", user: "@influencer", message: "Quero parceria", reply: "Ótimo! Vou transferir para o comercial", status: "pending", time: "12 min" },
  ];

  const stats = [
    { label: "Conversas Hoje", value: "1,284", change: "+12%", icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
    { label: "Taxa de Sucesso", value: "97.8%", change: "+2.1%", icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
    { label: "Tempo Médio", value: "1.2s", change: "-0.3s", icon: Clock, color: "from-purple-500 to-pink-500" },
    { label: "Satisfação", value: "4.9/5", change: "+0.2", icon: Sparkles, color: "from-orange-500 to-red-500" },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Master Agent
              </h1>
              <p className="text-muted-foreground mt-1">
                Central de IA Omnichannel - Gerenciamento Completo
              </p>
            </div>
          </div>
          <Badge className="px-4 py-2" variant="outline">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
            Sistema Ativo
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="glass-card border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-xs text-green-400 mt-1">{stat.change}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="test" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Testar
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Treinamento
            </TabsTrigger>
          </TabsList>

          {/* Test Tab */}
          <TabsContent value="test" className="space-y-4">
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400" />
                  Testar Agente em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plataforma</Label>
                    <select className="w-full mt-2 px-3 py-2 bg-background/50 border border-border rounded-lg">
                      <option>Instagram</option>
                      <option>WhatsApp</option>
                      <option>Facebook</option>
                      <option>TikTok</option>
                      <option>LinkedIn</option>
                    </select>
                  </div>
                  <div>
                    <Label>Tipo de Mensagem</Label>
                    <select className="w-full mt-2 px-3 py-2 bg-background/50 border border-border rounded-lg">
                      <option>Interesse em Produto</option>
                      <option>Suporte Técnico</option>
                      <option>Reclamação</option>
                      <option>Dúvida Geral</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Mensagem de Teste</Label>
                  <Textarea
                    placeholder="Digite uma mensagem como se fosse um cliente... Ex: 'Quero saber mais sobre o produto!'"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="min-h-[120px] mt-2 bg-background/50 border-border"
                  />
                </div>

                <Button 
                  onClick={testAgent} 
                  disabled={isLoading}
                  className="w-full btn-glow"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Testar Agente
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Response */}
            {response && (
              <Card className="glass-card border-cyan-500/20 animate-in fade-in-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-cyan-400" />
                    Análise da Resposta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Resposta Gerada:</p>
                    <p className="font-medium text-lg">{response.agent_response?.reply}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Ação Recomendada:</p>
                      <Badge variant={response.agent_response?.action === 'send' ? 'default' : 'secondary'}>
                        {response.agent_response?.action}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Confiança:</p>
                      <div className="flex items-center gap-2">
                        <Progress value={95} className="h-2" />
                        <span className="text-xs font-bold">95%</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Próximo Passo:</p>
                      <p className="text-xs font-medium">
                        {response.agent_response?.next_step || 'Encerrado'}
                      </p>
                    </div>
                  </div>

                  {response.agent_response?.tags && (
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Tags de Intenção:</p>
                      <div className="flex flex-wrap gap-2">
                        {response.agent_response.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="space-y-4">
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-400" />
                  Configurações do Agente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Resposta Automática</p>
                      <p className="text-sm text-muted-foreground">Enviar respostas automaticamente</p>
                    </div>
                    <Switch checked={autoResponse} onCheckedChange={setAutoResponse} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">Modo Aprendizado</p>
                      <p className="text-sm text-muted-foreground">Aprender com cada interação</p>
                    </div>
                    <Switch checked={learningMode} onCheckedChange={setLearningMode} />
                  </div>
                </div>

                <div>
                  <Label>Prompt do Sistema (Personalizado)</Label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[200px] mt-2 bg-background/50 font-mono text-sm"
                    placeholder="Defina como o agente deve se comportar..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Este prompt define a personalidade e comportamento do agente
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Temperatura (Criatividade)</Label>
                    <Input type="number" step="0.1" min="0" max="2" defaultValue="0.8" className="mt-2" />
                  </div>
                  <div>
                    <Label>Tokens Máximos</Label>
                    <Input type="number" defaultValue="800" className="mt-2" />
                  </div>
                </div>

                <Button className="w-full btn-glow">
                  <Zap className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="glass-card border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-cyan-400" />
                  Histórico de Conversas (Últimas 24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversationHistory.map((conv, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{conv.platform}</Badge>
                          <span className="text-sm font-medium">{conv.user}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {conv.status === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-400" />
                          )}
                          <span className="text-xs text-muted-foreground">{conv.time}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="p-2 bg-background/50 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Cliente:</p>
                          <p className="text-sm">{conv.message}</p>
                        </div>
                        <div className="p-2 bg-primary/5 rounded">
                          <p className="text-xs text-muted-foreground mb-1">Agente:</p>
                          <p className="text-sm">{conv.reply}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Desempenho por Plataforma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["Instagram", "WhatsApp", "Facebook", "TikTok"].map((platform, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{platform}</span>
                        <span className="font-semibold">{95 + i * 2}%</span>
                      </div>
                      <Progress value={95 + i * 2} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Tipos de Mensagem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["Interesse", "Suporte", "Dúvidas", "Reclamação"].map((type, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                      <span className="text-sm">{type}</span>
                      <Badge variant="outline">{1200 - i * 200}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4">
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  Treinamento e Melhoria Contínua
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg border border-border">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    Aprendizado Ativo
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    O agente aprende automaticamente com cada interação bem-sucedida
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Dados coletados</span>
                      <span className="font-semibold">1,284 conversas</span>
                    </div>
                    <Progress value={73} className="h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Exportar Dataset
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Brain className="mr-2 h-4 w-4" />
                    Treinar Modelo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
