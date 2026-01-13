import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Edit,
  Zap,
  Mail,
  MessageSquare,
  Bot,
  Workflow,
  Globe,
  Webhook,
  Copy,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Settings,
  Sparkles,
  Activity,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface Automation {
  id: string;
  name: string;
  type: "ai" | "webhook" | "email" | "whatsapp";
  trigger: string;
  action: string;
  status: "active" | "inactive";
  lastExecution: string;
  executions: number;
  successRate: number;
  avgTime: string;
}

interface IntegrationConfig {
  enabled: boolean;
  webhookUrl: string;
  headers?: string;
}

const mockAutomations: Automation[] = [
  {
    id: "AUTO-001",
    name: "Boas-vindas Novo Usuário",
    type: "whatsapp",
    trigger: "Novo cadastro",
    action: "Enviar mensagem de boas-vindas",
    status: "active",
    lastExecution: "2025-10-20 14:30",
    executions: 1240,
    successRate: 98,
    avgTime: "1.2s",
  },
  {
    id: "AUTO-002",
    name: "Recuperação de Pagamento",
    type: "email",
    trigger: "Pagamento falhou",
    action: "Enviar e-mail + WhatsApp",
    status: "active",
    lastExecution: "2025-10-19 10:15",
    executions: 456,
    successRate: 95,
    avgTime: "2.8s",
  },
  {
    id: "AUTO-003",
    name: "Reengajamento Inativo",
    type: "ai",
    trigger: "Sem login 15 dias",
    action: "Mensagem personalizada IA",
    status: "active",
    lastExecution: "2025-10-18 08:00",
    executions: 892,
    successRate: 87,
    avgTime: "3.5s",
  },
  {
    id: "AUTO-004",
    name: "Notificação de Upgrade",
    type: "webhook",
    trigger: "Limite de uso atingido",
    action: "Webhook interno + e-mail",
    status: "inactive",
    lastExecution: "2025-10-10 16:45",
    executions: 234,
    successRate: 92,
    avgTime: "1.8s",
  },
];

const typeIcons = {
  ai: Bot,
  webhook: Zap,
  email: Mail,
  whatsapp: MessageSquare,
};

const typeGradients = {
  ai: "from-purple-500 to-pink-500",
  webhook: "from-blue-500 to-cyan-500",
  email: "from-green-500 to-emerald-500",
  whatsapp: "from-emerald-500 to-teal-500",
};

export default function Automacoes() {
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [integrations, setIntegrations] = useState<Record<string, IntegrationConfig>>({
    n8n: { enabled: false, webhookUrl: "" },
    make: { enabled: false, webhookUrl: "" },
    zapier: { enabled: false, webhookUrl: "" },
    pabbly: { enabled: false, webhookUrl: "" },
    activepieces: { enabled: false, webhookUrl: "" },
    integrately: { enabled: false, webhookUrl: "" },
    tray: { enabled: false, webhookUrl: "" },
    custom: { enabled: false, webhookUrl: "", headers: "" },
  });

  const filteredAutomations = automations.filter((automation) => {
    const matchesSearch = automation.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || automation.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleToggleStatus = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id
          ? { ...auto, status: auto.status === "active" ? "inactive" : "active" }
          : auto
      )
    );
    toast.success("Status atualizado");
  };

  const handleDuplicate = (automation: Automation) => {
    const newAuto = {
      ...automation,
      id: `AUTO-${String(automations.length + 1).padStart(3, "0")}`,
      name: `${automation.name} (Cópia)`,
    };
    setAutomations([...automations, newAuto]);
    toast.success(`Automação duplicada com sucesso!`);
  };

  const handleDelete = (id: string) => {
    setAutomations((prev) => prev.filter((auto) => auto.id !== id));
    toast.success("Automação removida");
  };

  const totalExecutions = automations.reduce((acc, auto) => acc + auto.executions, 0);
  const activeCount = automations.filter((a) => a.status === "active").length;
  const avgSuccessRate =
    automations.reduce((acc, auto) => acc + auto.successRate, 0) / automations.length;

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
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Automações
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie fluxos inteligentes e triggers automáticos
              </p>
            </div>
          </div>
          <Badge className="flex items-center gap-2 px-4 py-2 animate-pulse" variant="outline">
            <Activity className="h-4 w-4 text-green-400" />
            {activeCount} Ativas
          </Badge>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">{automations.length}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-400 font-semibold">+12%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 bg-opacity-10">
                    <Sparkles className="h-6 w-6 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card border-green-500/20 hover:border-green-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ativas</p>
                    <p className="text-3xl font-bold text-green-400">{activeCount}</p>
                    <Progress value={(activeCount / automations.length) * 100} className="h-1.5" />
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 bg-opacity-10">
                    <CheckCircle2 className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card border-purple-500/20 hover:border-purple-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Execuções (24h)</p>
                    <p className="text-3xl font-bold text-purple-400">{totalExecutions.toLocaleString()}</p>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-purple-400" />
                      <span className="text-xs text-muted-foreground">em tempo real</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-opacity-10">
                    <Activity className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-orange-500/20 hover:border-orange-500/40 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-3xl font-bold text-orange-400">{avgSuccessRate.toFixed(1)}%</p>
                    <Progress value={avgSuccessRate} className="h-1.5" />
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 bg-opacity-10">
                    <TrendingUp className="h-6 w-6 text-orange-400" />
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
                  placeholder="Buscar automação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] bg-background/50 border-border">
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
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Fluxo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Automations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAutomations.map((automation, idx) => {
              const Icon = typeIcons[automation.type];
              const gradient = typeGradients[automation.type];
              return (
                <motion.div
                  key={automation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="glass-card border-primary/20 hover:border-primary/40 transition-all group">
                    <CardContent className="pt-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-10`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={automation.status === "active"}
                            onCheckedChange={() => handleToggleStatus(automation.id)}
                          />
                          <Badge
                            variant="outline"
                            className={
                              automation.status === "active"
                                ? "border-green-500/30 text-green-400"
                                : "border-gray-500/30 text-gray-400"
                            }
                          >
                            {automation.status === "active" ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{automation.name}</h3>
                          <p className="text-xs text-muted-foreground">{automation.id}</p>
                        </div>

                        <div className="space-y-2 py-3 border-t border-b border-border/50">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Gatilho:</span>
                            <span className="font-medium">{automation.trigger}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Ação:</span>
                            <span className="font-medium truncate">{automation.action}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-muted/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Execuções</p>
                            <p className="text-sm font-bold">{automation.executions}</p>
                          </div>
                          <div className="text-center p-2 bg-muted/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Sucesso</p>
                            <p className="text-sm font-bold text-green-400">{automation.successRate}%</p>
                          </div>
                          <div className="text-center p-2 bg-muted/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Tempo</p>
                            <p className="text-sm font-bold">{automation.avgTime}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setEditingAutomation(automation)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicate(automation)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(automation.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Edit Automation Modal */}
        <Dialog open={!!editingAutomation} onOpenChange={() => setEditingAutomation(null)}>
          <DialogContent className="glass-card max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Configurar Automação
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {editingAutomation?.name} • {editingAutomation?.id}
              </p>
            </DialogHeader>

            <Tabs defaultValue="config" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="config">Configuração</TabsTrigger>
                <TabsTrigger value="integrations">Integrações</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Config Tab */}
              <TabsContent value="config" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Automação</Label>
                    <Input
                      defaultValue={editingAutomation?.name}
                      className="bg-background/50 border-border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select defaultValue={editingAutomation?.type}>
                        <SelectTrigger className="bg-background/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              IA
                            </div>
                          </SelectItem>
                          <SelectItem value="webhook">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Webhook
                            </div>
                          </SelectItem>
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

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select defaultValue={editingAutomation?.status}>
                        <SelectTrigger className="bg-background/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativa</SelectItem>
                          <SelectItem value="inactive">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Gatilho</Label>
                    <Input
                      defaultValue={editingAutomation?.trigger}
                      placeholder="Ex: Novo cadastro, Pagamento falhou..."
                      className="bg-background/50 border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ação</Label>
                    <Textarea
                      defaultValue={editingAutomation?.action}
                      placeholder="Descreva a ação que será executada..."
                      className="bg-background/50 border-border min-h-[100px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="space-y-4">
                <div className="space-y-3">
                  {/* N8N */}
                  <Card className="glass-card border-orange-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                          <Workflow className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">n8n</p>
                          <p className="text-xs text-muted-foreground">Automação workflow avançada</p>
                        </div>
                        <Switch
                          checked={integrations.n8n.enabled}
                          onCheckedChange={(checked) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              n8n: { ...prev.n8n, enabled: checked },
                            }))
                          }
                        />
                      </div>
                      {integrations.n8n.enabled && (
                        <Input
                          placeholder="https://seu-n8n.com/webhook/..."
                          value={integrations.n8n.webhookUrl}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              n8n: { ...prev.n8n, webhookUrl: e.target.value },
                            }))
                          }
                          className="bg-background/50 border-border"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Make */}
                  <Card className="glass-card border-purple-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Make</p>
                          <p className="text-xs text-muted-foreground">Integração visual de processos</p>
                        </div>
                        <Switch
                          checked={integrations.make.enabled}
                          onCheckedChange={(checked) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              make: { ...prev.make, enabled: checked },
                            }))
                          }
                        />
                      </div>
                      {integrations.make.enabled && (
                        <Input
                          placeholder="https://hook.make.com/..."
                          value={integrations.make.webhookUrl}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              make: { ...prev.make, webhookUrl: e.target.value },
                            }))
                          }
                          className="bg-background/50 border-border"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Zapier */}
                  <Card className="glass-card border-orange-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Zapier</p>
                          <p className="text-xs text-muted-foreground">Conecte 5000+ apps</p>
                        </div>
                        <Switch
                          checked={integrations.zapier.enabled}
                          onCheckedChange={(checked) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              zapier: { ...prev.zapier, enabled: checked },
                            }))
                          }
                        />
                      </div>
                      {integrations.zapier.enabled && (
                        <Input
                          placeholder="https://hooks.zapier.com/..."
                          value={integrations.zapier.webhookUrl}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              zapier: { ...prev.zapier, webhookUrl: e.target.value },
                            }))
                          }
                          className="bg-background/50 border-border"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Pabbly */}
                  <Card className="glass-card border-green-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <Workflow className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Pabbly Connect</p>
                          <p className="text-xs text-muted-foreground">Automação sem limites</p>
                        </div>
                        <Switch
                          checked={integrations.pabbly.enabled}
                          onCheckedChange={(checked) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              pabbly: { ...prev.pabbly, enabled: checked },
                            }))
                          }
                        />
                      </div>
                      {integrations.pabbly.enabled && (
                        <Input
                          placeholder="https://connect.pabbly.com/..."
                          value={integrations.pabbly.webhookUrl}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              pabbly: { ...prev.pabbly, webhookUrl: e.target.value },
                            }))
                          }
                          className="bg-background/50 border-border"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* ActivePieces */}
                  <Card className="glass-card border-blue-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">ActivePieces</p>
                          <p className="text-xs text-muted-foreground">Open-source automation</p>
                        </div>
                        <Switch
                          checked={integrations.activepieces.enabled}
                          onCheckedChange={(checked) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              activepieces: { ...prev.activepieces, enabled: checked },
                            }))
                          }
                        />
                      </div>
                      {integrations.activepieces.enabled && (
                        <Input
                          placeholder="https://activepieces.com/webhook/..."
                          value={integrations.activepieces.webhookUrl}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              activepieces: { ...prev.activepieces, webhookUrl: e.target.value },
                            }))
                          }
                          className="bg-background/50 border-border"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Integrately */}
                  <Card className="glass-card border-pink-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Integrately</p>
                          <p className="text-xs text-muted-foreground">8M+ integrações prontas</p>
                        </div>
                        <Switch
                          checked={integrations.integrately.enabled}
                          onCheckedChange={(checked) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              integrately: { ...prev.integrately, enabled: checked },
                            }))
                          }
                        />
                      </div>
                      {integrations.integrately.enabled && (
                        <Input
                          placeholder="https://integrately.com/webhook/..."
                          value={integrations.integrately.webhookUrl}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              integrately: { ...prev.integrately, webhookUrl: e.target.value },
                            }))
                          }
                          className="bg-background/50 border-border"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Tray.io */}
                  <Card className="glass-card border-cyan-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Tray.io</p>
                          <p className="text-xs text-muted-foreground">Enterprise automation</p>
                        </div>
                        <Switch
                          checked={integrations.tray.enabled}
                          onCheckedChange={(checked) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              tray: { ...prev.tray, enabled: checked },
                            }))
                          }
                        />
                      </div>
                      {integrations.tray.enabled && (
                        <Input
                          placeholder="https://tray.io/webhook/..."
                          value={integrations.tray.webhookUrl}
                          onChange={(e) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              tray: { ...prev.tray, webhookUrl: e.target.value },
                            }))
                          }
                          className="bg-background/50 border-border"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Custom Webhook */}
                  <Card className="glass-card border-yellow-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <Webhook className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">Webhook Customizado</p>
                          <p className="text-xs text-muted-foreground">Configure seu próprio endpoint</p>
                        </div>
                        <Switch
                          checked={integrations.custom.enabled}
                          onCheckedChange={(checked) =>
                            setIntegrations((prev) => ({
                              ...prev,
                              custom: { ...prev.custom, enabled: checked },
                            }))
                          }
                        />
                      </div>
                      {integrations.custom.enabled && (
                        <div className="space-y-2">
                          <Input
                            placeholder="https://api.seuservico.com/webhook"
                            value={integrations.custom.webhookUrl}
                            onChange={(e) =>
                              setIntegrations((prev) => ({
                                ...prev,
                                custom: { ...prev.custom, webhookUrl: e.target.value },
                              }))
                            }
                            className="bg-background/50 border-border"
                          />
                          <Textarea
                            placeholder='{"Authorization": "Bearer seu-token"}'
                            value={integrations.custom.headers}
                            onChange={(e) =>
                              setIntegrations((prev) => ({
                                ...prev,
                                custom: { ...prev.custom, headers: e.target.value },
                              }))
                            }
                            className="bg-background/50 border-border font-mono text-xs"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="glass-card border-green-500/20">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                        <p className="text-3xl font-bold text-green-400">
                          {editingAutomation?.successRate}%
                        </p>
                        <Progress value={editingAutomation?.successRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-blue-500/20">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Tempo Médio</p>
                        <p className="text-3xl font-bold text-blue-400">
                          {editingAutomation?.avgTime}
                        </p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-muted-foreground">por execução</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-purple-500/20">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Total de Execuções</p>
                        <p className="text-3xl font-bold text-purple-400">
                          {editingAutomation?.executions.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-purple-400" />
                          <span className="text-xs text-muted-foreground">últimos 30 dias</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-orange-500/20">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Última Execução</p>
                        <p className="text-lg font-bold text-orange-400">
                          {editingAutomation?.lastExecution}
                        </p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-orange-400" />
                          <span className="text-xs text-muted-foreground">em tempo real</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingAutomation(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={() => {
                  toast.success("Automação atualizada com sucesso!");
                  setEditingAutomation(null);
                }}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
