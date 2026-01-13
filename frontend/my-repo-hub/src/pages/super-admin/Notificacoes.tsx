import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellRing, Check, Filter, Mail, MessageSquare, Send, Settings, User, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const mockNotifications = [
  { id: "1", type: "user", title: "Novo Usuário", message: "João Silva se cadastrou", timestamp: "2 min atrás", read: false, priority: "high" },
  { id: "2", type: "system", title: "Backup Completo", message: "Backup diário concluído com sucesso", timestamp: "1h atrás", read: false, priority: "medium" },
  { id: "3", type: "payment", title: "Pagamento Recebido", message: "R$ 299,00 de Maria Costa", timestamp: "3h atrás", read: true, priority: "high" },
  { id: "4", type: "alert", title: "Limite de API", message: "80% do limite mensal atingido", timestamp: "5h atrás", read: false, priority: "high" },
  { id: "5", type: "user", title: "Usuário Inativo", message: "Pedro Santos sem acesso há 30 dias", timestamp: "1d atrás", read: true, priority: "low" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<string>("all");
  const [settings, setSettings] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    webhookEnabled: true,
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success("Notificação marcada como lida");
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("Todas as notificações marcadas como lidas");
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notificação removida");
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/30",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    low: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  };

  const typeIcons = {
    user: <User className="h-4 w-4" />,
    system: <Settings className="h-4 w-4" />,
    payment: <Mail className="h-4 w-4" />,
    alert: <BellRing className="h-4 w-4" />,
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Notificações</h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">Central de alertas e comunicações</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} não lidas
            </Badge>
          )}
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="w-full md:w-auto glass-card">
            <TabsTrigger value="inbox" className="text-xs md:text-sm">
              <Bell className="h-4 w-4 mr-2" />
              Caixa de Entrada
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4 mt-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Não Lidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{unreadCount}</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Urgentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    {notifications.filter(n => n.priority === 'high' && !n.read).length}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    {notifications.filter(n => n.timestamp.includes('min') || n.timestamp.includes('h')).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Actions */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={filter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("all")}
                    >
                      Todas
                    </Button>
                    <Button
                      variant={filter === "unread" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("unread")}
                    >
                      Não Lidas
                    </Button>
                    <Button
                      variant={filter === "user" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("user")}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Usuários
                    </Button>
                    <Button
                      variant={filter === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("system")}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Sistema
                    </Button>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-primary hover:text-primary/80"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`glass-card transition-all hover:border-primary/50 ${
                      !notification.read ? 'border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${priorityColors[notification.priority as keyof typeof priorityColors]} flex items-center justify-center`}>
                          {typeIcons[notification.type as keyof typeof typeIcons]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white flex items-center gap-2">
                                {notification.title}
                                {!notification.read && (
                                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {notification.timestamp}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${priorityColors[notification.priority as keyof typeof priorityColors]}`}>
                                  {notification.priority === 'high' ? 'Urgente' : notification.priority === 'medium' ? 'Médio' : 'Baixa'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-primary hover:text-primary/80"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Canais de Notificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">Email</Label>
                      <p className="text-sm text-muted-foreground">Receber notificações por email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailEnabled}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({ ...prev, emailEnabled: checked }));
                      toast.success(checked ? "Email ativado" : "Email desativado");
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">Push</Label>
                      <p className="text-sm text-muted-foreground">Notificações push no navegador</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.pushEnabled}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({ ...prev, pushEnabled: checked }));
                      toast.success(checked ? "Push ativado" : "Push desativado");
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">SMS</Label>
                      <p className="text-sm text-muted-foreground">Alertas via SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.smsEnabled}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({ ...prev, smsEnabled: checked }));
                      toast.success(checked ? "SMS ativado" : "SMS desativado");
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="text-base">Webhook</Label>
                      <p className="text-sm text-muted-foreground">Integrar com sistemas externos</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.webhookEnabled}
                    onCheckedChange={(checked) => {
                      setSettings(prev => ({ ...prev, webhookEnabled: checked }));
                      toast.success(checked ? "Webhook ativado" : "Webhook desativado");
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Webhook URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="https://seu-servidor.com/webhook"
                  className="bg-background/50 border-border/50"
                />
                <Button className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
