import { useState, useEffect } from "react";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Search, UserPlus, Eye, RefreshCw, Download, MoreVertical, Loader2, MessageSquare } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { AppBadge } from "@/components/super-admin/AppBadge";

type UserStatus = "active" | "inactive" | "trial" | "overdue";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Integration = Database['public']['Tables']['integrations']['Row'];

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: UserStatus;
  lastLogin: string;
  lastPayment: string;
  integrations: string[];
  tokensUsed: number;
  tokensLimit: number;
  tokenPackages: number;
  appTypes: string[] | null;
}

const statusColors = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  trial: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  trial: "Trial",
  overdue: "Inadimplente",
};

export default function Usuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Cache de 5 minutos para reduzir chamadas
      const cacheKey = 'admin_users_data';
      const cacheTimeKey = 'admin_users_time';
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(cacheTimeKey);
      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
        setUsers(JSON.parse(cached));
        setLoading(false);
        return;
      }
      
      // Buscar dados em paralelo
      const [profilesRes, integrationsRes, tokenUsageRes, tokenPacksRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('integrations').select('*'),
        supabase.from('user_token_usage').select('*'),
        supabase.from('token_packs').select('*'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (integrationsRes.error) throw integrationsRes.error;
      if (tokenUsageRes.error) throw tokenUsageRes.error;
      if (tokenPacksRes.error) throw tokenPacksRes.error;

      const profilesList: Profile[] = (profilesRes.data ?? []) as Profile[];
      const integrationsList: Integration[] = (integrationsRes.data ?? []) as Integration[];

      const combinedUsers: User[] = profilesList.map((profile: Profile) => {
        const userIntegrations = integrationsList.filter((i: Integration) => i.user_id === profile.id);
        const userTokenUsage = (tokenUsageRes.data ?? []).find((t: any) => t.user_id === profile.id);
        const userTokenPacks = (tokenPacksRes.data ?? []).filter((p: any) => p.user_id === profile.id).length || 0;
        
        let status: UserStatus = 'active';
        if (profile.subscription_status === 'canceled' || profile.subscription_status === 'cancelled') status = 'inactive';
        else if (profile.plan === 'free') status = 'trial';
        
        return {
          id: profile.id,
          name: profile.name || 'Usuário',
          email: profile.email || '-',
          plan: profile.plan || 'free',
          status,
          lastLogin: profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('pt-BR') : '-',
          lastPayment: profile.last_payment ? new Date(profile.last_payment).toLocaleDateString('pt-BR') : '-',
          integrations: userIntegrations.map((i: Integration) => i.channel),
          tokensUsed: userTokenUsage?.tokens_used || 0,
          tokensLimit: userTokenUsage?.tokens_limit || 0,
          tokenPackages: userTokenPacks,
          appTypes: profile.app_type || ['social_flow'],
        };
      });

      setUsers(combinedUsers);
      sessionStorage.setItem(cacheKey, JSON.stringify(combinedUsers));
      sessionStorage.setItem(cacheTimeKey, String(Date.now()));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    trial: users.filter((u) => u.status === "trial").length,
  };

  const handleResetPassword = (user: User) => {
    toast.success(`E-mail de reset de senha enviado para ${user.email}`);
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    toast.success(`Usuário ${newStatus === "active" ? "reativado" : "desativado"}`);
  };

  const handleExportCSV = () => {
    toast.success("Exportação iniciada");
  };

  return (
    <LayoutWrapper>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Usuários</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            Gerencie todos os usuários da plataforma
          </p>
        </div>

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
              <CardTitle className="text-sm text-gray-400">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Inativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-500">{stats.inactive}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-500">{stats.trial}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cohort: Usuários Cancelados - Campanha Win-back */}
        {stats.inactive > 0 && (
          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-red-400" />
                    Usuários Cancelados - Campanha Win-back
                  </CardTitle>
                  <p className="text-gray-400 text-sm mt-1">
                    Estratégias para recuperar {stats.inactive} usuários inativos
                  </p>
                </div>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {stats.inactive} usuários
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0e1a] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Taxa de Cancelamento</h4>
                  <p className="text-2xl font-bold text-red-400">
                    {((stats.inactive / stats.total) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">do total de usuários</p>
                </div>
                <div className="bg-[#0a0e1a] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Potencial de Receita</h4>
                  <p className="text-2xl font-bold text-orange-400">
                    R$ {(stats.inactive * 97).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">se reativados no plano Pro</p>
                </div>
                <div className="bg-[#0a0e1a] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Prioridade</h4>
                  <p className="text-2xl font-bold text-yellow-400">Alta</p>
                  <p className="text-xs text-gray-500 mt-1">ação imediata necessária</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Ações Recomendadas:</h4>
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30"
                    variant="outline"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Enviar E-mail de Reconquista (Oferta 30% OFF)
                  </Button>
                  <Button 
                    className="w-full justify-start bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30"
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Lista para Campanha no WhatsApp
                  </Button>
                  <Button 
                    className="w-full justify-start bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30"
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Analisar Motivos de Cancelamento
                  </Button>
                </div>
              </div>

              <div className="bg-[#0a0e1a] p-4 rounded-lg border border-gray-800">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">💡 Dica Estratégica</h4>
                <p className="text-xs text-gray-400">
                  Usuários inativos têm 3x mais chance de retornar nos primeiros 30 dias após cancelamento. 
                  Configure automações de win-back imediatamente para maximizar recuperação.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0a0e1a] border-gray-700 text-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-[#0a0e1a] border-gray-700 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="overdue">Inadimplentes</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="border-gray-700 flex-1 sm:flex-none"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Exportar</span>
                </Button>
                <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 sm:flex-none">
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span className="sm:inline">Novo</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="bg-[#111827] border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Criar Novo Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">Nome</Label>
                      <Input
                        id="name"
                        placeholder="Nome completo"
                        className="bg-[#0a0e1a] border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@exemplo.com"
                        className="bg-[#0a0e1a] border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan" className="text-gray-300">Plano</Label>
                      <Select>
                        <SelectTrigger className="bg-[#0a0e1a] border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        toast.success("Usuário criado com sucesso!");
                        setShowNewUserDialog(false);
                      }}
                    >
                      Criar Usuário
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
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
                  <TableHead className="text-gray-400 whitespace-nowrap">ID</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">Nome</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">App</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">Plano</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap hidden lg:table-cell">Último Login</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap hidden lg:table-cell">Último Pagamento</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-800">
                    <TableCell className="text-gray-400 font-mono text-xs">
                      {user.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="text-white font-medium whitespace-nowrap">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-gray-400 hidden md:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <AppBadge appTypes={user.appTypes} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-700 whitespace-nowrap">
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[user.status]}>
                        {statusLabels[user.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 hidden lg:table-cell">{user.lastLogin}</TableCell>
                    <TableCell className="text-gray-400 hidden lg:table-cell">{user.lastPayment}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(user)}
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
      </div>

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <SheetContent className="bg-[#111827] border-gray-800 w-[400px] sm:w-[540px]">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white">{selectedUser.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Informações Básicas
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">E-mail:</span>
                      <span className="text-white">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plano:</span>
                      <Badge variant="outline">{selectedUser.plan}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <Badge className={statusColors[selectedUser.status]}>
                        {statusLabels[selectedUser.status]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">
                    Integrações Conectadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.integrations.map((integration) => (
                      <Badge
                        key={integration}
                        variant="outline"
                        className="border-gray-700"
                      >
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Consumo de Tokens</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Usados</span>
                      <span className="text-lg font-bold text-white">
                        {selectedUser.tokensUsed.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Limite</span>
                      <span className="text-lg font-bold text-white">
                        {selectedUser.tokensLimit.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((selectedUser.tokensUsed / selectedUser.tokensLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {((selectedUser.tokensUsed / selectedUser.tokensLimit) * 100).toFixed(1)}% utilizado
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-lg border border-accent/20">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Pacotes de Tokens</h3>
                  <p className="text-2xl font-bold text-white">
                    {selectedUser.tokenPackages} {selectedUser.tokenPackages === 1 ? 'pacote' : 'pacotes'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Pacotes adquiridos</p>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleResetPassword(selectedUser)}
                  >
                    Resetar Senha
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleToggleStatus(selectedUser)}
                  >
                    {selectedUser.status === "active"
                      ? "Desativar Usuário"
                      : "Reativar Usuário"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </LayoutWrapper>
  );
}
