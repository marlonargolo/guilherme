import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, CheckCircle2, Clock, MessageSquare, User, Mail, Calendar, Sparkles, TrendingUp, Zap, Bot, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

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
  urgent: "Urgente",
};

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
};

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadTickets();

    const channel = supabase
      .channel("support-tickets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        loadTickets
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTickets = async () => {
    try {
      const { data: ticketsData, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ticketsWithProfiles = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", ticket.user_id)
            .single();

          return {
            ...ticket,
            status: ticket.status as "new" | "in_progress" | "resolved" | "urgent",
            priority: ticket.priority as "low" | "medium" | "high" | "urgent",
            profiles: profile,
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

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_type: "admin",
        content: replyMessage,
      });

      if (error) throw error;

      await supabase
        .from("support_tickets")
        .update({ status: "in_progress" })
        .eq("id", selectedTicket.id);

      toast.success("Resposta enviada!");
      setReplyMessage("");
      setSelectedTicket(null);
      loadTickets();
    } catch (error) {
      console.error("Error replying:", error);
      toast.error("Erro ao enviar resposta");
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Status atualizado!");
      loadTickets();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const newTickets = tickets.filter((t) => t.status === "new").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedTickets = tickets.filter((t) => t.status === "resolved").length;
  const avgResponseTime = "2.4h";

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Tickets de Suporte
              </h1>
              <p className="text-muted-foreground mt-1">Central de atendimento e resolução</p>
            </div>
          </div>

          <Badge className="flex items-center gap-2 px-4 py-2" variant="outline">
            <Sparkles className="h-4 w-4 text-blue-400" />
            {newTickets} Novos
          </Badge>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Novos</p>
                    <p className="text-3xl font-bold text-blue-400">{newTickets}</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-blue-400" />
                      <span className="text-xs text-muted-foreground">Aguardando</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 bg-opacity-10">
                    <AlertCircle className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Em Andamento</p>
                    <p className="text-3xl font-bold text-yellow-400">{inProgressTickets}</p>
                    <Progress value={(inProgressTickets / tickets.length) * 100} className="h-1.5" />
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 bg-opacity-10">
                    <Zap className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Resolvidos</p>
                    <p className="text-3xl font-bold text-green-400">{resolvedTickets}</p>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-400 font-semibold">Finalizados</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 bg-opacity-10">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-card border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-3xl font-bold text-purple-400">{avgResponseTime}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-purple-400" />
                      <span className="text-xs text-muted-foreground">resposta</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-opacity-10">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px] bg-background/50 border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Novos</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                  <SelectItem value="urgent">Urgentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-6">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredTickets.map((ticket, idx) => (
                      <motion.tr
                        key={ticket.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.03 }}
                        className="cursor-pointer hover:bg-accent/30 border-border/50 transition-colors"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{ticket.profiles?.name || "Usuário"}</p>
                              <p className="text-xs text-muted-foreground">
                                {ticket.profiles?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border/50">
                            {ticket.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[ticket.status]}>
                            {statusLabels[ticket.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[ticket.priority]}>
                            {priorityLabels[ticket.priority]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicket(ticket);
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Ver
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Ticket Details Sheet */}
        <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <SheetContent className="glass-card border-primary/20 w-[600px]">
            {selectedTicket && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-foreground flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Detalhes do Ticket
                  </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-220px)] mt-6">
                  <div className="space-y-4">
                    {/* User Info */}
                    <Card className="glass-card border-primary/20">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {selectedTicket.profiles?.name || "Usuário"}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {selectedTicket.profiles?.email}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Select
                              value={selectedTicket.status}
                              onValueChange={(value) =>
                                handleStatusChange(selectedTicket.id, value)
                              }
                            >
                              <SelectTrigger className="w-[150px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">Novo</SelectItem>
                                <SelectItem value="in_progress">Em Andamento</SelectItem>
                                <SelectItem value="resolved">Resolvido</SelectItem>
                                <SelectItem value="urgent">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Prioridade:</span>
                            <Badge className={priorityColors[selectedTicket.priority]}>
                              {priorityLabels[selectedTicket.priority]}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Categoria:</span>
                            <Badge variant="outline">{selectedTicket.category}</Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Data:</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(selectedTicket.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ticket Content */}
                    <Card className="glass-card border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedTicket.message}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Reply Section */}
                    <Card className="glass-card border-accent/20">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bot className="h-5 w-5 text-accent" />
                          Responder Ticket
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Digite sua resposta..."
                          className="min-h-[120px] bg-background/50 border-border resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleReply}
                            disabled={!replyMessage.trim() || sendingReply}
                            className="flex-1 gap-2"
                          >
                            {sendingReply ? (
                              <>
                                <Bot className="h-4 w-4 animate-pulse" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Enviar Resposta
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </SuperAdminLayout>
  );
}
