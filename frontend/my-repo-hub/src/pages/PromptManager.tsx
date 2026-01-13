import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Sparkles,
  Save,
  TestTube,
  Copy,
  Plus,
  Settings,
  MessageSquare,
  Zap,
  AlertCircle,
  CheckCircle,
  Bot,
  Loader2,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const testScenarios = [
  {
    platform: "whatsapp",
    user: "Cliente",
    message: "Quanto custa o produto X?",
    aiResponse: "Olá! 😊 O produto X está com preço especial de R$ 297 (era R$ 497)! Aproveite, pois é por tempo limitado. Posso te ajudar com mais alguma informação?",
    confidence: 0.92,
  },
  {
    platform: "instagram",
    user: "@usuario",
    message: "Não recebi meu pedido ainda",
    aiResponse: "Oi! Sinto muito por isso! 😔 Vou verificar agora mesmo o status do seu pedido. Pode me informar o número do pedido ou seu CPF por favor?",
    confidence: 0.88,
  },
  {
    platform: "tiktok",
    user: "@gen_z",
    message: "mds que top, querooo",
    aiResponse: "Ahhh que bom que curtiu! 🔥 Tá com desconto BOMBA só hoje! Corre no link da bio que tá acabando! 💨",
    confidence: 0.85,
  },
];

type PromptTemplate = {
  id: string;
  name: string;
  category: string | null;
  prompt: string;
  is_active: boolean | null;
  updated_at?: string;
};

export default function PromptManager() {
  const [mainPrompt, setMainPrompt] = useState(
    "Você é o assistente virtual da [Sua Empresa]. Seu objetivo é proporcionar a melhor experiência ao cliente, sendo sempre prestativo, educado e eficiente. Responda de forma personalizada para cada rede social, adaptando tom e linguagem."
  );
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mainPromptId, setMainPromptId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editedTemplatePrompt, setEditedTemplatePrompt] = useState<string>("");
  const [showExampleDialog, setShowExampleDialog] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templateActionId, setTemplateActionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("");

  useEffect(() => {
    loadMainPrompt();
    loadTemplates();
  }, []);

  const loadMainPrompt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_main', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMainPrompt(data.prompt);
        setMainPromptId(data.id);
      }
    } catch (error) {
      console.error('Erro ao carregar prompt:', error);
    }
  };

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPromptTemplates([]);
        return;
      }

      const { data, error } = await supabase
        .from('ai_prompts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_main', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        prompt: item.prompt,
        is_active: item.is_active,
        updated_at: item.updated_at,
      }));

      setPromptTemplates(parsed);
      if (parsed.length) {
        if (!selectedTemplateId || !parsed.find((tpl) => tpl.id === selectedTemplateId)) {
          setSelectedTemplateId(parsed[0].id);
        }
      } else {
        setSelectedTemplateId(null);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Não foi possível carregar os templates.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleSavePrompt = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (mainPromptId) {
        const { error } = await supabase
          .from('ai_prompts')
          .update({ 
            prompt: mainPrompt,
            updated_at: new Date().toISOString()
          })
          .eq('id', mainPromptId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('ai_prompts')
          .insert({
            user_id: user.id,
            name: 'Prompt Principal',
            prompt: mainPrompt,
            is_main: true,
            category: 'main'
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setMainPromptId(data.id);
      }

      toast.success('Prompt salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar prompt:', error);
      toast.error('Erro ao salvar prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrompt = async () => {
    if (!testInput.trim()) {
      toast.error("Digite uma mensagem para testar");
      return;
    }

    setIsTesting(true);
    setTestResult("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('generate-comment-response', {
        body: {
          comment: testInput,
          platform: 'instagram',
          post: 'Teste do Prompt Manager',
          user: '@tester',
          mainPrompt
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`
        } : {}
      });

      if (error) throw error;

      if (data?.response) {
        setTestResult(data.response);
        toast.success("Teste concluído!");
      }
    } catch (error) {
      console.error('Error testing prompt:', error);
      toast.error("Erro ao testar prompt. Verifique sua chave API.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveTemplatePrompt = async (templateId: string) => {
    if (!editedTemplatePrompt.trim()) {
      toast.error('Informe o conteúdo do template');
      return;
    }
    setTemplateActionId(templateId);
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .update({
          prompt: editedTemplatePrompt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template atualizado!');
      setEditingTemplate(null);
      setEditedTemplatePrompt('');
      await loadTemplates();
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template.');
    } finally {
      setTemplateActionId(null);
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    setTemplateActionId(templateId);
    try {
      const template = promptTemplates.find((tpl) => tpl.id === templateId);
      if (!template) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase.from('ai_prompts').insert({
        user_id: user.id,
        name: `${template.name} (cópia)`,
        category: template.category,
        prompt: template.prompt,
        is_main: false,
        is_active: template.is_active ?? false,
      });

      if (error) throw error;

      toast.success('Template duplicado!');
      await loadTemplates();
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      toast.error('Erro ao duplicar template.');
    } finally {
      setTemplateActionId(null);
    }
  };

  const handleToggleTemplate = async (templateId: string, nextActive: boolean) => {
    setTemplateActionId(templateId);
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .update({
          is_active: nextActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (error) throw error;

      toast.success(nextActive ? 'Template ativado!' : 'Template desativado!');
      await loadTemplates();
    } catch (error) {
      console.error('Erro ao atualizar status do template:', error);
      toast.error('Erro ao atualizar status do template.');
    } finally {
      setTemplateActionId(null);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Informe um nome para o template');
      return;
    }
    setTemplateActionId('create');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase.from('ai_prompts').insert({
        user_id: user.id,
        name: newTemplateName.trim(),
        category: newTemplateCategory.trim() || null,
        prompt: 'Defina aqui como a IA deve responder...',
        is_main: false,
        is_active: false,
      });

      if (error) throw error;

      toast.success('Template criado!');
      setNewTemplateName('');
      setNewTemplateCategory('');
      setIsCreateDialogOpen(false);
      await loadTemplates();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template.');
    } finally {
      setTemplateActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Gerente de Prompt
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure o cérebro da IA para responder exatamente como você deseja
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowExampleDialog(true)}
            className="ml-2 border-primary/30 hover:bg-primary/10"
          >
            <Info className="h-4 w-4 text-primary" />
          </Button>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all" 
            onClick={handleSavePrompt}
            disabled={isSaving}
          >
            {isSaving ? (
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
      </div>

      {/* Dialog de Exemplo */}
      <Dialog open={showExampleDialog} onOpenChange={setShowExampleDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Como Funciona o Gerente de Prompt
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-2">
              O Gerente de Prompt é o cérebro do seu agente de IA. Ele define como a IA vai se comportar em todas as interações com seus clientes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                O que é um Prompt?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Um prompt é um conjunto de instruções que você dá para a IA. Quanto mais específico e detalhado, melhor será o comportamento do agente.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Exemplo de Prompt Eficaz:</h3>
              <Card className="p-4 bg-muted/50 border-primary/20">
                <p className="text-sm font-mono leading-relaxed">
                  Você é o assistente virtual da <strong>[Nome da Empresa]</strong>.<br /><br />
                  
                  <strong>Produtos/Serviços:</strong><br />
                  - Roupas femininas premium<br />
                  - Faixa de preço: R$ 89 a R$ 499<br />
                  - Entrega em 2-5 dias úteis<br /><br />
                  
                  <strong>Tom de Voz:</strong><br />
                  - Amigável e descontraído<br />
                  - Use emojis com moderação<br />
                  - Seja direto mas educado<br /><br />
                  
                  <strong>Regras:</strong><br />
                  - Sempre mencione a promoção ativa (20% OFF no PIX)<br />
                  - Se não souber responder, peça para aguardar um humano<br />
                  - Nunca invente informações sobre produtos<br /><br />
                  
                  <strong>Objetivo:</strong> Converter leads em vendas, criando urgência e destacando benefícios.
                </p>
              </Card>
            </div>

            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                Dica Pro:
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Quanto mais detalhes sobre seus produtos, serviços, promoções e tom de voz você incluir, mais preciso e eficaz será o agente de IA!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) {
          setNewTemplateName('');
          setNewTemplateCategory('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo template</DialogTitle>
            <DialogDescription>
              Defina um nome e, opcionalmente, uma categoria para organizar seus templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do template</label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Ex: Pós-venda Instagram"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Categoria (opcional)</label>
              <Input
                value={newTemplateCategory}
                onChange={(e) => setNewTemplateCategory(e.target.value)}
                placeholder="Ex: vendas, suporte..."
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleCreateTemplate}
              disabled={templateActionId === 'create'}
              className="w-full"
            >
              {templateActionId === 'create' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar template
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt Configuration */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card p-6">
            <Tabs defaultValue="main">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="main">Prompt Principal</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="test">Testar IA</TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-foreground/90">Prompt Base do Negócio</label>
                    <Badge className="bg-green-500/20 text-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                  <Textarea
                    value={mainPrompt}
                    onChange={(e) => setMainPrompt(e.target.value)}
                    className="min-h-[300px] bg-muted/30 border-border/50 font-mono text-sm text-foreground/80"
                    placeholder="Defina como a IA deve se comportar..."
                  />
                  <p className="text-xs text-muted-foreground/80 mt-2">
                    Este prompt será usado como base para todas as respostas da IA
                  </p>
                </div>

                <Card className="p-4 bg-primary/10 border-primary/30">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-foreground/90">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Variáveis Dinâmicas Disponíveis
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <code className="bg-background/50 px-2 py-1 rounded text-foreground/70">{"{nome_cliente}"}</code>
                    <code className="bg-background/50 px-2 py-1 rounded text-foreground/70">{"{nome_empresa}"}</code>
                    <code className="bg-background/50 px-2 py-1 rounded text-foreground/70">{"{plataforma}"}</code>
                    <code className="bg-background/50 px-2 py-1 rounded text-foreground/70">{"{horario}"}</code>
                    <code className="bg-background/50 px-2 py-1 rounded text-foreground/70">{"{produto}"}</code>
                    <code className="bg-background/50 px-2 py-1 rounded text-foreground/70">{"{preco}"}</code>
                  </div>
                </Card>

              </TabsContent>

              <TabsContent value="templates" className="space-y-3">
                {isLoadingTemplates ? (
                  <Card className="p-6 text-sm text-muted-foreground">Carregando templates...</Card>
                ) : promptTemplates.length === 0 ? (
                  <Card className="p-6 text-sm text-muted-foreground">
                    Nenhum template criado ainda. Use o botão abaixo para adicionar um novo modelo.
                  </Card>
                ) : (
                  promptTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "p-4 transition-all",
                        selectedTemplateId === template.id && "border-primary bg-primary/5"
                      )}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {template.category || 'sem categoria'}
                          </Badge>
                        </div>
                        {template.is_active ? (
                          <Badge className="bg-green-500/20 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      {editingTemplate === template.id ? (
                        <div className="space-y-2 mt-3">
                          <Textarea
                            value={editedTemplatePrompt}
                            onChange={(e) => setEditedTemplatePrompt(e.target.value)}
                            className="min-h-[100px] bg-muted/30 border-border/50 font-mono text-sm"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              disabled={templateActionId === template.id}
                              onClick={() => handleSaveTemplatePrompt(String(template.id))}
                            >
                              {templateActionId === template.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                'Salvar'
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={templateActionId === template.id}
                              onClick={() => {
                                setEditingTemplate(null);
                                setEditedTemplatePrompt("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                       ) : (
                         <>
                           <p className="text-sm text-muted-foreground/80">{template.prompt}</p>
                           <div className="flex gap-2 mt-3">
                             <Button 
                               size="sm" 
                               variant="outline"
                               className="border-border/50 hover:bg-muted/50"
                               onClick={() => {
                                 setEditingTemplate(template.id);
                                 setEditedTemplatePrompt(template.prompt);
                               }}
                             >
                               Editar
                             </Button>
                             <Button 
                               size="sm" 
                               variant="outline"
                               className="border-border/50 hover:bg-muted/50"
                               disabled={templateActionId === template.id}
                               onClick={() => handleDuplicateTemplate(String(template.id))}
                             >
                               {templateActionId === template.id ? 'Processando...' : 'Duplicar'}
                             </Button>
                             <Button 
                               size="sm" 
                               className={cn(
                                 "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg",
                                 template.is_active ? "opacity-90" : ""
                               )}
                               disabled={templateActionId === template.id}
                               onClick={() => handleToggleTemplate(String(template.id), !template.is_active)}
                             >
                               {templateActionId === template.id ? (
                                 <Loader2 className="h-3 w-3 animate-spin" />
                               ) : template.is_active ? 'Desativar' : 'Ativar'}
                             </Button>
                           </div>
                         </>
                       )}
                    </Card>
                  ))
                )}
                
                <Button variant="outline" className="w-full border-border/50" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Template
                </Button>
              </TabsContent>

              <TabsContent value="test" className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-foreground/90">Simular Mensagem</label>
                  <div className="flex gap-2">
                    <Input
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Digite uma mensagem para testar..."
                      className="flex-1 bg-muted/30 border-border/50 text-foreground"
                      onKeyPress={(e) => e.key === 'Enter' && handleTestPrompt()}
                    />
                    <Button 
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all" 
                      onClick={handleTestPrompt}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Testar
                    </Button>
                  </div>
                </div>

                {testResult && (
                  <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Resposta da IA</span>
                    </div>
                    <p className="text-sm text-foreground/80">{testResult}</p>
                  </Card>
                )}

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground/90">Exemplos de Respostas</h4>
                  {testScenarios.map((scenario, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("text-xs", 
                          scenario.platform === "whatsapp" && "badge-whatsapp",
                          scenario.platform === "instagram" && "badge-instagram",
                          scenario.platform === "tiktok" && "badge-tiktok"
                        )}>
                          {scenario.platform}
                        </Badge>
                        <span className="text-sm font-medium text-foreground/80">{scenario.user}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="p-2 bg-muted/30 rounded text-sm text-foreground/80">
                          💬 {scenario.message}
                        </div>
                        <div className="p-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded border border-primary/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="h-3 w-3 text-primary" />
                            <span className="text-xs text-primary">Resposta IA</span>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(scenario.confidence * 100)}% confiança
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/80">{scenario.aiResponse}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Performance da IA
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Taxa de Acerto</span>
                  <span className="font-bold">94.7%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: "94.7%" }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Confiança Média</span>
                  <span className="font-bold">88.3%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: "88.3%" }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Satisfação Cliente</span>
                  <span className="font-bold">96.2%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: "96.2%" }} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Dicas de Prompt</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✨ Seja específico sobre tom e linguagem</p>
              <p>🎯 Defina objetivos claros (vender, informar, suportar)</p>
              <p>🚫 Estabeleça limites do que a IA não deve fazer</p>
              <p>📝 Use exemplos de respostas ideais</p>
              <p>🔄 Teste e ajuste regularmente</p>
            </div>
          </Card>

          <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-500">Atenção</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Alterações no prompt principal afetam todas as respostas futuras. Teste antes de salvar.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
