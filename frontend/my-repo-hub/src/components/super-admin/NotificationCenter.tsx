import { useState, useEffect } from "react";
import { Bell, AlertTriangle, MessageSquare, TrendingDown, XCircle, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  type: "problem" | "support" | "metric";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: Date;
  link?: string;
  read?: boolean;
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [ticketsRes, usersRes, paymentsRes] = await Promise.all([
        supabase.from('support_tickets').select('*').eq('status', 'new').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*').eq('subscription_status', 'canceled').limit(10),
        supabase.from('payments').select('*').eq('status', 'failed').order('payment_date', { ascending: false }).limit(5),
      ]);

      const newNotifications: Notification[] = [];

      // Notificações de suporte
      if (ticketsRes.data && ticketsRes.data.length > 0) {
        newNotifications.push({
          id: 'support-pending',
          type: 'support',
          severity: ticketsRes.data.length > 3 ? 'high' : 'medium',
          title: `${ticketsRes.data.length} tickets pendentes`,
          description: 'Novos tickets aguardando resposta',
          timestamp: new Date(ticketsRes.data[0].created_at),
          link: '/super-admin/suporte',
        });
      }

      // Notificações de usuários cancelados
      if (usersRes.data && usersRes.data.length > 0) {
        newNotifications.push({
          id: 'users-churned',
          type: 'metric',
          severity: usersRes.data.length > 5 ? 'high' : 'medium',
          title: `${usersRes.data.length} usuários cancelaram`,
          description: 'Ação de retenção necessária',
          timestamp: new Date(),
          link: '/super-admin/usuarios',
        });
      }

      // Notificações de pagamentos falhados
      if (paymentsRes.data && paymentsRes.data.length > 0) {
        newNotifications.push({
          id: 'payments-failed',
          type: 'problem',
          severity: 'high',
          title: `${paymentsRes.data.length} pagamentos falharam`,
          description: 'Cobranças que precisam de atenção',
          timestamp: new Date(paymentsRes.data[0].payment_date),
          link: '/super-admin/financeiro',
        });
      }

      // Adicionar notificações de métricas importantes
      if (usersRes.data && usersRes.data.length > 0) {
        const churnRate = (usersRes.data.length / 100) * 100; // Mock calculation
        if (churnRate > 10) {
          newNotifications.push({
            id: 'churn-rate-high',
            type: 'metric',
            severity: 'high',
            title: 'Taxa de cancelamento elevada',
            description: `${churnRate.toFixed(1)}% de churn detectado`,
            timestamp: new Date(),
            link: '/super-admin/analytics',
          });
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'problem': return <AlertTriangle className="h-4 w-4" />;
      case 'support': return <MessageSquare className="h-4 w-4" />;
      case 'metric': return <TrendingDown className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-primary/10 transition-colors"
        >
          <Bell className="h-5 w-5 text-foreground" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-xs font-bold text-white">{unreadCount}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-border/50">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            Central de Notificações
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Monitoramento em tempo real
          </p>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          {notifications.length === 0 ? (
            <Card className="glass-card border-border/30 mt-8">
              <CardContent className="pt-12 pb-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Tudo em ordem!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Nenhum problema detectado no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`glass-card border-border/30 hover:border-primary/50 transition-all cursor-pointer ${
                      notification.severity === 'high' ? 'border-l-4 border-l-red-500' : 
                      notification.severity === 'medium' ? 'border-l-4 border-l-yellow-500' : 
                      'border-l-4 border-l-blue-500'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getSeverityColor(notification.severity)}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-foreground truncate">
                              {notification.title}
                            </h4>
                            <Badge variant="outline" className={getSeverityColor(notification.severity)}>
                              {notification.severity === 'high' ? 'Urgente' : 
                               notification.severity === 'medium' ? 'Atenção' : 'Info'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {notification.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {notification.link && (
                              <span className="text-xs text-primary font-medium flex items-center gap-1">
                                Ver detalhes
                                <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
