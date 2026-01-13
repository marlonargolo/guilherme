import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Download, Eye, Shield, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface Log {
  id: string;
  date: string;
  user: string;
  action: string;
  type: "edit" | "payment" | "api" | "login" | "system";
  result: "success" | "error" | "warning";
  details: {
    ip?: string;
    endpoint?: string;
    payload?: any;
    response?: any;
  };
}

export default function Conformidade() {
  const [logs] = useState<Log[]>([
    {
      id: "1",
      date: "21/10/2025 15:32:18",
      user: "João Silva",
      action: "Atualização de perfil",
      type: "edit",
      result: "success",
      details: {
        ip: "177.81.73.248",
        payload: { name: "João Silva", email: "joao@email.com" }
      }
    },
    {
      id: "2",
      date: "21/10/2025 14:15:42",
      user: "Maria Santos",
      action: "Pagamento processado",
      type: "payment",
      result: "success",
      details: {
        ip: "179.191.23.100",
        payload: { amount: 97.00, method: "credit_card" },
        response: { transaction_id: "tx_1234567890" }
      }
    },
    {
      id: "3",
      date: "21/10/2025 13:47:29",
      user: "Sistema",
      action: "Backup automático",
      type: "system",
      result: "success",
      details: {
        payload: { tables: 15, records: 45320, size: "2.3 MB" }
      }
    },
    {
      id: "4",
      date: "21/10/2025 12:08:55",
      user: "Pedro Costa",
      action: "Tentativa de login",
      type: "login",
      result: "error",
      details: {
        ip: "191.36.180.77",
        payload: { email: "pedro@email.com", reason: "invalid_password" }
      }
    },
    {
      id: "5",
      date: "21/10/2025 11:23:10",
      user: "Ana Oliveira",
      action: "Chamada API WhatsApp",
      type: "api",
      result: "success",
      details: {
        ip: "200.150.23.88",
        endpoint: "/api/whatsapp/send",
        payload: { to: "+5511999999999", message: "Olá!" },
        response: { message_id: "wamid.123456" }
      }
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleViewDetails = (log: Log) => {
    setSelectedLog(log);
    setIsSheetOpen(true);
  };

  const handleExport = () => {
    toast.success("Dados exportados com sucesso!");
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      edit: { className: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Edição" },
      payment: { className: "bg-green-500/10 text-green-500 border-green-500/20", label: "Pagamento" },
      api: { className: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "API" },
      login: { className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Login" },
      system: { className: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "Sistema" }
    };
    const config = variants[type] || { className: "border-border", label: type };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const getResultBadge = (result: string) => {
    const config: Record<string, any> = {
      success: { icon: CheckCircle2, className: "bg-green-500/10 text-green-500 border-green-500/20", label: "Sucesso" },
      error: { icon: AlertTriangle, className: "bg-red-500/10 text-red-500 border-red-500/20", label: "Erro" },
      warning: { icon: Clock, className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Aviso" }
    };
    const { icon: Icon, className, label } = config[result] || { icon: Shield, className: "border-border", label: result };
    return (
      <Badge variant="outline" className={`${className} gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Conformidade & Auditoria
            </h1>
            <p className="text-muted-foreground mt-1">Monitoramento completo e análise de segurança</p>
          </div>
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="h-4 w-4" />
              Logs & Auditoria
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Compliance
            </TabsTrigger>
          </TabsList>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card border-border/50 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total de Eventos</p>
                      <p className="text-3xl font-bold">{logs.length}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sucessos</p>
                      <p className="text-3xl font-bold text-green-500">
                        {logs.filter(l => l.result === 'success').length}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Erros</p>
                      <p className="text-3xl font-bold text-red-500">
                        {logs.filter(l => l.result === 'error').length}
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50 hover-scale">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avisos</p>
                      <p className="text-3xl font-bold text-yellow-500">
                        {logs.filter(l => l.result === 'warning').length}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <CardTitle>Histórico de Atividades</CardTitle>
                    <CardDescription>Todos os eventos do sistema em tempo real</CardDescription>
                  </div>
                  <Button onClick={handleExport} className="btn-glow">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por usuário ou ação..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background/50 border-border"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-background/50 border-border">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="edit">Edição</SelectItem>
                      <SelectItem value="payment">Pagamento</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 bg-muted/30">
                        <TableHead className="text-muted-foreground font-semibold">Data/Hora</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Usuário</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Ação</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Tipo</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Resultado</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {log.date}
                          </TableCell>
                          <TableCell className="font-medium">{log.user}</TableCell>
                          <TableCell className="text-muted-foreground">{log.action}</TableCell>
                          <TableCell>{getTypeBadge(log.type)}</TableCell>
                          <TableCell>{getResultBadge(log.result)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(log)}
                              className="hover:bg-primary/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Nível de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-500 mb-2">98%</div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Excelente
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Alertas Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-yellow-500 mb-2">2</div>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      Atenção Necessária
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-500 mb-2">100%</div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Em Conformidade
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Últimas Ameaças Detectadas</CardTitle>
                <CardDescription>Atividades suspeitas bloqueadas automaticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Tentativa de Login Suspeita</p>
                      <p className="text-sm text-muted-foreground">IP: 192.168.1.100 - Bloqueado automaticamente</p>
                      <p className="text-xs text-muted-foreground mt-1">Há 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Múltiplas Requisições de API</p>
                      <p className="text-sm text-muted-foreground">Rate limit aplicado - 500 req/min</p>
                      <p className="text-xs text-muted-foreground mt-1">Há 5 horas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Certificações e Compliance</CardTitle>
                <CardDescription>Status de conformidade com regulamentações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-semibold">LGPD Compliant</p>
                      <p className="text-sm text-muted-foreground">Lei Geral de Proteção de Dados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-semibold">ISO 27001</p>
                      <p className="text-sm text-muted-foreground">Segurança da Informação</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-semibold">PCI DSS</p>
                      <p className="text-sm text-muted-foreground">Payment Card Industry</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-semibold">SOC 2 Type II</p>
                      <p className="text-sm text-muted-foreground">Service Organization Control</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Políticas de Privacidade</CardTitle>
                <CardDescription>Documentos e termos atualizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Política de Privacidade</p>
                        <p className="text-sm text-muted-foreground">Última atualização: 01/10/2025</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Visualizar</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Termos de Uso</p>
                        <p className="text-sm text-muted-foreground">Última atualização: 01/10/2025</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Visualizar</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Política de Cookies</p>
                        <p className="text-sm text-muted-foreground">Última atualização: 01/10/2025</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Visualizar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Details Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="glass-card border-border/50 w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Detalhes do Evento</SheetTitle>
              <SheetDescription>
                Informações completas da ação realizada
              </SheetDescription>
            </SheetHeader>
            
            {selectedLog && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Data/Hora</p>
                    <p className="font-mono text-sm font-medium">{selectedLog.date}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Usuário</p>
                    <p className="font-medium">{selectedLog.user}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ação</p>
                    <p className="font-medium">{selectedLog.action}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    {getTypeBadge(selectedLog.type)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Resultado</p>
                    {getResultBadge(selectedLog.result)}
                  </div>
                  {selectedLog.details.ip && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">IP</p>
                      <p className="font-mono text-sm font-medium">{selectedLog.details.ip}</p>
                    </div>
                  )}
                </div>

                {selectedLog.details.endpoint && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Endpoint</p>
                    <p className="font-mono text-sm bg-muted/30 p-2 rounded border border-border/50">
                      {selectedLog.details.endpoint}
                    </p>
                  </div>
                )}

                {selectedLog.details.payload && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Payload</p>
                    <pre className="text-xs bg-muted/30 p-3 rounded border border-border/50 overflow-x-auto">
                      {JSON.stringify(selectedLog.details.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.details.response && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Resposta</p>
                    <pre className="text-xs bg-muted/30 p-3 rounded border border-border/50 overflow-x-auto">
                      {JSON.stringify(selectedLog.details.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </SuperAdminLayout>
  );
}
