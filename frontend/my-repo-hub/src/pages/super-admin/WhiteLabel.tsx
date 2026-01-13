import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette, Upload, Code, Settings2, Sparkles, Building2, Crown, Eye, Users, TrendingUp, Calendar, Edit3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WhiteLabel() {
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [brandName, setBrandName] = useState("SocialFlow");
  const [primaryColor, setPrimaryColor] = useState("#a855f7");
  const [secondaryColor, setSecondaryColor] = useState("#ec4899");
  const [customDomain, setCustomDomain] = useState("");
  const [hideCredits, setHideCredits] = useState(false);
  const [customFooter, setCustomFooter] = useState("");
  const [managingAgency, setManagingAgency] = useState<any>(null);

  const handleSave = () => {
    toast.success("Configurações de White Label salvas com sucesso!");
  };

  const handlePreview = () => {
    toast.info("Abrindo preview em nova aba...");
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">White Label</h1>
                <p className="text-muted-foreground mt-1">Personalize a plataforma para suas agências</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview} className="border-primary/30">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSave} className="btn-glow">
              <Sparkles className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Agências Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">12</p>
              <p className="text-xs text-muted-foreground mt-1">+3 este mês</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Receita Recorrente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">R$ 24.8k</p>
              <p className="text-xs text-green-400 mt-1">+18% vs mês anterior</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Clientes Finais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">347</p>
              <p className="text-xs text-muted-foreground mt-1">gerenciados pelas agências</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Taxa de Retenção</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">94%</p>
              <p className="text-xs text-muted-foreground mt-1">últimos 12 meses</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="branding" className="w-full">
          <TabsList className="glass-card border border-border">
            <TabsTrigger value="branding" className="data-[state=active]:bg-primary/20">
              <Palette className="mr-2 h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="domain" className="data-[state=active]:bg-primary/20">
              <Building2 className="mr-2 h-4 w-4" />
              Domínio
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-primary/20">
              <Code className="mr-2 h-4 w-4" />
              Avançado
            </TabsTrigger>
            <TabsTrigger value="agencies" className="data-[state=active]:bg-primary/20">
              <Settings2 className="mr-2 h-4 w-4" />
              Agências
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Identidade Visual
                </CardTitle>
                <CardDescription>Configure a aparência da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Logo Principal</Label>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://exemplo.com/logo.png"
                        className="bg-muted/30 border-border"
                      />
                    </div>
                    <Button variant="outline" className="border-primary/30">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recomendado: PNG/SVG, fundo transparente, 200x50px
                  </p>
                </div>

                {/* Favicon */}
                <div className="space-y-3">
                  <Label>Favicon</Label>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Input
                        value={faviconUrl}
                        onChange={(e) => setFaviconUrl(e.target.value)}
                        placeholder="https://exemplo.com/favicon.ico"
                        className="bg-muted/30 border-border"
                      />
                    </div>
                    <Button variant="outline" className="border-primary/30">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formato: ICO, 32x32px
                  </p>
                </div>

                {/* Brand Name */}
                <div className="space-y-3">
                  <Label>Nome da Marca</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="SocialFlow"
                    className="bg-muted/30 border-border"
                  />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Cor Primária</Label>
                    <div className="flex gap-3">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 bg-muted/30 border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Cor Secundária</Label>
                    <div className="flex gap-3">
                      <Input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 bg-muted/30 border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-muted/20 border border-border rounded-lg p-6">
                  <p className="text-sm font-semibold mb-4">Preview</p>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-32 h-32 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    >
                      {brandName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold" style={{ color: primaryColor }}>{brandName}</h3>
                      <p className="text-muted-foreground mt-1">Plataforma de Automação Social</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" style={{ background: primaryColor }}>Botão Primário</Button>
                        <Button size="sm" variant="outline" style={{ borderColor: secondaryColor, color: secondaryColor }}>
                          Botão Secundário
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain Tab */}
          <TabsContent value="domain" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Domínio Personalizado
                </CardTitle>
                <CardDescription>Configure seu domínio próprio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Domínio Personalizado</Label>
                  <Input
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="app.suaagencia.com.br"
                    className="bg-muted/30 border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Configure os registros DNS apontando para nossos servidores
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-300 mb-2">Configuração DNS Necessária:</p>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground">Tipo:</span> <span className="text-blue-300">CNAME</span>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground">Nome:</span> <span className="text-blue-300">app</span>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground">Valor:</span> <span className="text-blue-300">socialflow.app.proxy.com</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full btn-glow">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Verificar Domínio
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Configurações Avançadas
                </CardTitle>
                <CardDescription>Personalize elementos técnicos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                  <div>
                    <p className="font-semibold">Ocultar Créditos "Powered by"</p>
                    <p className="text-sm text-muted-foreground">Remove menções à plataforma original</p>
                  </div>
                  <Switch checked={hideCredits} onCheckedChange={setHideCredits} />
                </div>

                <div className="space-y-3">
                  <Label>Rodapé Personalizado (HTML)</Label>
                  <Textarea
                    value={customFooter}
                    onChange={(e) => setCustomFooter(e.target.value)}
                    placeholder='<p>© 2024 Sua Agência. Todos os direitos reservados.</p>'
                    className="bg-muted/30 border-border font-mono text-xs min-h-[120px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label>CSS Customizado (opcional)</Label>
                  <Textarea
                    placeholder=".custom-class { color: #a855f7; }"
                    className="bg-muted/30 border-border font-mono text-xs min-h-[120px]"
                  />
                  <p className="text-xs text-yellow-400 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Use com cautela: CSS inválido pode quebrar o layout
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agencies Tab */}
          <TabsContent value="agencies" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Agências White Label
                </CardTitle>
                <CardDescription>Gerencie suas agências parceiras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Marketing Pro Agency", clients: 45, mrr: "R$ 4.8k", status: "active" },
                    { name: "Digital Solutions", clients: 32, mrr: "R$ 3.2k", status: "active" },
                    { name: "Social Media Experts", clients: 28, mrr: "R$ 2.9k", status: "active" },
                  ].map((agency, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">
                          {agency.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{agency.name}</p>
                          <p className="text-sm text-muted-foreground">{agency.clients} clientes ativos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-primary">{agency.mrr}</p>
                          <p className="text-xs text-muted-foreground">MRR</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Ativo
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-primary/30 hover:bg-primary/10"
                          onClick={() => setManagingAgency(agency)}
                        >
                          <Edit3 className="mr-1 h-3 w-3" />
                          Gerenciar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4 btn-glow">
                  <Building2 className="mr-2 h-4 w-4" />
                  Adicionar Nova Agência
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Agency Management Modal */}
        <Dialog open={!!managingAgency} onOpenChange={() => setManagingAgency(null)}>
          <DialogContent className="glass-card max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Gerenciar: {managingAgency?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="glass-card border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{managingAgency?.clients}</p>
                        <p className="text-xs text-muted-foreground">Clientes Ativos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card border-accent/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-accent" />
                      <div>
                        <p className="text-2xl font-bold text-accent">{managingAgency?.mrr}</p>
                        <p className="text-xs text-muted-foreground">MRR Atual</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card border-green-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-green-400">94%</p>
                        <p className="text-xs text-muted-foreground">Retenção</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings */}
              <Tabs defaultValue="config" className="w-full">
                <TabsList className="glass-card border border-border">
                  <TabsTrigger value="config">Configurações</TabsTrigger>
                  <TabsTrigger value="billing">Faturamento</TabsTrigger>
                  <TabsTrigger value="clients">Clientes</TabsTrigger>
                  <TabsTrigger value="limits">Limites & Recursos</TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <Label>Domínio Personalizado</Label>
                    <Input 
                      defaultValue={`${managingAgency?.name.toLowerCase().replace(/\s+/g, '')}.socialflow.app`}
                      className="bg-muted/30 border-border"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label>Cor Primária</Label>
                    <div className="flex gap-3">
                      <Input type="color" defaultValue="#a855f7" className="w-20" />
                      <Input defaultValue="#a855f7" className="flex-1 bg-muted/30 border-border" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div>
                      <p className="font-semibold">Acesso API</p>
                      <p className="text-sm text-muted-foreground">Permitir acesso à API da agência</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Plano Atual</Label>
                      <Input value="Enterprise" className="bg-muted/30 border-border" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Próxima Cobrança</Label>
                      <Input value="05/11/2025" className="bg-muted/30 border-border" disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Comissão (%)</Label>
                    <Input type="number" defaultValue="20" className="bg-muted/30 border-border" />
                  </div>
                </TabsContent>

                <TabsContent value="clients" className="mt-4">
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg" />
                          <div>
                            <p className="font-semibold">Cliente {i}</p>
                            <p className="text-xs text-muted-foreground">cliente{i}@email.com</p>
                          </div>
                        </div>
                        <Badge>Ativo</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="limits" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Limite de Usuários</Label>
                    <Input type="number" defaultValue="100" className="bg-muted/30 border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tokens IA (mensal)</Label>
                    <Input type="number" defaultValue="500000" className="bg-muted/30 border-border" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div>
                      <p className="font-semibold">Automações Ilimitadas</p>
                      <p className="text-sm text-muted-foreground">Sem limite de fluxos automáticos</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setManagingAgency(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1 btn-glow" onClick={() => {
                  toast.success("Configurações salvas!");
                  setManagingAgency(null);
                }}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}