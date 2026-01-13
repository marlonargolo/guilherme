import { useState, useEffect, useRef } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MessageSquare, Clock, CheckCircle, AlertCircle, Send, Bot, User, Zap, Loader2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { AppBadge } from "@/components/super-admin/AppBadge";

interface Message {
  id: string;
  sender: "user" | "admin" | "ai";
  content: string;
  timestamp: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: "new" | "in_progress" | "resolved" | "urgent";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  assignedAdmin?: string;
  messages: Message[];
  aiHandled: boolean;
  appType: string[];
}

const statusColors = {
  new: "bg-primary/10 text-primary border-primary/20 shadow-glow-sm",
  in_progress: "bg-accent/10 text-accent border-accent/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20 animate-pulse",
};

const statusLabels = { new: "Novo", in_progress: "Em Andamento", resolved: "Resolvido", urgent: "Urgente" };
const priorityColors = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-accent/10 text-accent border-accent/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};
const priorityLabels = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };

export default function Suporte() {
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: "TKT-001", userId: "1", userName: "João Silva", userEmail: "joao@empresa.com", subject: "Problema com integração", status: "urgent", priority: "urgent", createdAt: "2025-10-21 14:30", messages: [{ id: "1", sender: "user", content: "Não consigo conectar Instagram.", timestamp: "2025-10-21 14:30" }], aiHandled: false, appType: ["social_flow"] },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // AI Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState("");

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, streamingMessage]);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = t.userName.toLowerCase().includes(searchTerm.toLowerCase()) || t.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAIResponse = async () => {
    if (!selectedTicket) return;
    setIsLoadingAI(true);
    try {
      const { data } = await supabase.functions.invoke('chat-ia', { body: { messages: [{ role: "user", content: selectedTicket.subject }] } });
      const aiMessage: Message = { id: Date.now().toString(), sender: "ai", content: data?.response || "Resposta da IA", timestamp: new Date().toLocaleString('pt-BR') };
      setSelectedTicket(prev => prev ? { ...prev, messages: [...prev.messages, aiMessage] } : null);
      toast.success("IA respondeu!");
    } catch (error) {
      toast.error("Erro ao gerar resposta");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAssignToHuman = () => {
    toast.success("Escalado para suporte humano!");
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      const conversationHistory = chatMessages.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('chat-ia', {
        body: {
          messages: [
            ...conversationHistory,
            { role: "user", content: userMessage.content }
          ]
        }
      });

      if (error) throw error;

      const aiResponse = data?.response || "Desculpe, não consegui processar sua mensagem.";
      
      // Simulate streaming effect
      let currentText = "";
      const words = aiResponse.split(" ");
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? " " : "") + words[i];
        setStreamingMessage(currentText);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage("");

    } catch (error) {
      console.error('Chat error:', error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8 p-1">
        {/* Header elegante */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent mb-2">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground">Assistente inteligente com IA para atendimento</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm shadow-glow-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered
          </Badge>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Chat - Principal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="glass-card border-border/50 overflow-hidden h-[calc(100vh-16rem)]">
              <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
                <CardTitle className="text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Assistente Virtual</div>
                    <div className="text-xs text-muted-foreground font-normal">Sempre disponível para ajudar</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[calc(100%-5rem)]">
                <ScrollArea className="flex-1 p-6" ref={chatScrollRef}>
                  <AnimatePresence mode="popLayout">
                    {chatMessages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center justify-center h-full text-center py-20"
                      >
                        <motion.div 
                          animate={{ 
                            boxShadow: [
                              "0 0 20px rgba(var(--primary-rgb), 0.3)",
                              "0 0 40px rgba(var(--primary-rgb), 0.5)",
                              "0 0 20px rgba(var(--primary-rgb), 0.3)",
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center mb-6"
                        >
                          <Bot className="w-12 h-12 text-primary-foreground" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          Olá! Como posso ajudar?
                        </h3>
                        <p className="text-muted-foreground max-w-md leading-relaxed">
                          Estou aqui para auxiliar com tickets, consultas sobre usuários e qualquer dúvida sobre a plataforma.
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-4 rounded-xl glass-card border border-border/50 text-left hover:border-primary/30 transition-all group"
                            onClick={() => {
                              setChatInput("Mostrar tickets urgentes");
                            }}
                          >
                            <AlertCircle className="w-5 h-5 text-destructive mb-2 group-hover:scale-110 transition-transform" />
                            <div className="text-sm font-medium text-foreground">Tickets Urgentes</div>
                            <div className="text-xs text-muted-foreground">Ver casos críticos</div>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="p-4 rounded-xl glass-card border border-border/50 text-left hover:border-primary/30 transition-all group"
                            onClick={() => {
                              setChatInput("Estatísticas de hoje");
                            }}
                          >
                            <Zap className="w-5 h-5 text-accent mb-2 group-hover:scale-110 transition-transform" />
                            <div className="text-sm font-medium text-foreground">Estatísticas</div>
                            <div className="text-xs text-muted-foreground">Métricas do dia</div>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`flex gap-3 mb-6 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-glow-sm"
                          >
                            <Bot className="w-5 h-5 text-primary" />
                          </motion.div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-3xl px-5 py-4 ${
                            msg.role === "user"
                              ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-glow"
                              : "glass-card border border-border/50 text-foreground"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-2 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {msg.role === "user" && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0"
                          >
                            <User className="w-5 h-5 text-blue-400" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}

                    {streamingMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 mb-6"
                      >
                        <motion.div 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-glow-sm"
                        >
                          <Bot className="w-5 h-5 text-primary" />
                        </motion.div>
                        <div className="max-w-[75%] rounded-3xl px-5 py-4 glass-card border border-border/50 text-foreground">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingMessage}</p>
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="inline-block w-2 h-4 bg-primary ml-1"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ScrollArea>

                <div className="border-t border-border/50 p-4 bg-card/50 backdrop-blur">
                  <div className="flex gap-3">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChatMessage();
                        }
                      }}
                      placeholder="Digite sua mensagem... (Enter para enviar)"
                      className="min-h-[56px] glass-card border-border/50 text-foreground resize-none focus:border-primary/50 transition-colors"
                      disabled={isStreaming}
                    />
                    <Button
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || isStreaming}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all px-8"
                    >
                      {isStreaming ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Use Shift + Enter para nova linha
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar - Tickets */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-card border-border/50 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>TICKETS ATIVOS</span>
                    <Badge variant="secondary" className="rounded-full">
                      {tickets.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {tickets.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="glass-card border-border/50">
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 glass-card border-border/50 text-foreground focus:border-primary/50 transition-colors"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">FILA DE TICKETS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {filteredTickets.map((t, idx) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className="p-4 glass-card border border-border/50 rounded-xl hover:border-primary/30 cursor-pointer transition-all group"
                        onClick={() => setSelectedTicket(t)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-1">
                            <span className="text-xs font-mono font-bold text-primary block">Ticket: {t.id.substring(0, 12)}...</span>
                            <span className="text-xs font-mono text-muted-foreground block">User: {t.userId.substring(0, 12)}...</span>
                          </div>
                          <Badge className={`${statusColors[t.status]} text-xs`}>
                            {statusLabels[t.status]}
                          </Badge>
                        </div>
                        <p className="font-medium text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                          {t.userName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mb-2">{t.userEmail}</p>
                        <div className="mb-2">
                          <AppBadge appTypes={t.appType} size="sm" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.createdAt}
                          </span>
                          <Badge variant="outline" className={priorityColors[t.priority]}>
                            {priorityLabels[t.priority]}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                    {filteredTickets.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">Nenhum ticket encontrado</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <SheetContent className="glass-card border-border/50 w-[700px] sm:max-w-[700px]">
          {selectedTicket && (
            <>
              <SheetHeader className="border-b border-border/50 pb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-foreground text-xl mb-1">
                      {selectedTicket.userName}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground mb-2">{selectedTicket.userEmail}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="font-mono text-xs">{selectedTicket.id}</Badge>
                      <Badge className={statusColors[selectedTicket.status]}>
                        {statusLabels[selectedTicket.status]}
                      </Badge>
                      <Badge variant="outline" className={priorityColors[selectedTicket.priority]}>
                        {priorityLabels[selectedTicket.priority]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                <div className="glass-card p-4 rounded-xl border border-border/50">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Assunto</h3>
                  <p className="text-sm text-muted-foreground">{selectedTicket.subject}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de Mensagens</h3>
                  <ScrollArea className="h-[350px] glass-card rounded-xl p-4 border border-border/50">
                    <AnimatePresence>
                      {selectedTicket.messages.map((m, idx) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="mb-4 last:mb-0"
                        >
                          <div className={`p-4 rounded-2xl ${
                            m.sender === "ai" 
                              ? "bg-primary/5 border border-primary/10" 
                              : m.sender === "user"
                              ? "bg-blue-500/5 border border-blue-500/10"
                              : "bg-emerald-500/5 border border-emerald-500/10"
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {m.sender === "ai" ? (
                                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                                  <Bot className="h-3 w-3 text-primary" />
                                </div>
                              ) : m.sender === "user" ? (
                                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                  <User className="h-3 w-3 text-blue-400" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                  <AlertCircle className="h-3 w-3 text-emerald-400" />
                                </div>
                              )}
                              <span className="text-xs font-medium text-foreground">
                                {m.sender === "ai" ? "Assistente IA" : m.sender === "user" ? "Cliente" : "Suporte"}
                              </span>
                              <span className="text-xs text-muted-foreground ml-auto">{m.timestamp}</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{m.content}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </ScrollArea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleAIResponse}
                    disabled={isLoadingAI}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all"
                  >
                    {isLoadingAI ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Bot className="mr-2 h-4 w-4" />
                        Resposta IA
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAssignToHuman}
                    variant="outline"
                    size="lg"
                    className="glass-card border-border/50 hover:border-accent/50 transition-colors"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Suporte Humano
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SuperAdminLayout>
  );
}