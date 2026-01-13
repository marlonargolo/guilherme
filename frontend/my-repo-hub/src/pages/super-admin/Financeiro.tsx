import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, DollarSign, TrendingUp, TrendingDown, RefreshCw, Send, Mail, MessageSquare, AlertCircle, CheckCircle, Users, Gift, Target, Percent, Shield, Clock, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { AppBadge } from "@/components/super-admin/AppBadge";

// Mock payments data
const mockPayments = [
  { id: "ch_001", amount: 97.00, currency: "BRL", status: "paid" as const, date: "2025-10-20", customerEmail: "cliente1@email.com", customerName: "Cliente 1", description: "Plano Pro", appType: ["social_flow"] },
  { id: "ch_002", amount: 197.00, currency: "BRL", status: "paid" as const, date: "2025-10-19", customerEmail: "cliente2@email.com", customerName: "Cliente 2", description: "Plano Business", appType: ["intelligent_agent"] },
  { id: "ch_003", amount: 97.00, currency: "BRL", status: "failed" as const, date: "2025-10-18", customerEmail: "cliente3@email.com", customerName: "Cliente 3", description: "Plano Pro", appType: ["social_flow"] },
  { id: "ch_004", amount: 97.00, currency: "BRL", status: "refunded" as const, date: "2025-10-15", customerEmail: "cliente4@email.com", customerName: "Cliente 4", description: "Plano Pro", appType: ["social_flow", "intelligent_agent"] },
];

const mockStats = {
  mrr: 8900,
  totalRevenue: 26400,
  paidCount: 27,
  failedCount: 3,
  refundedCount: 2,
  activeSubscriptions: 32,
};

const mockBillings = [
  { id: "BIL-001", userId: "4", userName: "Ana Costa", userEmail: "ana@marketing.com", amount: 97.00, status: "pending" as const, dueDate: "2025-10-25", attempts: 2, lastAttempt: "2025-10-20" },
  { id: "BIL-002", userId: "5", userName: "Pedro Santos", userEmail: "pedro@empresa.com", amount: 197.00, status: "failed" as const, dueDate: "2025-10-20", attempts: 3, lastAttempt: "2025-10-19" },
  { id: "BIL-003", userId: "1", userName: "João Silva", userEmail: "joao@empresa.com", amount: 97.00, status: "paid" as const, dueDate: "2025-10-15", attempts: 1, lastAttempt: "2025-10-15" },
];

const mrrData = [
  { month: "Jun", revenue: 4200 },
  { month: "Jul", revenue: 5100 },
  { month: "Ago", revenue: 6800 },
  { month: "Set", revenue: 7500 },
  { month: "Out", revenue: 8900 },
];

const statusColors = {
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  refunded: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const statusLabels = {
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
  pending: "Aguardando",
};

// Cohort data
const cohortData = [
  { month: "Ago/24", month0: 100, month1: 85, month2: 72, month3: 65 },
  { month: "Set/24", month0: 120, month1: 95, month2: 80, month3: 0 },
  { month: "Out/24", month0: 150, month1: 125, month2: 0, month3: 0 },
  { month: "Nov/24", month0: 180, month1: 0, month2: 0, month3: 0 },
];

// Churned users mock data
const churnedUsers = [
  { id: "1", name: "Ana Costa", email: "ana@empresa.com", churnedAt: "2025-10-05", lastPlan: "Pro", ltv: 582.00 },
  { id: "2", name: "Pedro Santos", email: "pedro@tech.com", churnedAt: "2025-10-10", lastPlan: "Business", ltv: 1164.00 },
  { id: "3", name: "Mariana Souza", email: "mariana@startup.com", churnedAt: "2025-10-15", lastPlan: "Basic", ltv: 291.00 },
];

export default function Financeiro() {
  const [payments, setPayments] = useState(mockPayments);
  const [stats, setStats] = useState(mockStats);
  const [billings] = useState(mockBillings);
  const [guarantees, setGuarantees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [refundDialog, setRefundDialog] = useState<any>(null);
  const [sendBillingDialog, setSendBillingDialog] = useState<any>(null);
  const [winbackDialog, setWinbackDialog] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [retentionCoupons, setRetentionCoupons] = useState<any[]>([]);
  const [editCouponDialog, setEditCouponDialog] = useState<any>(null);
  const [canceledUsers, setCanceledUsers] = useState<any[]>([]);

  useEffect(() => {
    loadRetentionData();
  }, []);

  const loadRetentionData = async () => {
    try {
      // Carregar cupons
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: couponsData } = await supabase.functions.invoke("manage-retention-coupon", {
        body: { action: "list" },
      });

      if (couponsData?.coupons) {
        setRetentionCoupons(couponsData.coupons);
      }

      // Carregar usuários cancelados
      const { data: cancellations } = await supabase
        .from("subscription_cancellations")
        .select(`
          *,
          profiles!inner(name, email)
        `)
        .order("canceled_at", { ascending: false })
        .limit(20);

      if (cancellations) {
        setCanceledUsers(cancellations);
      }
    } catch (error) {
      console.error("Error loading retention data:", error);
    }
  };

  const handleSaveCoupon = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar autenticado");
        return;
      }

      const action = editCouponDialog?.id ? "update" : "create";
      const couponData = editCouponDialog?.id ? {
        couponId: editCouponDialog.id,
        updates: {
          code: editCouponDialog.code,
          discount_percent: editCouponDialog.discount_percent,
          valid_hours: editCouponDialog.valid_hours,
          is_active: editCouponDialog.is_active,
        }
      } : {
        code: editCouponDialog.code,
        discount_percent: editCouponDialog.discount_percent,
        valid_hours: editCouponDialog.valid_hours || 24,
      };

      const { data, error } = await supabase.functions.invoke("manage-retention-coupon", {
        body: { action, couponData },
      });

      if (error) throw error;

      toast.success(`Cupom ${action === 'create' ? 'criado' : 'atualizado'} com sucesso!`);
      setEditCouponDialog(null);
      loadRetentionData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cupom");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = (payment: any) => {
    toast.success('Reembolso processado com sucesso (demo)');
    setRefundDialog(null);
  };

  const handleReview = (guarantee: any, decision: 'approved' | 'rejected') => {
    toast.success(`Solicitação ${decision === 'approved' ? 'aprovada' : 'rejeitada'}`);
    setReviewDialog(null);
    setReviewNotes("");
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header com efeito futurista */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-background p-8 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
              Centro Financeiro
            </h1>
            <p className="text-muted-foreground text-sm">
              Sistema de gestão financeira avançado
            </p>
          </div>
        </div>

        <Tabs defaultValue="pagamentos" className="w-full">
          <TabsList className="w-full md:w-auto glass-card border-border/50 grid grid-cols-4 p-1">
            <TabsTrigger value="pagamentos" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="cobrancas" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Cobranças
            </TabsTrigger>
            <TabsTrigger value="garantia" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Garantia
            </TabsTrigger>
            <TabsTrigger value="retention" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Retenção
            </TabsTrigger>
          </TabsList>

          {/* Pagamentos Tab */}
          <TabsContent value="pagamentos" className="space-y-4 md:space-y-6 mt-4">
            {/* Stats com design futurista */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    MRR
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                    R$ {stats?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    Assinaturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-400 to-green-600 bg-clip-text text-transparent">
                    {stats?.activeSubscriptions || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-yellow-400" />
                    Reembolsos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    {stats?.refundedCount || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    Falhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-red-400 to-red-600 bg-clip-text text-transparent">
                    {stats?.failedCount || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart com design minimalista */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Receita Mensal (MRR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={mrrData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))", 
                        borderRadius: "8px",
                        backdropFilter: "blur(12px)"
                      }} 
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Filters com design minimalista */}
            <Card className="glass-card border-border/30">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar transações..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="pl-10 glass-card border-border/50"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[180px] glass-card border-border/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paid">Pagos</SelectItem>
                      <SelectItem value="failed">Falharam</SelectItem>
                      <SelectItem value="refunded">Reembolsados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table com design minimalista */}
            <Card className="glass-card border-border/30">
              <CardContent className="pt-6 overflow-x-auto">
                <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 hover:bg-transparent">
                        <TableHead className="text-muted-foreground text-xs font-medium">ID</TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">Cliente</TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">App</TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">Valor</TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">Status</TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">Data</TableHead>
                        <TableHead className="text-muted-foreground text-xs font-medium">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id} className="border-border/30 hover:bg-muted/10 transition-colors">
                          <TableCell className="text-foreground font-medium text-xs font-mono">
                            {payment.id.substring(0, 12)}...
                          </TableCell>
                          <TableCell className="text-xs">
                            <div>
                              <p className="text-foreground font-medium">{payment.customerName}</p>
                              <p className="text-xs text-muted-foreground">{payment.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <AppBadge appTypes={payment.appType} size="sm" />
                          </TableCell>
                          <TableCell className="text-foreground font-medium text-xs">
                            {payment.currency} {payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[payment.status]}>{statusLabels[payment.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {new Date(payment.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {payment.status === "paid" && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleRefund(payment)}
                                className="text-yellow-400 hover:text-yellow-500 hover:bg-yellow-500/10"
                              >
                                Reembolsar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cobranças Tab */}
          <TabsContent value="cobrancas" className="space-y-6 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground">Inadimplentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-yellow-400 to-yellow-600 bg-clip-text text-transparent">1</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground">Recuperados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-400 to-green-600 bg-clip-text text-transparent">1</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground">Falhas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-red-400 to-red-600 bg-clip-text text-transparent">1</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground">Taxa de Sucesso</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">75%</p>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card className="glass-card border-border/30">
              <CardContent className="pt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs font-medium">ID</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-medium">Usuário</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-medium">Valor</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-medium">Vencimento</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-medium">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billings.map((billing) => (
                      <TableRow key={billing.id} className="border-border/30 hover:bg-muted/10">
                        <TableCell className="text-foreground font-medium text-xs">{billing.id}</TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <p className="text-foreground font-medium">{billing.userName}</p>
                            <p className="text-xs text-muted-foreground">{billing.userEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground font-medium text-xs">R$ {billing.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[billing.status]}>{statusLabels[billing.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{billing.dueDate}</TableCell>
                        <TableCell>
                          {billing.status !== "paid" && (
                            <Button size="sm" variant="ghost" onClick={() => setSendBillingDialog(billing)} className="hover:bg-primary/10 hover:text-primary">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Garantia Tab */}
          <TabsContent value="garantia" className="space-y-6 mt-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-yellow-400 to-yellow-600 bg-clip-text text-transparent">0</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Aprovados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-400 to-green-600 bg-clip-text text-transparent">0</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    Rejeitados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-red-400 to-red-600 bg-clip-text text-transparent">0</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Taxa Aprovação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">0%</p>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-foreground">Política de Garantia</h3>
                    <p className="text-sm text-muted-foreground">
                      Clientes têm direito a reembolso total em até 3 dias após contratação.
                      Analise cada caso verificando os dias de uso e o motivo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/30">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma solicitação de garantia no momento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retenção e Win-back Tab */}
          <TabsContent value="retention" className="space-y-6 mt-6">
            {/* Stats com design futurista */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-400" />
                    Churn Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-red-400 to-red-600 bg-clip-text text-transparent">12.5%</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-400" />
                    Taxa Reativação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-400 to-green-600 bg-clip-text text-transparent">18.2%</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <Gift className="h-4 w-4 text-purple-400" />
                    Cupons Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent">8</p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    LTV Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">R$ 679</p>
                </CardContent>
              </Card>
            </div>

            {/* Mensagens de Retenção */}
            <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Mensagens de Retenção
                  </CardTitle>
                  <Badge className="bg-primary/20 text-primary border-primary/30">Sistema Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* WhatsApp Message Template */}
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <MessageSquare className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                        Modelo WhatsApp
                        <Badge variant="outline" className="text-xs">Automático</Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground">Enviado quando usuário demonstra intenção de cancelamento</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <p className="text-sm text-foreground leading-relaxed">
                      🎁 <strong>Olá [NOME]!</strong><br /><br />
                      Notamos que você está pensando em cancelar sua assinatura. Sentimos muito por isso! 😔<br /><br />
                      Como um agradecimento especial, preparamos uma <strong>oferta exclusiva de 40% de desconto</strong> válida apenas para você!<br /><br />
                      💰 Use o cupom: <strong className="text-primary">VOLTE40</strong><br />
                      ⏰ Válido por 48 horas<br /><br />
                      Clique aqui para aproveitar: [LINK]
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Editar Mensagem
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Teste de Envio
                    </Button>
                  </div>
                </div>

                {/* Email Template */}
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Mail className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                        Modelo E-mail
                        <Badge variant="outline" className="text-xs">Automático</Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground">Enviado em conjunto com o WhatsApp para maior alcance</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-foreground">Assunto: 🎁 Oferta Especial: 40% OFF só para você!</p>
                      <div className="text-foreground leading-relaxed pt-2">
                        <p className="mb-3">Olá <strong>[NOME]</strong>,</p>
                        <p className="mb-3">Notamos que você está considerando cancelar sua assinatura e gostaríamos de oferecer algo especial antes de você partir.</p>
                        <div className="my-4 p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
                          <p className="text-center">
                            <span className="text-2xl font-bold text-primary">40% DE DESCONTO</span><br />
                            <span className="text-xs text-muted-foreground">Use o cupom: <strong className="text-primary">VOLTE40</strong></span>
                          </p>
                        </div>
                        <p className="mb-2">✨ Benefícios que você vai manter:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-3">
                          <li>Automações ilimitadas</li>
                          <li>IA avançada</li>
                          <li>Suporte prioritário</li>
                          <li>Analytics em tempo real</li>
                        </ul>
                        <p className="text-xs text-muted-foreground">⏰ Esta oferta expira em 48 horas</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      Editar E-mail
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs">
                      Teste de Envio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cohort Analysis */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Análise de Cohort (Retenção %)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30">
                        <TableHead className="text-muted-foreground">Cohort</TableHead>
                        <TableHead className="text-muted-foreground text-center">Mês 0</TableHead>
                        <TableHead className="text-muted-foreground text-center">Mês 1</TableHead>
                        <TableHead className="text-muted-foreground text-center">Mês 2</TableHead>
                        <TableHead className="text-muted-foreground text-center">Mês 3</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cohortData.map((cohort) => (
                        <TableRow key={cohort.month} className="border-border/30">
                          <TableCell className="text-foreground font-medium">{cohort.month}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                              {cohort.month0}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {cohort.month1 > 0 ? (
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                                {cohort.month1}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {cohort.month2 > 0 ? (
                              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                {cohort.month2}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {cohort.month3 > 0 ? (
                              <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                                {cohort.month3}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Gerenciar Cupons de Retenção */}
            <Card className="glass-card border-border/30 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    Cupons de Retenção
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setEditCouponDialog({ code: "", discount_percent: 40, valid_hours: 24, is_active: true })}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    Criar Cupom
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30">
                      <TableHead className="text-muted-foreground">Código</TableHead>
                      <TableHead className="text-muted-foreground">Desconto</TableHead>
                      <TableHead className="text-muted-foreground">Validade</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retentionCoupons.map((coupon) => (
                      <TableRow key={coupon.id} className="border-border/30 hover:bg-muted/20">
                        <TableCell className="text-foreground font-medium font-mono">{coupon.code}</TableCell>
                        <TableCell className="text-primary font-semibold">{coupon.discount_percent}%</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{coupon.valid_hours}h</TableCell>
                        <TableCell>
                          {coupon.is_active ? (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Ativo</Badge>
                          ) : (
                            <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/30">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditCouponDialog(coupon)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Churned Users - Win-back Campaign */}
            <Card className="glass-card border-border/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-400" />
                  Usuários que Cancelaram Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30">
                      <TableHead className="text-muted-foreground">Usuário</TableHead>
                      <TableHead className="text-muted-foreground">Email</TableHead>
                      <TableHead className="text-muted-foreground">Data Cancelamento</TableHead>
                      <TableHead className="text-muted-foreground">Plano</TableHead>
                      <TableHead className="text-muted-foreground">App</TableHead>
                      <TableHead className="text-muted-foreground">Cupom Enviado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {canceledUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum cancelamento registrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      canceledUsers.map((cancellation: any) => (
                        <TableRow key={cancellation.id} className="border-border/30 hover:bg-muted/20">
                          <TableCell>
                            <p className="text-foreground font-medium text-sm">{cancellation.profiles?.name || "N/A"}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground">{cancellation.user_email}</p>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(cancellation.canceled_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border/50">
                              {cancellation.plan_name || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <AppBadge appTypes={cancellation.app_type || []} size="sm" />
                          </TableCell>
                          <TableCell>
                            {cancellation.coupon_sent ? (
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Enviado
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Refund Dialog */}
      <Dialog open={!!refundDialog} onOpenChange={() => setRefundDialog(null)}>
        <DialogContent className="glass-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirmar Reembolso</DialogTitle>
          </DialogHeader>
          {refundDialog && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Confirmar reembolso de <span className="text-foreground font-medium">R$ {refundDialog.amount.toFixed(2)}</span>?
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(null)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Reembolso processado"); setRefundDialog(null); }} className="bg-gradient-to-r from-primary to-accent">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Billing Dialog */}
      <Dialog open={!!sendBillingDialog} onOpenChange={() => setSendBillingDialog(null)}>
        <DialogContent className="glass-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-foreground">Enviar Cobrança</DialogTitle>
          </DialogHeader>
          {sendBillingDialog && (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">Enviar cobrança para <span className="text-foreground font-medium">{sendBillingDialog.userName}</span></p>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => { toast.success("Enviado via WhatsApp"); setSendBillingDialog(null); }} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={() => { toast.success("Enviado via E-mail"); setSendBillingDialog(null); }} className="border-border/50">
                  <Mail className="mr-2 h-4 w-4" />
                  E-mail
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Win-back Campaign Dialog */}
      <Dialog open={!!winbackDialog} onOpenChange={() => setWinbackDialog(null)}>
        <DialogContent className="glass-card border-primary/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Gift className="h-6 w-6 text-primary" />
              Campanha Win-back
            </DialogTitle>
          </DialogHeader>
          {winbackDialog && (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  Enviar oferta especial para <span className="font-medium text-primary">{winbackDialog.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  LTV: R$ {winbackDialog.ltv.toFixed(2)} • Último plano: {winbackDialog.lastPlan}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Código do Cupom</Label>
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ex: VOLTEPRANÓS20"
                    className="glass-card border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Desconto (%)</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseInt(e.target.value))}
                    min={5}
                    max={100}
                    className="glass-card border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Mensagem Personalizada</Label>
                  <Textarea
                    placeholder="Sentimos sua falta! Como agradecimento, preparamos uma oferta especial..."
                    rows={4}
                    className="glass-card border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/30">
                <Button 
                  className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30" 
                  onClick={() => { toast.success(`WhatsApp enviado para ${winbackDialog.name}!`); setWinbackDialog(null); }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar via WhatsApp
                </Button>
                <Button 
                  className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                  onClick={() => { toast.success(`E-mail enviado para ${winbackDialog.name}!`); setWinbackDialog(null); }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar via E-mail
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90" 
                  onClick={() => { toast.success(`Oferta enviada via WhatsApp e E-mail para ${winbackDialog.name}!`); setWinbackDialog(null); }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Ambos (WhatsApp + E-mail)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={!!editCouponDialog} onOpenChange={() => setEditCouponDialog(null)}>
        <DialogContent className="glass-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              {editCouponDialog?.id ? "Editar Cupom" : "Criar Cupom"}
            </DialogTitle>
          </DialogHeader>
          {editCouponDialog && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <Input
                  value={editCouponDialog.code}
                  onChange={(e) => setEditCouponDialog({ ...editCouponDialog, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: VOLTE40"
                  className="glass-card border-border/50 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input
                  type="number"
                  value={editCouponDialog.discount_percent}
                  onChange={(e) => setEditCouponDialog({ ...editCouponDialog, discount_percent: parseInt(e.target.value) })}
                  min={1}
                  max={100}
                  className="glass-card border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Validade (horas)</Label>
                <Input
                  type="number"
                  value={editCouponDialog.valid_hours}
                  onChange={(e) => setEditCouponDialog({ ...editCouponDialog, valid_hours: parseInt(e.target.value) })}
                  min={1}
                  className="glass-card border-border/50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editCouponDialog.is_active}
                  onChange={(e) => setEditCouponDialog({ ...editCouponDialog, is_active: e.target.checked })}
                  className="rounded border-border/50"
                />
                <Label htmlFor="is_active" className="cursor-pointer">Cupom Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCouponDialog(null)}>Cancelar</Button>
            <Button 
              onClick={handleSaveCoupon} 
              disabled={loading}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {loading ? "Salvando..." : "Salvar Cupom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
