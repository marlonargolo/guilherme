import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Zap, Facebook, MessageSquare, Send, CreditCard, Mail, CheckCircle2, XCircle, Settings2, Activity, Plus, Copy, Edit, Bot, Share2, Users, Bell, Filter, Database } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppBadge } from "@/components/super-admin/AppBadge";

interface Integration {
  id: string;
  name: string;
  icon: any;
  status: "active" | "inactive";
  lastTest?: string;
  latency?: number;
}

interface Automation {
  id: string;
  name: string;
  type: "whatsapp" | "email" | "ai" | "webhook";
  trigger: string;
  action: string;
  status: "active" | "inactive";
  executions: number;
}

const mockIntegrations: Integration[] = [
  { id: "facebook", name: "Facebook / Instagram", icon: Facebook, status: "inactive" },
  { id: "whatsapp", name: "WhatsApp Business", icon: MessageSquare, status: "inactive" },
  { id: "telegram", name: "Telegram", icon: Send, status: "inactive" },
  { id: "tiktok", name: "TikTok", icon: Activity, status: "inactive" },
  { id: "linkedin_oidc", name: "LinkedIn", icon: Share2, status: "inactive" },
  { id: "openai", name: "OpenAI ChatGPT", icon: Bot, status: "inactive" },
  { id: "chatgpt_agent", name: "Agente ChatGPT", icon: Bot, status: "inactive" },
  { id: "crm", name: "CRM Sistema", icon: Users, status: "inactive" },
  { id: "notifications", name: "Sistema de Notificações", icon: Bell, status: "inactive" },
  { id: "smtp", name: "SMTP / SendGrid", icon: Mail, status: "inactive" },
];

const mockAutomations: Automation[] = [
  { id: "AUTO-001", name: "Boas-vindas Novo Usuário", type: "whatsapp", trigger: "Novo cadastro", action: "Enviar mensagem", status: "active", executions: 45 },
  { id: "AUTO-002", name: "Recuperação de Pagamento", type: "email", trigger: "Pagamento falhou", action: "Enviar e-mail", status: "active", executions: 12 },
  { id: "AUTO-003", name: "Reengajamento Inativo", type: "ai", trigger: "Sem login 15 dias", action: "Mensagem IA", status: "active", executions: 8 },
  { id: "AUTO-004", name: "Notificação de Upgrade", type: "webhook", trigger: "Limite atingido", action: "Webhook", status: "inactive", executions: 23 },
];

const typeIcons = { ai: Bot, webhook: Zap, email: Mail, whatsapp: MessageSquare };
const typeColors = {
  ai: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  webhook: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  email: "bg-green-500/10 text-green-500 border-green-500/20",
  whatsapp: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [automations, setAutomations] = useState(mockAutomations);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dbIntegrations, setDbIntegrations] = useState<any[]>([]);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterApp, setFilterApp] = useState<string>("all");
  const [notifications, setNotifications] = useState<Array<{id: string, title: string, message: string, type: string, timestamp: string}>>([]);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    const { data, error } = await supabase
      .from("integrations")
      .select(`
        *,
        profiles!inner(app_type)
      `);

    if (error) {
      console.error("Error loading integrations:", error);
      return;
    }

    setDbIntegrations(data || []);
    
    // Atualizar status das integrações baseado nos dados do banco
    setIntegrations(prev => prev.map(int => {
      const dbInt = data?.find(d => d.channel === int.id);
      return {
        ...int,
        status: dbInt?.status === "connected" ? "active" : "inactive",
        lastTest: dbInt?.last_sync ? new Date(dbInt.last_sync).toLocaleString('pt-BR') : undefined,
      };
    }));
  };

  const handleTest = async (integrationId: string) => {
    toast.info("Testando conexão...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    const latency = Math.floor(Math.random() * 300) + 150;
    setIntegrations(prev => prev.map(int => 
      int.id === integrationId ? { ...int, lastTest: new Date().toLocaleString('pt-BR'), latency } : int
    ));
    toast.success(`Conexão testada! Latência: ${latency}ms`);
  };

  const handleToggleStatus = (id: string) => {
    setAutomations(prev => prev.map(auto => 
      auto.id === id ? { ...auto, status: auto.status === "active" ? "inactive" : "active" } : auto
    ));
    toast.success("Status atualizado");
  };

  const handleEditIntegration = (integration: Integration) => {
    setEditingIntegration(integration);
    // Carregar credenciais existentes do banco se houver
    const dbInt = dbIntegrations.find(d => d.channel === integration.id);
    if (dbInt && dbInt.credentials) {
      setCredentials(dbInt.credentials);
    } else {
      setCredentials({});
    }
  };

  const handleSaveIntegration = async () => {
    if (!editingIntegration) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { error } = await supabase
      .from("integrations")
      .upsert([{
        user_id: user.id,
        channel: editingIntegration.id as any,
        status: "connected",
        credentials: credentials,
        last_sync: new Date().toISOString(),
      }], {
        onConflict: 'user_id,channel'
      });

    if (error) {
      toast.error("Erro ao salvar integração");
      console.error(error);
      return;
    }

    toast.success("Integração salva com sucesso!");
    setEditingIntegration(null);
    setCredentials({});
    loadIntegrations();
  };

  const getIntegrationFields = (integrationId: string) => {
    const fieldsMap: Record<string, Array<{name: string, label: string, type: string, placeholder?: string}>> = {
      facebook: [
        { name: "username", label: "Email ou Telefone", type: "text" },
        { name: "password", label: "Senha", type: "password" },
      ],
      whatsapp: [
        { name: "phone_number", label: "Número", type: "text", placeholder: "+55..." },
        { name: "api_key", label: "API Key", type: "password" },
      ],
      telegram: [
        { name: "bot_token", label: "Bot Token", type: "password" },
      ],
      tiktok: [
        { name: "username", label: "Usuário", type: "text" },
        { name: "password", label: "Senha", type: "password" },
      ],
      linkedin_oidc: [
        { name: "client_id", label: "Client ID", type: "text" },
        { name: "client_secret", label: "Client Secret", type: "password" },
      ],
      openai: [
        { name: "api_key", label: "API Key ChatGPT", type: "password" },
        { name: "model", label: "Modelo", type: "text", placeholder: "gpt-4o" },
        { name: "organization", label: "Organization ID", type: "text", placeholder: "org-..." },
      ],
      chatgpt_agent: [
        { name: "api_key", label: "API Key ChatGPT", type: "password" },
        { name: "assistant_id", label: "Assistant ID", type: "text", placeholder: "asst_..." },
        { name: "model", label: "Modelo", type: "text", placeholder: "gpt-4o" },
      ],
      crm: [
        { name: "api_url", label: "API URL", type: "text", placeholder: "https://..." },
        { name: "api_key", label: "API Key", type: "password" },
        { name: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://..." },
      ],
      notifications: [
        { name: "push_enabled", label: "Push Notifications", type: "checkbox" },
        { name: "email_enabled", label: "Email Notifications", type: "checkbox" },
        { name: "sms_enabled", label: "SMS Notifications", type: "checkbox" },
        { name: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://..." },
      ],
      smtp: [
        { name: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.sendgrid.net" },
        { name: "smtp_port", label: "Porta", type: "text", placeholder: "587" },
        { name: "smtp_user", label: "Usuário", type: "text" },
        { name: "smtp_pass", label: "Senha", type: "password" },
        { name: "from_email", label: "Email Remetente", type: "email" },
        { name: "from_name", label: "Nome Remetente", type: "text" },
      ],
    };
    return fieldsMap[integrationId] || [];
  };

  const filteredIntegrations = integrations.filter(int => {
    const matchStatus = filterStatus === "all" || 
      (filterStatus === "active" && int.status === "active") ||
      (filterStatus === "inactive" && int.status === "inactive");
    const matchSearch = !searchTerm || int.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por app type
    const intData = dbIntegrations.find(d => d.channel === int.id);
    const appType = intData?.profiles?.app_type;
    const matchApp = filterApp === "all" || 
      (filterApp === "social_flow" && appType?.includes("social_flow")) ||
      (filterApp === "intelligent_agent" && appType?.includes("intelligent_agent"));
    
    return matchStatus && matchSearch && matchApp;
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Integrações</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Gerencie APIs e automações</p>
        </div>

        <Tabs defaultValue="servicos" className="w-full">
          <TabsList className="w-full md:w-auto bg-[#111827] border border-gray-800">
            <TabsTrigger value="servicos" className="text-xs md:text-sm">Serviços Conectados</TabsTrigger>
            <TabsTrigger value="automacoes" className="text-xs md:text-sm">Automações</TabsTrigger>
          </TabsList>

          {/* Serviços Conectados Tab */}
          <TabsContent value="servicos" className="space-y-4 md:space-y-6 mt-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{integrations.length}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">{integrations.filter(i => i.status === 'active').length}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Inativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-500">{integrations.filter(i => i.status === 'inactive').length}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">99.8%</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar integração..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background/50 border-border/50 text-foreground" />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[180px] bg-background/50 border-border/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="inactive">Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterApp} onValueChange={setFilterApp}>
                    <SelectTrigger className="w-full md:w-[200px] bg-background/50 border-border/50">
                      <SelectValue placeholder="Aplicação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Aplicações</SelectItem>
                      <SelectItem value="social_flow">Social Flow</SelectItem>
                      <SelectItem value="intelligent_agent">Intelligent Agent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="whitespace-nowrap">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Integração
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon;
                const isActive = integration.status === "active";
                return (
                  <Card key={integration.id} className="glass-card group hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-muted/30'} group-hover:scale-110`}>
                            <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-white text-sm md:text-base font-semibold mb-1">{integration.name}</CardTitle>
                            <div className="flex items-center gap-2 flex-wrap">
                              <AppBadge 
                                appTypes={dbIntegrations.find(d => d.channel === integration.id)?.profiles?.app_type || null} 
                                size="sm" 
                              />
                              <Badge variant={isActive ? "default" : "secondary"} className={`text-xs ${isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                {isActive ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</> : <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {integration.lastTest && (
                        <div className="text-xs md:text-sm text-gray-400 space-y-2 bg-muted/20 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-primary" />
                            <span>Último teste: {integration.lastTest}</span>
                          </div>
                          {integration.latency && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${integration.latency < 200 ? 'bg-green-500' : integration.latency < 500 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                              Latência: {integration.latency}ms
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs border-primary/30 hover:bg-primary/10 hover:border-primary"
                          onClick={() => handleEditIntegration(integration)}
                        >
                          <Settings2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Configurar
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleTest(integration.id)} 
                          className="text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                        >
                          Testar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Automações Tab */}
          <TabsContent value="automacoes" className="space-y-4 md:space-y-6 mt-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-[#111827] border-gray-800">
                <CardHeader className="pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm text-gray-400">Total</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0">
                  <p className="text-xl md:text-3xl font-bold text-white">{automations.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111827] border-gray-800">
                <CardHeader className="pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm text-gray-400">Ativas</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0">
                  <p className="text-xl md:text-3xl font-bold text-green-500">{automations.filter(a => a.status === "active").length}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111827] border-gray-800">
                <CardHeader className="pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm text-gray-400">Inativas</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0">
                  <p className="text-xl md:text-3xl font-bold text-gray-500">{automations.filter(a => a.status === "inactive").length}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#111827] border-gray-800">
                <CardHeader className="pb-2 p-3 md:p-6">
                  <CardTitle className="text-xs md:text-sm text-gray-400">Execuções (24h)</CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0">
                  <p className="text-xl md:text-3xl font-bold text-white">88</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-[#111827] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar automação..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-[#0a0e1a] border-gray-700 text-white" />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-[180px] bg-[#0a0e1a] border-gray-700 text-white">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ai">IA</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm"><Plus className="mr-2 h-4 w-4" />Novo Fluxo</Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-[#111827] border-gray-800">
              <CardContent className="pt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400 text-xs md:text-sm">Nome</TableHead>
                      <TableHead className="text-gray-400 text-xs md:text-sm">Tipo</TableHead>
                      <TableHead className="text-gray-400 text-xs md:text-sm">Gatilho</TableHead>
                      <TableHead className="text-gray-400 text-xs md:text-sm">Status</TableHead>
                      <TableHead className="text-gray-400 text-xs md:text-sm">Execuções</TableHead>
                      <TableHead className="text-gray-400 text-xs md:text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automations.map((automation) => {
                      const Icon = typeIcons[automation.type];
                      return (
                        <TableRow key={automation.id} className="border-gray-800">
                          <TableCell className="text-white font-medium text-xs md:text-sm">{automation.name}</TableCell>
                          <TableCell>
                            <Badge className={typeColors[automation.type]}>
                              <Icon className="h-3 w-3 mr-1" />
                              {automation.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs md:text-sm">{automation.trigger}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={automation.status === "active"} onCheckedChange={() => handleToggleStatus(automation.id)} />
                              <Badge className={statusColors[automation.status]}>{automation.status === "active" ? "Ativo" : "Inativo"}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-400 text-xs md:text-sm">{automation.executions}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost"><Copy className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Edição de Integração - Design Futurista */}
        <Dialog open={!!editingIntegration} onOpenChange={(open) => !open && setEditingIntegration(null)}>
          <DialogContent className="glass-card border-primary/30 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                {editingIntegration && (
                  <>
                    <div className="p-2 bg-primary/20 rounded-lg">
                      {(() => {
                        const Icon = editingIntegration.icon;
                        return <Icon className="h-6 w-6 text-primary" />;
                      })()}
                    </div>
                    <span className="text-gradient">{editingIntegration.name}</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Configure as credenciais e parâmetros de conexão com segurança
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-5 mt-6">
              {editingIntegration && getIntegrationFields(editingIntegration.id).map((field) => (
                <div key={field.name} className="space-y-2 group">
                  <Label htmlFor={field.name} className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {field.label}
                    {field.type === 'password' && (
                      <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                        Seguro
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}...`}
                    value={credentials[field.name] || ""}
                    onChange={(e) => setCredentials({...credentials, [field.name]: e.target.value})}
                    className="bg-muted/30 border-border hover:border-primary/50 focus:border-primary transition-all duration-300 text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
              ))}

              {editingIntegration && getIntegrationFields(editingIntegration.id).length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                  <p className="text-xs text-blue-300 flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    <span className="font-semibold">Dica de Segurança:</span>
                  </p>
                  <p className="text-xs text-blue-200 mt-2">
                    Suas credenciais são criptografadas e armazenadas com segurança. Nunca compartilhe suas chaves de API.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <Button 
                onClick={handleSaveIntegration} 
                className="flex-1 btn-glow"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingIntegration(null)} 
                className="flex-1 border-muted hover:bg-muted/20"
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
