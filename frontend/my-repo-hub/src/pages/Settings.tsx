import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TeamManagement } from "@/components/settings/TeamManagement";
import { Save, CreditCard, Calendar, AlertCircle, Loader2, CheckCircle, User, Mail, Phone, Building, Settings as SettingsIcon, TrendingUp, Zap, Shield, Ticket, HelpCircle, Clock, Send, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionStatus } from "@/lib/subscription";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile fields
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [autoReply, setAutoReply] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Support states
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  useEffect(() => {
    checkSubscription();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserName(profile.name || "");
        setUserEmail(profile.email || "");
        setUserPhone(profile.phone || "");
        setCompanyName(profile.company_name || "");
        setCompanyWebsite(profile.company_website || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Login necessário");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: userName,
          email: userEmail,
          phone: userPhone,
          company_name: companyName,
          company_website: companyWebsite,
          bio: bio,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingLogo(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success("Logo atualizado com sucesso!");
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error("Erro ao atualizar logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const status = await getSubscriptionStatus();
      setSubscription(status);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Abrindo portal de gerenciamento...");
      }
    } catch (error: any) {
      console.error("Error opening portal:", error);
      toast.error(error.message || "Erro ao abrir portal");
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketCategory || !ticketMessage.trim()) {
      toast.error("Preencha todos os campos do ticket");
      return;
    }

    setSubmittingTicket(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: ticketSubject,
        category: ticketCategory,
        message: ticketMessage,
        status: 'new',
        priority: 'medium'
      });

      if (error) throw error;
      
      toast.success("Ticket aberto com sucesso! Nossa equipe entrará em contato em breve.");
      setTicketSubject("");
      setTicketCategory("");
      setTicketMessage("");
      setIsTicketDialogOpen(false);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error("Erro ao enviar ticket. Tente novamente.");
    } finally {
      setSubmittingTicket(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <SettingsIcon className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua conta, integrações e preferências
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-xl bg-background/70 border-purple-500/20 p-6 shadow-lg">
            <Tabs defaultValue="general">
          <TabsList className="grid w-full max-w-lg grid-cols-4 mb-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="security">Assinatura</TabsTrigger>
            <TabsTrigger value="support">Suporte</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="space-y-6">
              {/* Logo da Empresa */}
              <Card className="p-6 bg-card/50 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4">Logo da Empresa</h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG ou GIF (max. 2MB)
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Informações Pessoais */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="userName">Nome Completo</Label>
                      <Input
                        id="userName"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Seu nome"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="userEmail">E-mail</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="userEmail"
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="userPhone">Telefone</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="userPhone"
                        type="tel"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      className="mt-2 min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {bio.length} / 500 caracteres
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações da Empresa */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Informações da Empresa
                </h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="companyName">Nome da Empresa</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nome da sua empresa"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyWebsite">Website da Empresa</Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://suaempresa.com.br"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Preferências */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Preferências</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div>
                      <Label className="font-medium">Respostas Automáticas</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ativar respostas automáticas para mensagens
                      </p>
                    </div>
                    <Switch
                      checked={autoReply}
                      onCheckedChange={setAutoReply}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div>
                      <Label className="font-medium">Notificações Push</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receber notificações em tempo real
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                </div>
              </div>
              
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="btn-glow"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Status da Assinatura */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status da Assinatura</h3>
                  
                  {subscription?.subscribed ? (
                    <Card className="p-6 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border-green-500/30 backdrop-blur-xl">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-green-500/20 backdrop-blur-xl border border-green-500/30 p-3">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">Assinatura Ativa</p>
                            <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30">
                              {subscription.product_id === "prod_RtFfhGhXkYlQdO" ? "Plano Bronze" :
                               subscription.product_id === "prod_RtFgn6rWQh3lF0" ? "Plano Prata" :
                               subscription.product_id === "prod_RtFhXkGPU9cAH7" ? "Plano Ouro" :
                               subscription.plan === "annual" ? "Plano Anual" : "Plano Mensal"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {subscription.subscription_end && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Próxima cobrança: {new Date(subscription.subscription_end).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button
                          onClick={handleManageSubscription}
                          disabled={managingSubscription}
                          variant="outline"
                        >
                          {managingSubscription ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Gerenciar Assinatura
                        </Button>
                        <Button
                          onClick={() => navigate("/payment")}
                          variant="outline"
                        >
                          Alterar Plano
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-6 border-yellow-500/50 bg-yellow-500/5">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold">Nenhuma assinatura ativa</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Assine um plano para ter acesso completo à plataforma
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => navigate("/payment")} className="btn-glow">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Ver Planos
                      </Button>
                    </Card>
                  )}
                </div>

                {/* Histórico de Pagamentos */}
                {subscription?.subscribed && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h3>
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Clique em "Gerenciar Assinatura" acima para ver seu histórico completo de pagamentos, 
                        faturas e recibos no portal Stripe.
                      </p>
                      <Button
                        onClick={handleManageSubscription}
                        disabled={managingSubscription}
                        variant="outline"
                        size="sm"
                      >
                        {managingSubscription ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Ver Histórico Completo
                      </Button>
                    </Card>
                  </div>
                )}

                {/* Cancelar Assinatura */}
                {subscription?.subscribed && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-destructive">Zona de Perigo</h3>
                    <Card className="p-6 border-destructive/50">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                          <p className="font-semibold">Cancelar Assinatura</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Para cancelar sua assinatura, use o portal de gerenciamento. 
                            Você continuará tendo acesso até o final do período pago.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleManageSubscription}
                        disabled={managingSubscription}
                        variant="destructive"
                      >
                        {managingSubscription ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-2" />
                        )}
                        Cancelar Assinatura
                      </Button>
                    </Card>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <div className="space-y-6">
              {/* Opções de Suporte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Abrir Ticket */}
                <Card className="p-6 glass-card border-purple-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 p-3">
                      <Ticket className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Abrir Ticket</h3>
                      <p className="text-sm text-muted-foreground">Reporte problemas</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Nossa equipe responde em até 24h
                  </p>

                  <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full btn-glow">
                      <Ticket className="h-4 w-4 mr-2" />
                      Criar Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Abrir Ticket de Suporte</DialogTitle>
                      <DialogDescription>
                        Descreva seu problema ou sugestão. Nossa equipe responderá em breve.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="ticket-subject">Assunto</Label>
                        <Input
                          id="ticket-subject"
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="Ex: Problema com pagamento"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ticket-category">Categoria</Label>
                        <Select value={ticketCategory} onValueChange={setTicketCategory}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="billing">Financeiro</SelectItem>
                            <SelectItem value="technical">Técnico</SelectItem>
                            <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                            <SelectItem value="bug">Reportar Bug</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ticket-message">Mensagem</Label>
                        <Textarea
                          id="ticket-message"
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Descreva seu problema ou sugestão..."
                          className="mt-2 min-h-[150px]"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmitTicket} 
                        disabled={submittingTicket}
                        className="w-full btn-glow"
                      >
                        {submittingTicket ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Ticket
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Resposta em até 24h</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* FAQ Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Perguntas Frequentes
                </h3>
                <Card className="p-6 glass-card">
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold mb-1">⏱️ Quanto tempo leva para responder?</p>
                      <p className="text-muted-foreground">Nossa equipe responde tickets em até 24 horas úteis.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">📧 Como acompanho meu ticket?</p>
                      <p className="text-muted-foreground">Você receberá atualizações por e-mail sobre seu ticket.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">🔧 Que tipo de suporte vocês oferecem?</p>
                      <p className="text-muted-foreground">Suporte técnico, financeiro, bugs e sugestões de funcionalidades.</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* FAQ Rápido */}
              <Card className="p-6 glass-card border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Perguntas Frequentes</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <p className="font-medium text-sm">Como faço para alterar meu plano?</p>
                  <p className="text-xs text-muted-foreground mt-1">Acesse a aba "Assinatura" e clique em "Alterar Plano"</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <p className="font-medium text-sm">Como conectar minhas redes sociais?</p>
                  <p className="text-xs text-muted-foreground mt-1">Vá em Conexões no menu lateral e siga as instruções</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <p className="font-medium text-sm">Posso cancelar minha assinatura?</p>
                  <p className="text-xs text-muted-foreground mt-1">Sim, acesse "Gerenciar Assinatura" na aba de Assinatura</p>
                </div>
                </div>
              </Card>
            </div>
          </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-4">
          {/* Account Summary */}
          <Card className="glass-card p-5 border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary/10 p-2.5">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Resumo da Conta</h3>
                <p className="text-xs text-muted-foreground">Suas informações</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium truncate ml-2">{userName || "Não informado"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium truncate ml-2">{userEmail || "Não informado"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Plano:</span>
                <Badge variant={subscription?.subscribed ? "default" : "secondary"}>
                  {subscription?.subscribed 
                    ? (subscription.product_id || subscription.plan === "annual" ? "Anual" : "Mensal")
                    : "Gratuito"
                  }
                </Badge>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card p-5 border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-accent/10 p-2.5">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold">Ações Rápidas</h3>
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => navigate("/chat-ia")}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Chat IA
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => navigate("/analytics")}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => navigate("/connections")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Conexões
              </Button>
            </div>
          </Card>

          {/* Tips */}
          <Card className="glass-card p-5 border-border/50 bg-primary/5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Dica do Dia
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Conecte todas as suas redes sociais em um só lugar! 
              Acesse Conexões no menu lateral para gerenciar Instagram, WhatsApp, Facebook e muito mais.
            </p>
          </Card>

          {/* Status */}
          {subscription?.subscribed && subscription.subscription_end && (
            <Card className="glass-card p-5 border-border/50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Próxima Renovação
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Sua assinatura será renovada em:
              </p>
              <p className="text-lg font-bold text-primary">
                {new Date(subscription.subscription_end).toLocaleDateString("pt-BR", { 
                  day: "2-digit", 
                  month: "long", 
                  year: "numeric" 
                })}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
