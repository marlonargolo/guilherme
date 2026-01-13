import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Ticket, Send, Loader2, CheckCircle2, User, Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender_type: "user" | "admin";
  content: string;
  created_at: string;
  read: boolean;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels = {
  new: "Novo",
  in_progress: "Em Andamento",
  resolved: "Resolvido",
  urgent: "Urgente"
};

export default function Suporte() {
  const [activeTab, setActiveTab] = useState("tickets");
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Ticket states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  useEffect(() => {
    loadChatMessages();
    loadTickets();

    // Realtime chat subscription
    const chatChannel = supabase
      .channel('user-live-chat')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'live_chat_messages' },
        (payload) => {
          if (payload.new && (payload.new as any).sender_type === 'admin') {
            loadChatMessages();
          }
        }
      )
      .subscribe();

    // Realtime ticket subscription
    const ticketChannel = supabase
      .channel('user-tickets')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => loadTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const loadChatMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const typedMessages = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as "user" | "admin"
      }));
      
      setChatMessages(typedMessages);
    } catch (error) {
      console.error("Error loading chat messages:", error);
    }
  };

  const loadTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from('live_chat_messages').insert({
        user_id: user.id,
        sender_id: user.id,
        sender_type: 'user',
        content: chatInput,
        read: false
      });

      if (error) throw error;

      setChatInput("");
      toast.success("Mensagem enviada! Aguarde a resposta do suporte.");
      loadChatMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketCategory || !ticketMessage.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSubmittingTicket(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: ticketSubject,
        category: ticketCategory,
        message: ticketMessage,
        priority: ticketPriority,
        status: 'new'
      });

      if (error) throw error;

      toast.success("Ticket criado com sucesso! Nossa equipe responderá em breve.");
      setTicketSubject("");
      setTicketCategory("");
      setTicketMessage("");
      setTicketPriority("medium");
      loadTickets();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Erro ao criar ticket");
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
          Central de Suporte
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-card border-border/50 p-1">
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              Meus Tickets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <Card className="glass-card border-accent/20">
              <CardHeader className="border-b border-border/50">
                <CardTitle>Criar Novo Ticket</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Assunto *</label>
                  <Input
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Descreva brevemente o problema"
                    className="bg-background/50 border-border/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoria *</label>
                    <Select value={ticketCategory} onValueChange={setTicketCategory}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Técnico</SelectItem>
                        <SelectItem value="billing">Financeiro</SelectItem>
                        <SelectItem value="feature">Funcionalidade</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Prioridade</label>
                    <Select value={ticketPriority} onValueChange={setTicketPriority}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição *</label>
                  <Textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Descreva detalhadamente seu problema ou dúvida..."
                    className="min-h-[120px] bg-background/50 border-border/50"
                  />
                </div>

                <Button
                  onClick={handleSubmitTicket}
                  disabled={submittingTicket}
                  className="w-full btn-glow"
                >
                  {submittingTicket ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando Ticket...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Criar Ticket
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader className="border-b border-border/50">
                <CardTitle>Histórico de Tickets</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {tickets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ticket criado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 glass-card border-border/50 rounded-lg hover-scale"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground">{ticket.category}</p>
                          </div>
                          <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                            {statusLabels[ticket.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {ticket.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
