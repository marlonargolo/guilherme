import { useState, useEffect, useRef } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Search, Bot, User, Sparkles, Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "urgent";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  profiles?: { name: string; email: string };
}

interface LiveChatUser {
  user_id: string;
  user_name: string;
  user_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender_type: "user" | "admin";
  content: string;
  created_at: string;
  read: boolean;
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels = { new: "Novo", in_progress: "Em Andamento", resolved: "Resolvido", urgent: "Urgente" };

export default function SuporteNovo() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Live Chat
  const [liveChatUsers, setLiveChatUsers] = useState<LiveChatUser[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
    loadLiveChats();

    // Realtime subscriptions
    const ticketsChannel = supabase
      .channel('support-tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, loadTickets)
      .subscribe();

    const chatChannel = supabase
      .channel('live-chat-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages' }, (payload) => {
        if (payload.new && selectedChatUser && (payload.new as any).user_id === selectedChatUser) {
          loadChatMessages(selectedChatUser);
        }
        loadLiveChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [selectedChatUser]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const loadTickets = async () => {
    try {
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load profiles separately
      const ticketsWithProfiles = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', ticket.user_id)
            .single();

          return {
            ...ticket,
            status: ticket.status as "new" | "in_progress" | "resolved" | "urgent",
            priority: ticket.priority as "low" | "medium" | "high" | "urgent",
            profiles: profile
          };
        })
      );

      setTickets(ticketsWithProfiles);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadLiveChats = async () => {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('user_id, sender_type, content, created_at, read')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by user and get latest message
      const usersMap = new Map<string, LiveChatUser>();
      
      for (const msg of data || []) {
        if (!usersMap.has(msg.user_id)) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', msg.user_id)
            .single();

          const unreadCount = (data || []).filter(
            m => m.user_id === msg.user_id && m.sender_type === 'user' && !m.read
          ).length;

          usersMap.set(msg.user_id, {
            user_id: msg.user_id,
            user_name: profile?.name || 'Usuário',
            user_email: profile?.email || '',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: unreadCount
          });
        }
      }

      setLiveChatUsers(Array.from(usersMap.values()));
    } catch (error) {
      console.error("Error loading live chats:", error);
    }
  };

  const loadChatMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as "user" | "admin"
      }));
      
      setChatMessages(typedMessages);

      // Mark as read
      await supabase
        .from('live_chat_messages')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('sender_type', 'user')
        .eq('read', false);

      loadLiveChats();
    } catch (error) {
      console.error("Error loading chat messages:", error);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedChatUser) return;

    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from('live_chat_messages').insert({
        user_id: selectedChatUser,
        sender_id: user.id,
        sender_type: 'admin',
        content: chatInput,
        read: false
      });

      if (error) throw error;

      setChatInput("");
      loadChatMessages(selectedChatUser);
      toast.success("Mensagem enviada!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReplyTicket = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from('support_ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_type: 'admin',
        content: replyMessage
      });

      if (error) throw error;

      await supabase
        .from('support_tickets')
        .update({ status: 'in_progress' })
        .eq('id', selectedTicket.id);

      toast.success("Resposta enviada!");
      setReplyMessage("");
      setSelectedTicket(null);
      loadTickets();
    } catch (error) {
      console.error("Error replying ticket:", error);
      toast.error("Erro ao responder ticket");
    }
  };

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Central de Suporte
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie tickets e chat ao vivo</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" />
            Sistema Integrado
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets */}
          <Card className="lg:col-span-2 glass-card border-primary/20">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Tickets de Suporte
                </CardTitle>
                <Badge variant="outline" className="border-primary/30">
                  {tickets.filter(t => t.status === 'new').length} novos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/50 border-border/50"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead>Usuário</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover:bg-accent/50 border-border/50"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <TableCell className="font-medium">
                            {ticket.profiles?.name || 'Usuário'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {ticket.subject}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[ticket.status]}>
                              {statusLabels[ticket.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Live Chat Users */}
          <Card className="glass-card border-accent/20">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-accent" />
                Chat ao Vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[580px]">
                {liveChatUsers.map((chatUser) => (
                  <div
                    key={chatUser.user_id}
                    className={`p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-accent/30 ${
                      selectedChatUser === chatUser.user_id ? 'bg-accent/20' : ''
                    }`}
                    onClick={() => {
                      setSelectedChatUser(chatUser.user_id);
                      loadChatMessages(chatUser.user_id);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{chatUser.user_name}</span>
                      {chatUser.unread_count > 0 && (
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          {chatUser.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chatUser.last_message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(chatUser.last_message_time).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Messages Sheet */}
        <Sheet open={!!selectedChatUser} onOpenChange={() => setSelectedChatUser(null)}>
          <SheetContent className="glass-card border-accent/20 w-[500px]">
            <SheetHeader>
              <SheetTitle className="text-foreground">
                {liveChatUsers.find(u => u.user_id === selectedChatUser)?.user_name}
              </SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(100vh-200px)] mt-6" ref={chatScrollRef}>
              <AnimatePresence mode="popLayout">
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 mb-4 ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender_type === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-accent" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.sender_type === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent/20 text-foreground border border-accent/30'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-2">
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {msg.sender_type === 'admin' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChatMessage();
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="min-h-[60px] bg-background/50 border-border/50 resize-none"
                disabled={sendingMessage}
              />
              <Button
                onClick={handleSendChatMessage}
                disabled={!chatInput.trim() || sendingMessage}
                className="px-6"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Ticket Detail Sheet */}
        <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <SheetContent className="glass-card border-primary/20 w-[500px]">
            {selectedTicket && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-foreground">{selectedTicket.subject}</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Usuário</p>
                    <p className="font-medium">{selectedTicket.profiles?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.profiles?.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <Badge variant="outline" className="mt-1">{selectedTicket.category}</Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Mensagem</p>
                    <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                      <p className="text-sm">{selectedTicket.message}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Responder</p>
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="min-h-[100px] bg-background/50 border-border/50"
                    />
                  </div>

                  <Button
                    onClick={handleReplyTicket}
                    disabled={!replyMessage.trim()}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Resposta
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </SuperAdminLayout>
  );
}