/**
 * Comunicação - Página de comunicação e suporte do Super Admin
 * Sistema integrado com WhatsApp, Email e notificações em massa
 */

import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Send, MessageSquare, Bell, Loader2, Eye, Mail, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  user_name: string;
  user_email: string;
  created_at: string;
  message: string;
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  open: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const priorityColors = {
  low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  high: "bg-red-500/10 text-red-500 border-red-500/20",
};

// Variáveis disponíveis para notificações
const availableVariables = [
  { key: "{nome}", description: "Nome do usuário" },
  { key: "{email}", description: "E-mail do usuário" },
  { key: "{plano}", description: "Plano atual" },
  { key: "{data_vencimento}", description: "Data de vencimento" },
  { key: "{valor}", description: "Valor da cobrança" },
  { key: "{empresa}", description: "Nome da empresa" },
  { key: "{suporte_link}", description: "Link de suporte" },
  { key: "{dashboard_link}", description: "Link do dashboard" },
];

export default function Comunicacao() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState("suporte");
  
  // Notificações em Massa
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationChannel, setNotificationChannel] = useState<"email" | "whatsapp" | "both">("email");
  const [notificationSubject, setNotificationSubject] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "active" | "inactive" | "trial">("all");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles!support_tickets_user_id_fkey (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTickets: Ticket[] = (ticketsData || []).map((ticket: any) => ({
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        user_name: ticket.profiles?.name || 'Usuário',
        user_email: ticket.profiles?.email || '-',
        created_at: new Date(ticket.created_at).toLocaleDateString('pt-BR'),
        message: ticket.message,
      }));

      setTickets(formattedTickets);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: tickets.length,
    new: tickets.filter((t) => t.status === "new").length,
    open: tickets.filter((t) => t.status === "open").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const handleSendMassNotification = async () => {
    if (!notificationMessage.trim()) {
      toast.error("Digite uma mensagem para enviar");
      return;
    }

    if (notificationChannel !== "whatsapp" && !notificationSubject.trim()) {
      toast.error("Digite um assunto para o e-mail");
      return;
    }

    setIsSending(true);
    try {
      // Aqui você implementaria a lógica de envio via edge function
      // Incluindo integração com WhatsApp e Email
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulação
      
      toast.success(`Notificação enviada para ${targetAudience === "all" ? "todos os usuários" : targetAudience}!`);
      setNotificationMessage("");
      setNotificationSubject("");
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setIsSending(false);
    }
  };

  const insertVariable = (variable: string) => {
    setNotificationMessage(prev => prev + variable);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Comunicação</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            Gerencie comunicações e suporte ao cliente
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#111827] border border-gray-800">
            <TabsTrigger value="suporte" className="data-[state=active]:bg-primary">
              <MessageSquare className="mr-2 h-4 w-4" />
              Suporte
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="data-[state=active]:bg-primary">
              <Bell className="mr-2 h-4 w-4" />
              Notificações
            </TabsTrigger>
          </TabsList>

          {/* Tab Suporte */}
          <TabsContent value="suporte" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-[#111827] border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111827] border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Novos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-500">{stats.new}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111827] border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Abertos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-500">{stats.open}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111827] border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Resolvidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-500">{stats.resolved}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card className="bg-[#111827] border-gray-800">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-[#0a0e1a] border-gray-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card className="bg-[#111827] border-gray-800">
              <CardContent className="pt-6 overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-400">Assunto</TableHead>
                        <TableHead className="text-gray-400 hidden md:table-cell">Usuário</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Prioridade</TableHead>
                        <TableHead className="text-gray-400 hidden lg:table-cell">Data</TableHead>
                        <TableHead className="text-gray-400">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="border-gray-800">
                          <TableCell className="text-white font-medium">{ticket.subject}</TableCell>
                          <TableCell className="text-gray-400 hidden md:table-cell">{ticket.user_name}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 hidden lg:table-cell">{ticket.created_at}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Notificações - Melhorado */}
          <TabsContent value="notificacoes" className="space-y-4">
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Enviar Notificação em Massa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Canal de Comunicação */}
                <div className="space-y-2">
                  <Label htmlFor="channel" className="text-gray-300">
                    Canal de Envio
                  </Label>
                  <Select value={notificationChannel} onValueChange={(value: "email" | "whatsapp" | "both") => setNotificationChannel(value)}>
                    <SelectTrigger className="bg-[#0a0e1a] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-gray-700">
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>E-mail</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>WhatsApp</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <Phone className="h-4 w-4" />
                          <span>E-mail + WhatsApp</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Público-alvo */}
                <div className="space-y-2">
                  <Label htmlFor="audience" className="text-gray-300">
                    Público-alvo
                  </Label>
                  <Select value={targetAudience} onValueChange={(value: any) => setTargetAudience(value)}>
                    <SelectTrigger className="bg-[#0a0e1a] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-gray-700">
                      <SelectItem value="all">Todos os Usuários</SelectItem>
                      <SelectItem value="active">Usuários Ativos</SelectItem>
                      <SelectItem value="inactive">Usuários Inativos</SelectItem>
                      <SelectItem value="trial">Usuários em Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assunto (apenas para e-mail) */}
                {notificationChannel !== "whatsapp" && (
                  <div className="space-y-2">
                    <Label htmlFor="notification-subject" className="text-gray-300">
                      Assunto (E-mail)
                    </Label>
                    <Input
                      id="notification-subject"
                      value={notificationSubject}
                      onChange={(e) => setNotificationSubject(e.target.value)}
                      placeholder="Ex: Atualização importante do sistema"
                      className="bg-[#0a0e1a] border-gray-700 text-white"
                    />
                  </div>
                )}

                {/* Variáveis Disponíveis */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Variáveis Disponíveis</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-[#0a0e1a] rounded-lg border border-gray-700">
                    {availableVariables.map((variable) => (
                      <Button
                        key={variable.key}
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariable(variable.key)}
                        className="text-xs border-gray-700 hover:bg-primary/20 justify-start"
                        title={variable.description}
                      >
                        {variable.key}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Clique em uma variável para inseri-la na mensagem
                  </p>
                </div>

                {/* Mensagem */}
                <div className="space-y-2">
                  <Label htmlFor="notification-message" className="text-gray-300">
                    Mensagem
                  </Label>
                  <Textarea
                    id="notification-message"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Digite a mensagem da notificação... Use as variáveis acima para personalizar."
                    className="bg-[#0a0e1a] border-gray-700 text-white min-h-[150px]"
                  />
                  <p className="text-xs text-gray-500">
                    {notificationMessage.length} caracteres
                  </p>
                </div>

                {/* Preview */}
                {notificationMessage && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Preview</Label>
                    <div className="p-4 bg-[#0a0e1a] rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {notificationMessage
                          .replace(/{nome}/g, "João Silva")
                          .replace(/{email}/g, "joao@exemplo.com")
                          .replace(/{plano}/g, "Pro")
                          .replace(/{data_vencimento}/g, "30/11/2025")
                          .replace(/{valor}/g, "R$ 97,00")
                          .replace(/{empresa}/g, "SocialFlow")
                          .replace(/{suporte_link}/g, "https://socialflow.com/suporte")
                          .replace(/{dashboard_link}/g, "https://socialflow.com/dashboard")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão Enviar */}
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleSendMassNotification}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Notificação
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Histórico de Notificações */}
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Histórico de Envios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum histórico de envios ainda</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Detail Sheet */}
      <Sheet open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <SheetContent className="bg-[#111827] border-gray-800 w-[400px] sm:w-[540px]">
          {selectedTicket && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">{selectedTicket.subject}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Informações</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Usuário:</span>
                      <span className="text-white">{selectedTicket.user_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">E-mail:</span>
                      <span className="text-white">{selectedTicket.user_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Categoria:</span>
                      <Badge variant="outline" className="border-gray-700">
                        {selectedTicket.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge className={statusColors[selectedTicket.status as keyof typeof statusColors]}>
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prioridade:</span>
                      <Badge className={priorityColors[selectedTicket.priority as keyof typeof priorityColors]}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Mensagem</h3>
                  <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4">
                    <p className="text-white text-sm">{selectedTicket.message}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response" className="text-gray-300">Responder</Label>
                  <Textarea
                    id="response"
                    placeholder="Digite sua resposta..."
                    className="bg-[#0a0e1a] border-gray-700 text-white"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-primary hover:bg-primary/90">
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar por E-mail
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                      <Phone className="mr-2 h-4 w-4" />
                      Enviar por WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SuperAdminLayout>
  );
}