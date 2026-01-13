import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Sparkles, TrendingUp, Users, MessageSquare, Download, Trash2, Mail, Bell, Calendar, Filter, BarChart3, Brain, Zap, Copy, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  sentiment?: "positive" | "neutral" | "negative";
  tokens?: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: "welcome" | "announcement" | "warning" | "promotion";
}

import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";

export default function IA() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "system",
      content: "🤖 Sou o assistente administrativo do Social Flow com IA avançada. Posso analisar dados, sugerir estratégias e ajudar em decisões complexas. Como posso ajudar você hoje?",
      timestamp: new Date(),
      sentiment: "positive"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState<"analysis" | "support" | "strategic">("analysis");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Message System States
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: "1",
      name: "Boas-vindas Novo Usuário",
      subject: "Bem-vindo ao Social Flow! 🎉",
      content: "Olá {{nome}}!\n\nEstamos muito felizes em ter você conosco no Social Flow. Sua jornada de automação e crescimento nas redes sociais começa agora!\n\n✨ Recursos disponíveis:\n- Automação de DMs\n- Análise de comentários\n- Agendamento de posts\n- Chat IA integrado\n\nQualquer dúvida, estamos à disposição!\n\nEquipe Social Flow",
      type: "welcome"
    },
    {
      id: "2",
      name: "Aviso de Manutenção",
      subject: "⚠️ Manutenção Programada",
      content: "Prezado(a) {{nome}},\n\nInformaremos que realizaremos uma manutenção programada no sistema:\n\n📅 Data: {{data}}\n⏰ Horário: {{horario}}\n⏱️ Duração estimada: {{duracao}}\n\nDurante este período, algumas funcionalidades podem ficar temporariamente indisponíveis.\n\nAgradecemos a compreensão!",
      type: "warning"
    },
    {
      id: "3",
      name: "Oferta Especial",
      subject: "🎁 Oferta Exclusiva para Você!",
      content: "Olá {{nome}}!\n\nTemos uma oferta especial só para você:\n\n💎 {{oferta}}\n💰 Desconto: {{desconto}}%\n⏰ Válido até: {{validade}}\n\nNão perca essa oportunidade!\n\nUse o código: {{codigo}}\n\nAproveite!",
      type: "promotion"
    }
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageType, setMessageType] = useState<"email" | "whatsapp">("email");
  const [recipientFilter, setRecipientFilter] = useState("all");
  const [scheduledDate, setScheduledDate] = useState("");
  const [appFilter, setAppFilter] = useState<string>("all");
  
  // Chat Stats
  const [chatStats, setChatStats] = useState({
    totalMessages: 0,
    averageResponseTime: "1.2s",
    tokensUsed: 0,
    conversations: 0
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    setChatStats({
      totalMessages: messages.length,
      averageResponseTime: "1.2s",
      tokensUsed: messages.reduce((acc, msg) => acc + (msg.tokens || 0), 0),
      conversations: Math.ceil(messages.length / 4)
    });
  }, [messages]);

  const insights = [
    {
      title: "Usuários Mais Ativos",
      icon: Users,
      items: [
        "João Silva - 1.234 mensagens",
        "Maria Santos - 987 mensagens",
        "Pedro Costa - 856 mensagens",
        "Ana Oliveira - 723 mensagens",
        "Carlos Lima - 654 mensagens"
      ]
    },
    {
      title: "Canais com Mais Leads",
      icon: TrendingUp,
      items: [
        "Instagram: 45% (↑12%)",
        "WhatsApp: 32% (↑8%)",
        "Facebook: 15% (↓3%)",
        "Telegram: 8% (→)"
      ]
    },
    {
      title: "Sugestões de Retenção",
      icon: MessageSquare,
      items: [
        "15 usuários inativos há 7 dias",
        "8 assinaturas vencem em 3 dias",
        "Enviar campanha de reengajamento",
        "Ofertar upgrade de plano"
      ]
    }
  ];

  const getModePrompt = () => {
    switch (aiMode) {
      case "analysis":
        return "📊 Modo Análise: Focado em dados, métricas e insights quantitativos";
      case "support":
        return "🛟 Modo Suporte: Focado em resolver problemas e dar assistência técnica";
      case "strategic":
        return "🎯 Modo Estratégico: Focado em planejamento de longo prazo e decisões de negócio";
      default:
        return "";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      tokens: Math.floor(input.length / 4)
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    // Simular streaming de resposta
    const responses = {
      analysis: [
        "📊 **Análise de Dados Completa**\n\nIdentifiquei os seguintes pontos:\n\n1. **Usuários Inativos**: 15 usuários sem atividade há 7+ dias\n2. **Taxa de Conversão**: 12.3% (↑3% vs. média do setor)\n3. **Canal Principal**: Instagram com 45% dos leads\n4. **Receita Mensal**: R$ 48.750 (↑15% MoM)\n\n💡 **Recomendação**: Implementar campanha de reativação automática via WhatsApp para os inativos.",
        "📈 **Análise de Performance**\n\nMétricas dos últimos 30 dias:\n\n• **Engajamento**: +18% no Instagram\n• **Novos Leads**: 234 (↑22%)\n• **Churn Rate**: 3.2% (↓1.1%)\n• **LTV Médio**: R$ 3.450\n\n🎯 **Insight**: Usuários que usam automação de DMs tem 2.5x mais conversão.",
        "🔍 **Análise Preditiva**\n\nBaseado em machine learning:\n\n• **Risco de Churn**: 8 usuários com 72% de probabilidade\n• **Upgrade Potential**: 23 usuários prontos para plano superior\n• **Receita Projetada**: R$ 58.200 em 30 dias (+19%)\n\n⚡ **Ação Urgente**: Contatar os 8 usuários em risco nas próximas 48h."
      ],
      support: [
        "🛟 **Suporte Técnico**\n\nAnalisei o sistema e encontrei:\n\n✅ **Status Geral**: Todos os serviços operacionais\n⚠️ **Alertas**:\n- 3 webhooks com falha recente\n- 2 integrações precisam reautenticação\n- 1 edge function com latência elevada\n\n🔧 **Ações Sugeridas**:\n1. Reconfigurar webhooks\n2. Notificar usuários sobre reautenticação\n3. Otimizar edge function",
        "💬 **Análise de Tickets**\n\nÚltimas 24 horas:\n\n• **Tickets Abertos**: 12\n• **Tempo Médio de Resposta**: 1.2h\n• **Satisfação**: 4.7/5.0\n• **Problemas Comuns**:\n  - Integração Instagram (5)\n  - Dúvidas sobre planos (4)\n  - Bugs reportados (3)\n\n📋 **Recomendação**: Criar FAQ sobre integração do Instagram."
      ],
      strategic: [
        "🎯 **Planejamento Estratégico**\n\nVisão para os próximos 90 dias:\n\n**Mês 1 - Crescimento**\n• Lançar plano Enterprise\n• Expandir para TikTok\n• Campanha de indicação\n\n**Mês 2 - Consolidação**\n• Melhorar onboarding\n• Parcerias estratégicas\n• Webinars semanais\n\n**Mês 3 - Escala**\n• Automatizar CS\n• Launch internacional\n• Buscar funding\n\n📈 **Meta**: 2x MRR em 90 dias",
        "💼 **Oportunidades de Negócio**\n\nMercado identificou:\n\n🌟 **Alto Potencial**:\n1. **Agências de Marketing** (45% do mercado)\n2. **E-commerce** (30% crescimento/ano)\n3. **Influencers** (mercado de R$ 1.2B)\n\n💰 **Estratégia de Pricing**:\n- Plano Agência: R$ 997/mês\n- Add-ons Premium: +R$ 200-500\n- White Label: R$ 5.000/mês\n\n🚀 **ROI Projetado**: 340% em 12 meses"
      ]
    };

    const modeResponses = responses[aiMode];
    const selectedResponse = modeResponses[Math.floor(Math.random() * modeResponses.length)];
    
    // Simular streaming caractere por caractere
    let currentContent = "";
    const assistantMessageId = Date.now().toString() + "-assistant";
    
    for (let i = 0; i < selectedResponse.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      currentContent += selectedResponse[i];
      
      setMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === assistantMessageId);
        const newMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: currentContent,
          timestamp: new Date(),
          sentiment: "positive",
          tokens: Math.floor(currentContent.length / 4)
        };
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newMessage;
          return updated;
        }
        return [...prev, newMessage];
      });
    }

    setIsLoading(false);
    setIsStreaming(false);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        role: "system",
        content: "🤖 Sou o assistente administrativo do Social Flow com IA avançada. Posso analisar dados, sugerir estratégias e ajudar em decisões complexas. Como posso ajudar você hoje?",
        timestamp: new Date(),
        sentiment: "positive"
      }
    ]);
    toast.success("Histórico limpo!");
  };

  const handleExportChat = () => {
    const chatContent = messages.map(m => 
      `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`
    ).join("\n\n");
    
    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${Date.now()}.txt`;
    a.click();
    toast.success("Chat exportado com sucesso!");
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !messageSubject.trim()) {
      toast.error("Preencha assunto e conteúdo da mensagem");
      return;
    }

    // Aqui você implementaria a lógica real de envio
    // Por enquanto, vamos simular
    
    toast.success(`Mensagem agendada para envio via ${messageType}!`, {
      description: scheduledDate 
        ? `Será enviada em ${new Date(scheduledDate).toLocaleString()}`
        : "Será enviada imediatamente"
    });

    setMessageContent("");
    setMessageSubject("");
    setScheduledDate("");
  };

  const loadTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessageSubject(template.subject);
    setMessageContent(template.content);
  };

  const suggestedQuestions = [
    "Qual o status das assinaturas?",
    "Quais usuários estão inativos?",
    "Como está a conversão dos leads?",
    "Sugestões de melhoria?"
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
              IA Operacional Avançada
            </h1>
            <p className="text-muted-foreground mt-1">Assistente estratégico com IA de última geração</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Brain className="h-3 w-3" />
              GPT-5 Turbo
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              {chatStats.tokensUsed} tokens
            </Badge>
          </div>
        </div>

        {/* App Filter */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={appFilter} onValueChange={setAppFilter}>
                <SelectTrigger className="w-[250px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Filtrar por Aplicação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Aplicações</SelectItem>
                  <SelectItem value="social_flow">Social Flow</SelectItem>
                  <SelectItem value="intelligent_agent">Intelligent Agent</SelectItem>
                </SelectContent>
              </Select>
              {appFilter !== "all" && (
                <Badge variant="outline" className="gap-1">
                  {appFilter === "social_flow" ? "📱 Social Flow" : "🤖 Intelligent Agent"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat IA
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <Mail className="h-4 w-4" />
              Sistema de Mensagens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mensagens</p>
                      <p className="text-2xl font-bold">{chatStats.totalMessages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo Médio</p>
                      <p className="text-2xl font-bold">{chatStats.averageResponseTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Brain className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tokens</p>
                      <p className="text-2xl font-bold">{chatStats.tokensUsed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversas</p>
                      <p className="text-2xl font-bold">{chatStats.conversations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat */}
              <Card className="lg:col-span-2 bg-card border-border flex flex-col h-[600px]">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Assistente IA Avançado</CardTitle>
                        <p className="text-sm text-muted-foreground">{getModePrompt()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleExportChat}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearChat}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={aiMode === "analysis" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAiMode("analysis")}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Análise
                    </Button>
                    <Button
                      variant={aiMode === "support" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAiMode("support")}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Suporte
                    </Button>
                    <Button
                      variant={aiMode === "strategic" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAiMode("strategic")}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Estratégico
                    </Button>
                  </div>
                </CardHeader>
          
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} group`}
                      >
                        <div className="flex flex-col gap-1 max-w-[85%]">
                          <div
                            className={`rounded-lg p-4 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : message.role === "system"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-muted"
                            }`}
                          >
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {message.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">
                                  {line.startsWith('**') && line.endsWith('**') ? (
                                    <strong>{line.slice(2, -2)}</strong>
                                  ) : line.startsWith('•') || line.startsWith('-') ? (
                                    <span className="ml-2">{line}</span>
                                  ) : (
                                    line
                                  )}
                                </p>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                            {message.tokens && <span>• {message.tokens} tokens</span>}
                            {message.sentiment && (
                              <Badge variant="outline" className="text-xs">
                                {message.sentiment === "positive" ? "😊" : message.sentiment === "negative" ? "😟" : "😐"}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                toast.success("Mensagem copiada!");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(question);
                          setTimeout(() => handleSend(), 100);
                        }}
                        className="text-xs"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                      placeholder="Faça uma pergunta sobre o sistema..."
                      disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                      {isStreaming ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Insights Sidebar */}
              <div className="space-y-4">
                {insights.map((insight, index) => {
                  const Icon = insight.icon;
                  return (
                    <Card key={index} className="bg-card border-border">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {insight.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="text-sm p-2 bg-muted rounded border border-border"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Message Composer */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Criar Mensagem</CardTitle>
                      <CardDescription>Envie mensagens personalizadas para seus usuários</CardDescription>
                    </div>
                    <Select value={messageType} onValueChange={(v: any) => setMessageType(v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            E-mail
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Destinatários</Label>
                    <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os usuários</SelectItem>
                        <SelectItem value="active">Usuários ativos</SelectItem>
                        <SelectItem value="inactive">Usuários inativos (7+ dias)</SelectItem>
                        <SelectItem value="trial">Usuários em trial</SelectItem>
                        <SelectItem value="premium">Usuários premium</SelectItem>
                        <SelectItem value="expired">Assinaturas expiradas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assunto</Label>
                    <Input
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      placeholder="Digite o assunto da mensagem..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Digite o conteúdo da mensagem..."
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Você pode usar variáveis: {'{'}{'{'} nome {'}'}{'}'},  {'{'}{'{'} email {'}'}{'}'},  {'{'}{'{'} plano {'}'}{'}'}, etc.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Agendar Envio (Opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSendMessage} className="flex-1">
                      {scheduledDate ? (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar Envio
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Agora
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setMessageContent("");
                      setMessageSubject("");
                      setScheduledDate("");
                    }}>
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Templates Sidebar */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Templates</CardTitle>
                    <CardDescription>Selecione um template pronto</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {templates.map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => loadTemplate(template)}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {template.type === "welcome" && <Bell className="h-4 w-4 text-green-500" />}
                            {template.type === "warning" && <Bell className="h-4 w-4 text-yellow-500" />}
                            {template.type === "promotion" && <Sparkles className="h-4 w-4 text-purple-500" />}
                            <span className="font-medium">{template.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{template.subject}</span>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Enviadas hoje</span>
                      <span className="font-bold">245</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Taxa de abertura</span>
                      <span className="font-bold text-green-500">68%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Taxa de clique</span>
                      <span className="font-bold text-blue-500">24%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Agendadas</span>
                      <span className="font-bold text-yellow-500">12</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
