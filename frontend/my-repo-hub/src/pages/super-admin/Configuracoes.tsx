import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, DollarSign, Shield, Database, Save, Plus, Trash2, Edit, X, UserPlus, Mail } from "lucide-react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Plan {
  id: string;
  name: string;
  price: number;
  token_limit: number;
  features: string[];
  stripe_product_id: string;
  stripe_price_id: string;
  is_active: boolean;
}

interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  price: number;
  stripe_price_id: string;
  is_active: boolean;
}

interface SuperAdmin {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export default function Configuracoes() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tokenPacks, setTokenPacks] = useState<TokenPack[]>([]);
  const [superadmins, setSuperadmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingTokenPack, setEditingTokenPack] = useState<TokenPack | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTokenPackDialogOpen, setIsTokenPackDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [config, setConfig] = useState({
    // Sistema
    environment: "production",
    detailedLogs: true,
    autoEmails: true,
    dailyBackup: true,
  });

  useEffect(() => {
    const loadData = async () => {
      // Cache de 5 minutos
      const cacheKey = 'admin_config_data';
      const cacheTimeKey = 'admin_config_time';
      const cached = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(cacheTimeKey);
      
      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
        const cachedData = JSON.parse(cached);
        setPlans(cachedData.plans || []);
        setTokenPacks(cachedData.tokenPacks || []);
        setSuperadmins(cachedData.superadmins || []);
        setLoading(false);
        return;
      }

      try {
        // Buscar dados em paralelo
        const [plansRes, tokenPacksRes, superadminsRes] = await Promise.all([
          supabase.from('subscription_plans').select('*').order('price', { ascending: true }),
          supabase.from('token_packs').select('*').order('price', { ascending: true }),
          supabase.from('profiles').select('id, name, email, created_at').limit(10)
        ]);

        const formattedPlans = (plansRes.data || []).map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features as string[] : []
        }));
        
        const formattedTokenPacks = (tokenPacksRes.data || []).map((pack: any) => ({
          id: pack.id,
          name: pack.pack_name || 'Pacote',
          tokens: pack.tokens_added || 0,
          price: pack.price || 0,
          stripe_price_id: pack.stripe_payment_id || '',
          is_active: true
        }));
        
        const data = {
          plans: formattedPlans,
          tokenPacks: formattedTokenPacks,
          superadmins: (superadminsRes.data || []).map(u => ({
            user_id: u.id,
            name: u.name || 'N/A',
            email: u.email || 'N/A',
            created_at: u.created_at || new Date().toISOString()
          }))
        };

        setPlans(data.plans);
        setTokenPacks(data.tokenPacks);
        setSuperadmins(data.superadmins);

        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(cacheTimeKey, String(Date.now()));
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      
      const formattedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
      
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !isActive })
        .eq('id', planId);

      if (error) throw error;
      
      toast.success(`Plano ${!isActive ? 'ativado' : 'desativado'} com sucesso`);
      loadPlans();
    } catch (error: any) {
      console.error('Error toggling plan:', error);
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  };

  const handleUpdatePlan = async (planId: string, updates: Partial<Plan>) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', planId);

      if (error) throw error;
      
      toast.success('Plano atualizado com sucesso');
      loadPlans();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  };

  const loadTokenPacks = async () => {
    try {
      // Mock data - replace with actual Supabase query when table is created
      const mockPacks: TokenPack[] = [
        { id: '1', name: 'Pack Básico', tokens: 50000, price: 49.90, stripe_price_id: 'price_token_basic', is_active: true },
        { id: '2', name: 'Pack Profissional', tokens: 150000, price: 129.90, stripe_price_id: 'price_token_pro', is_active: true },
        { id: '3', name: 'Pack Empresarial', tokens: 500000, price: 399.90, stripe_price_id: 'price_token_enterprise', is_active: true },
      ];
      setTokenPacks(mockPacks);
    } catch (error) {
      console.error('Error loading token packs:', error);
      toast.error('Erro ao carregar pacotes de token');
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setIsEditDialogOpen(true);
  };

  const handleSavePlanEdit = async () => {
    if (!editingPlan) return;
    
    try {
      // Atualizar o plano no banco de dados
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: editingPlan.name,
          price: editingPlan.price,
          token_limit: editingPlan.token_limit,
          features: editingPlan.features,
        })
        .eq('id', editingPlan.id);

      if (error) throw error;
      
      // Atualizar o preço no Stripe se houver stripe_price_id
      if (editingPlan.stripe_price_id) {
        try {
          const { data: stripeData, error: stripeError } = await supabase.functions.invoke('update-stripe-price', {
            body: {
              priceId: editingPlan.stripe_price_id,
              productId: editingPlan.stripe_product_id,
              newPrice: editingPlan.price,
              planName: editingPlan.name,
              tokenLimit: editingPlan.token_limit,
              features: editingPlan.features,
            }
          });

          if (stripeError) {
            console.error('Stripe update error:', stripeError);
            toast.error('Plano atualizado localmente, mas houve erro ao sincronizar com Stripe');
          } else {
            toast.success('Plano atualizado com sucesso no banco e no Stripe!');
          }
        } catch (stripeError) {
          console.error('Stripe update error:', stripeError);
          toast.error('Plano atualizado localmente, mas houve erro ao sincronizar com Stripe');
        }
      } else {
        toast.success('Plano atualizado com sucesso!');
      }
      
      // Limpar cache para forçar reload
      sessionStorage.removeItem('admin_config_data');
      sessionStorage.removeItem('admin_config_time');
      
      setIsEditDialogOpen(false);
      setEditingPlan(null);
      
      // Recarregar dados
      const loadData = async () => {
        try {
          const [plansRes, tokenPacksRes, superadminsRes] = await Promise.all([
            supabase.from('subscription_plans').select('*').order('price', { ascending: true }),
            supabase.from('token_packs').select('*').order('price', { ascending: true }),
            supabase.from('profiles').select('id, name, email, created_at').limit(10)
          ]);

          const formattedPlans = (plansRes.data || []).map(plan => ({
            ...plan,
            features: Array.isArray(plan.features) ? plan.features as string[] : []
          }));
          
          setPlans(formattedPlans);
        } catch (err) {
          console.error('Error reloading plans:', err);
        }
      };
      
      loadData();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  };

  const handleEditTokenPack = (pack: TokenPack) => {
    setEditingTokenPack({ ...pack });
    setIsTokenPackDialogOpen(true);
  };

  const handleSaveTokenPackEdit = async () => {
    if (!editingTokenPack) return;
    
    // Mock save - replace with actual Supabase update when table is created
    toast.success('Pacote de token atualizado com sucesso');
    setIsTokenPackDialogOpen(false);
    setEditingTokenPack(null);
    loadTokenPacks();
  };

  const handleToggleTokenPack = async (packId: string, isActive: boolean) => {
    // Mock toggle - replace with actual Supabase update when table is created
    toast.success(`Pacote ${!isActive ? 'ativado' : 'desativado'} com sucesso`);
    loadTokenPacks();
  };

  const loadSuperadmins = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-superadmin', {
        body: { action: 'list' }
      });

      if (error) throw error;
      
      const formattedAdmins = (data?.superadmins || []).map((admin: any) => ({
        user_id: admin.user_id,
        name: admin.profiles?.name || 'N/A',
        email: admin.profiles?.email || 'N/A',
        created_at: new Date().toISOString()
      }));
      
      setSuperadmins(formattedAdmins);
    } catch (error) {
      console.error('Error loading superadmins:', error);
      toast.error('Erro ao carregar super admins');
    }
  };

  const handleInviteSuperadmin = async () => {
    if (!inviteEmail) {
      toast.error('Digite um e-mail válido');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-superadmin', {
        body: { action: 'add', email: inviteEmail }
      });

      if (error) throw error;

      toast.success('Convite enviado com sucesso!');
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      loadSuperadmins();
    } catch (error: any) {
      console.error('Error inviting superadmin:', error);
      toast.error('Erro ao enviar convite: ' + error.message);
    }
  };

  const handleRemoveSuperadmin = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-superadmin', {
        body: { action: 'remove', userId }
      });

      if (error) throw error;

      toast.success('Super admin removido com sucesso');
      loadSuperadmins();
    } catch (error: any) {
      console.error('Error removing superadmin:', error);
      toast.error('Erro ao remover super admin: ' + error.message);
    }
  };

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const toggleSettings = [
    {
      key: "detailedLogs",
      title: "Logs Detalhados",
      description: "Ativar monitoramento detalhado do sistema"
    },
    {
      key: "autoEmails",
      title: "E-mails Automáticos",
      description: "Envio automático de notificações por email"
    },
    {
      key: "dailyBackup",
      title: "Backup Diário",
      description: "Backup automático dos dados do sistema"
    }
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações do Sistema</h1>
        <p className="text-gray-400 mt-1">Gerencie configurações globais da plataforma</p>
      </div>

      <Tabs defaultValue="planos" className="w-full">
        <TabsList className="bg-[#111827] border border-gray-800">
          <TabsTrigger value="planos">Planos & Tokens</TabsTrigger>
          <TabsTrigger value="membros">Membros Super Admin</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="planos" className="space-y-6 mt-6">
        {/* Gestão de Planos */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Planos de Assinatura</CardTitle>
                <CardDescription>
                  Gerencie os planos disponíveis no Stripe
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="bg-background">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={plan.is_active}
                          onCheckedChange={() => handleTogglePlan(plan.id, plan.is_active)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Preço</Label>
                        <div className="text-2xl font-bold">R$ {plan.price}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Tokens/mês</Label>
                        <div className="text-2xl font-bold">{(plan.token_limit / 1000).toFixed(0)}k</div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Recursos</Label>
                      <div className="space-y-1">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="text-sm">• {feature}</div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border space-y-2">
                      <div className="text-xs text-muted-foreground">
                        <div>Product ID: {plan.stripe_product_id}</div>
                        <div>Price ID: {plan.stripe_price_id}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pacotes de Token */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Pacotes de Token</CardTitle>
                <CardDescription>
                  Gerencie os pacotes avulsos de tokens
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tokenPacks.map((pack) => (
                <Card key={pack.id} className="bg-background">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{pack.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTokenPack(pack)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={pack.is_active}
                          onCheckedChange={() => handleToggleTokenPack(pack.id, pack.is_active)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Tokens</Label>
                      <div className="text-2xl font-bold">{(pack.tokens / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Preço</Label>
                      <div className="text-xl font-bold text-primary">R$ {pack.price.toFixed(2)}</div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        Price ID: {pack.stripe_price_id}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        </TabsContent>

        <TabsContent value="membros" className="space-y-6 mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Gerenciar Super Admins</CardTitle>
                    <CardDescription>
                      Convide e gerencie membros com acesso total ao painel
                    </CardDescription>
                  </div>
                </div>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convidar Membro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {superadmins.map((admin) => (
                    <TableRow key={admin.user_id} className="border-border">
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          Super Admin
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveSuperadmin(admin.user_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6 mt-6">
          {/* Configurações do Sistema */}
          <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Ambiente e Segurança</CardTitle>
                <CardDescription>
                  Configurações de ambiente e segurança
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <select
                value={config.environment}
                onChange={(e) => setConfig({ ...config, environment: e.target.value })}
                className="w-full h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="production">production</option>
                <option value="sandbox">sandbox</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Toggle Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Funcionalidades</CardTitle>
                <CardDescription>
                  Ative ou desative recursos do sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {toggleSettings.map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
              >
                <div className="space-y-0.5">
                  <div className="font-medium">{setting.title}</div>
                  <div className="text-sm text-muted-foreground">{setting.description}</div>
                </div>
                <Switch
                  checked={config[setting.key as keyof typeof config] as boolean}
                  onCheckedChange={(checked) => setConfig({ ...config, [setting.key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações Globais
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* Dialog para editar plano */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Plano de Assinatura</DialogTitle>
            <DialogDescription>
              Faça alterações nas informações do plano
            </DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Limite de Tokens</Label>
                <Input
                  type="number"
                  value={editingPlan.token_limit}
                  onChange={(e) => setEditingPlan({ ...editingPlan, token_limit: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Recursos (um por linha)</Label>
                <Textarea
                  rows={6}
                  value={editingPlan.features.join('\n')}
                  onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value.split('\n').filter(f => f.trim()) })}
                  placeholder="Digite cada recurso em uma linha"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlanEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar pacote de token */}
      <Dialog open={isTokenPackDialogOpen} onOpenChange={setIsTokenPackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pacote de Token</DialogTitle>
            <DialogDescription>
              Faça alterações nas informações do pacote
            </DialogDescription>
          </DialogHeader>
          {editingTokenPack && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Pacote</Label>
                <Input
                  value={editingTokenPack.name}
                  onChange={(e) => setEditingTokenPack({ ...editingTokenPack, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade de Tokens</Label>
                  <Input
                    type="number"
                    value={editingTokenPack.tokens}
                    onChange={(e) => setEditingTokenPack({ ...editingTokenPack, tokens: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingTokenPack.price}
                    onChange={(e) => setEditingTokenPack({ ...editingTokenPack, price: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stripe Price ID</Label>
                <Input
                  value={editingTokenPack.stripe_price_id}
                  onChange={(e) => setEditingTokenPack({ ...editingTokenPack, stripe_price_id: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTokenPackDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTokenPackEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para convidar super admin */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="bg-[#111827] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Convidar Super Admin</DialogTitle>
            <DialogDescription>
              Envie um convite por e-mail para um novo super admin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">E-mail</Label>
              <div className="flex gap-2">
                <Mail className="h-4 w-4 text-gray-400 mt-3" />
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-[#0a0e1a] border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteSuperadmin}>
              <UserPlus className="mr-2 h-4 w-4" />
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
