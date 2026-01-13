import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Zap,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Music,
  Link2,
  Trash2,
  Edit,
  Play,
  Pause,
  BarChart3,
  Users,
  Send,
  Loader2,
  Eye,
  Instagram,
  MessageCircle,
  Hash,
  Copy,
  Clock,
  AlertCircle,
  Upload,
  CheckCircle,
  Sparkles,
  Share2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";

import { useIntegrations } from '@/contexts/IntegrationsContext';
import { CompactPlatformSelector } from '@/components/PlatformSelector';


interface Automation {
  id: number;
  name: string;
  trigger_type: string;
  trigger_keyword?: string | null;
  public_reply?: string | null;
  platforms: string[];
  active: boolean;
  created_at: string;
}

interface Button {
  type: 'quick_reply' | 'url' | 'postback';
  title: string;
  payload?: string;
  url?: string;
}

interface AutomationMessage {
  id: number;
  automation_id: number;
  position: number;
  message_type: string;
  type: string;
  content: string;
  media_url?: string | null;
  delay_seconds: number;
  is_followup?: boolean;
  followup_delay_hours?: number | null;
  use_ai_response?: boolean;
  buttons?: Button[] | null;
}

export default function AutomationsDM() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [automationMessages, setAutomationMessages] = useState<AutomationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  
  // Form states for new automation
  const [newAutomationName, setNewAutomationName] = useState("");
  const [triggerType, setTriggerType] = useState("comment");
  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postUrl, setPostUrl] = useState("");
  const [publicReply, setPublicReply] = useState("Oi 👋 te enviei um direct, dá uma olhadinha lá!");
  const [directLink, setDirectLink] = useState("");
  
  // Message form states
  const [messageType, setMessageType] = useState("text");
  const [messageContent, setMessageContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isFollowup, setIsFollowup] = useState(false);
  const [followupDelayHours, setFollowupDelayHours] = useState(24);
  const [useAiResponse, setUseAiResponse] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Temporary messages for new automation
  const [tempMessages, setTempMessages] = useState<Omit<AutomationMessage, 'id' | 'automation_id'>[]>([]);
  
  // Button states
  const [buttons, setButtons] = useState<Button[]>([]);
  const [buttonType, setButtonType] = useState<'quick_reply' | 'url' | 'postback'>('quick_reply');
  const [buttonTitle, setButtonTitle] = useState('');
  const [buttonPayload, setButtonPayload] = useState('');
  const [buttonUrl, setButtonUrl] = useState('');

  const platforms = [
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
    { id: "facebook", name: "Facebook", icon: MessageCircle, color: "text-blue-600" },
  ];

  const messageTypes = [
    { value: "text", label: "Texto", icon: MessageSquare },
    { value: "image", label: "Imagem", icon: ImageIcon },
    { value: "video", label: "Vídeo", icon: Video },
    { value: "audio", label: "Áudio", icon: Music },
    { value: "link", label: "Link", icon: Link2 },
  ];

  const { 
    isConnected, 
    getIntegration, 
    hasAnyConnection,
    connectedCount 
  } = useIntegrations();

  useEffect(() => {
    fetchAutomations();
  }, []);

  useEffect(() => {
    if (selectedAutomation) {
      fetchAutomationMessages(selectedAutomation.id);
    } else {
      setAutomationMessages([]);
    }
  }, [selectedAutomation]);

  const fetchAutomations = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDMAutomations();
      const normalized: Automation[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        trigger_type: item.trigger,
        trigger_keyword: item.trigger_filter,
        public_reply: item.public_reply,
        platforms: item.platforms || [],
        active: item.active,
        created_at: item.created_at,
      }));
      setAutomations(normalized);
      if (normalized.length > 0) {
        setShowExamples(false);
      }
    } catch (error) {
      console.error("Error fetching automations:", error);
      toast.error("Erro ao carregar automações");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAutomationMessages = async (automationId: number) => {
    try {
      const data = await api.getDMAutomationMessages(automationId);
      const normalized: AutomationMessage[] = (data || [])
        .map((msg) => ({
          id: msg.id,
          automation_id: msg.automation_id,
          position: msg.position,
          type: msg.type,
          message_type: msg.message_type,
          content: msg.content,
          media_url: msg.media_url,
          delay_seconds: msg.delay_seconds,
          is_followup: msg.is_followup,
          followup_delay_hours: msg.followup_delay_hours,
          use_ai_response: msg.use_ai_response,
          buttons: (msg.buttons || null) as Button[] | null,
        }))
        .sort((a, b) => a.position - b.position);
      setAutomationMessages(normalized);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Erro ao carregar mensagens");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('automation-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('automation-media')
        .getPublicUrl(fileName);

      setMediaUrl(publicUrl);
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Na função createAutomation, substitua a chamada de criar sequência:
  const createAutomation = async () => {
    if (!newAutomationName || selectedPlatforms.length === 0) {
      toast.error("Preencha o nome e selecione pelo menos uma plataforma");
      return;
    }
  
    // Validar se as plataformas selecionadas estão conectadas
    const disconnectedPlatforms = selectedPlatforms.filter(
      platform => !isConnected(platform)
    );
  
    if (disconnectedPlatforms.length > 0) {
      toast.error(
        `As seguintes plataformas não estão conectadas: ${disconnectedPlatforms.join(', ')}`
      );
      return;
    }
  
    if (triggerType === "comment" && !triggerKeyword.trim()) {
      toast.error("A palavra-chave é obrigatória para automações de comentário");
      return;
    }
  
    setIsLoading(true);
    try {
      console.log("🔍 Criando automação com dados:", {
        name: newAutomationName,
        trigger: triggerType,
        trigger_filter: triggerKeyword || null,
        public_reply: publicReply,
        platforms: selectedPlatforms,
        sequences: tempMessages,
        active: true,
      });
  
      // Construir payload SIMPLES para teste
      const baseMessages = tempMessages.length > 0
        ? tempMessages
        : [
            {
              position: 1,
              type: "message",
              message_type: "text",
              content: "Oi! 👋 Vi que você comentou no meu post. Que legal! Deixa eu te explicar tudo...",
              delay_seconds: 0,
            },
          ];
  
      const sequencesPayload = baseMessages.map((msg, index) => ({
        position: msg.position ?? index + 1,
        type: msg.type || "message",
        content: msg.content,
        delay_seconds: msg.delay_seconds ?? 0,
        message_type: msg.message_type || "text",
        media_url: msg.media_url || null,
        is_followup: msg.is_followup || false,
        followup_delay_hours: msg.is_followup
          ? (msg.followup_delay_hours && msg.followup_delay_hours > 0 ? msg.followup_delay_hours : 1)
          : null,
        use_ai_response: msg.use_ai_response || false,
        buttons: msg.buttons || null,
      }));
  
      const payload = {
        name: newAutomationName,
        trigger: triggerType,
        trigger_filter: triggerKeyword || null,
        public_reply: publicReply,
        platforms: selectedPlatforms,
        sequences: sequencesPayload,
        active: true,
      };
  
      console.log("🔍 Payload final:", JSON.stringify(payload, null, 2));
  
      // Teste 1: Usar a função simplificada
      const automation = await createDMAutomationSimple(payload);
  
      console.log("✅ Automação criada:", automation);
  
      toast.success(
        `✅ Automação criada para ${selectedPlatforms.length} plataforma(s)!`
      );
      
      setIsDialogOpen(false);
      resetForm();
      await fetchAutomations();
      setSelectedAutomation({
        id: automation.id,
        name: automation.name,
        trigger_type: automation.trigger,
        trigger_keyword: automation.trigger_filter,
        public_reply: automation.public_reply,
        platforms: automation.platforms || [],
        active: automation.active,
        created_at: automation.created_at,
      });
      await fetchAutomationMessages(automation.id);
    } catch (error) {
      console.error("Error creating automation:", error);
      toast.error("Erro ao criar automação: " + (error as Error).message);
      
      // Tentar método alternativo
      try {
        console.log("🔄 Tentando método alternativo...");
        await createAutomationAlternative();
      } catch (altError) {
        console.error("Método alternativo também falhou:", altError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Método alternativo
  const createAutomationAlternative = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const payload = {
      name: newAutomationName,
      trigger: triggerType,
      trigger_filter: triggerKeyword || null,
      public_reply: publicReply,
      platforms: selectedPlatforms,
      sequences: [], // Enviar vazio inicialmente
      active: true,
    };
  
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/dm-automations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'x-user-id': session?.user?.id || '',
      },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${error}`);
    }
  
    const automation = await response.json();
    return automation;
  };

  const addButton = () => {
    if (!buttonTitle) {
      toast.error("Digite o texto do botão");
      return;
    }

    if (buttonType === 'url' && !buttonUrl) {
      toast.error("Digite a URL do botão");
      return;
    }

    if ((buttonType === 'quick_reply' || buttonType === 'postback') && !buttonPayload) {
      toast.error("Digite o payload do botão");
      return;
    }

    const newButton: Button = {
      type: buttonType,
      title: buttonTitle,
      ...(buttonType === 'url' ? { url: buttonUrl } : { payload: buttonPayload }),
    };

    setButtons([...buttons, newButton]);
    setButtonTitle('');
    setButtonPayload('');
    setButtonUrl('');
    toast.success("Botão adicionado!");
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const addMessage = async () => {
    if (!selectedAutomation || !messageContent) {
      toast.error("Selecione uma automação e preencha o conteúdo");
      return;
    }

    if (messageType !== "text" && !mediaUrl) {
      toast.error("Faça upload da mídia antes de adicionar");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        position: automationMessages.length + 1,
        type: "message",
        message_type: messageType,
        content: messageContent,
        media_url: mediaUrl || null,
        delay_seconds: delaySeconds,
        is_followup: isFollowup,
        followup_delay_hours: isFollowup ? (followupDelayHours > 0 ? followupDelayHours : 1) : null,
        use_ai_response: useAiResponse,
        buttons: buttons.length > 0 ? JSON.parse(JSON.stringify(buttons)) : null,
      };

      const data = await api.addDMAutomationMessage(selectedAutomation.id, payload);
      toast.success("Mensagem adicionada!");
      setAutomationMessages((prev) =>
        [
          ...prev,
          {
            id: data.id,
            automation_id: data.automation_id,
            position: data.position,
            type: data.type,
            message_type: data.message_type,
            content: data.content,
            media_url: data.media_url,
            delay_seconds: data.delay_seconds,
            is_followup: data.is_followup,
            followup_delay_hours: data.followup_delay_hours,
            use_ai_response: data.use_ai_response,
            buttons: (data.buttons || null) as Button[] | null,
          },
        ].sort((a, b) => a.position - b.position),
      );
      setMessageContent("");
      setMediaUrl("");
      setDelaySeconds(0);
      setIsFollowup(false);
      setFollowupDelayHours(24);
      setUseAiResponse(false);
      setButtons([]);
    } catch (error) {
      console.error("Error adding message:", error);
      toast.error("Erro ao adicionar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomation = async (automation: Automation) => {
    try {
      await api.updateDMAutomation(automation.id, { active: !automation.active });
      setAutomations((prev) =>
        prev.map((a) => (a.id === automation.id ? { ...a, active: !a.active } : a)),
      );
      toast.success(automation.active ? "Automação desativada" : "Automação ativada");
    } catch (error) {
      console.error("Error toggling automation:", error);
      toast.error("Erro ao atualizar automação");
    }
  };

  const deleteAutomation = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta automação?")) return;

    try {
      await api.deleteDMAutomation(id);
      setAutomations(automations.filter((a) => a.id !== id));
      if (selectedAutomation?.id === id) {
        setSelectedAutomation(null);
        setAutomationMessages([]);
      }
      toast.success("Automação excluída");
    } catch (error) {
      console.error("Error deleting automation:", error);
      toast.error("Erro ao excluir automação");
    }
  };

  const deleteMessage = async (messageId: number) => {
    if (!selectedAutomation) return;
    try {
      await api.deleteDMAutomationMessage(selectedAutomation.id, messageId);
      setAutomationMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Mensagem removida");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Erro ao remover mensagem");
    }
  };

  const resetForm = () => {
    setNewAutomationName("");
    setTriggerType("comment");
    setTriggerKeyword("");
    setSelectedPlatforms([]);
    setPostUrl("");
    setPublicReply("Oi 👋 te enviei um direct, dá uma olhadinha lá!");
    setDirectLink("");
    setMessageContent("");
    setMediaUrl("");
    setDelaySeconds(0);
    setIsFollowup(false);
    setFollowupDelayHours(24);
    setUseAiResponse(false);
    setTempMessages([]);
    setMessageType("text");
  };

  const addTempMessage = () => {
    if (!messageContent) {
      toast.error("Preencha o conteúdo da mensagem");
      return;
    }

    // Validate media URL for non-text messages
    if (messageType !== "text" && messageType !== "link" && !mediaUrl) {
      toast.error("Faça upload da mídia antes de adicionar");
      return;
    }

    const newMessage: Omit<AutomationMessage, "id" | "automation_id"> = {
      position: tempMessages.length + 1,
      type: "message",
      message_type: messageType,
      content: messageContent,
      media_url: mediaUrl || null,
      delay_seconds: delaySeconds,
      is_followup: isFollowup,
      followup_delay_hours: isFollowup ? (followupDelayHours > 0 ? followupDelayHours : 1) : null,
      use_ai_response: useAiResponse,
      buttons: buttons.length > 0 ? JSON.parse(JSON.stringify(buttons)) : null,
    };

    setTempMessages([...tempMessages, newMessage]);
    setMessageContent("");
    setMediaUrl("");
    setDelaySeconds(0);
    setIsFollowup(false);
    setFollowupDelayHours(24);
    setUseAiResponse(false);
    setButtons([]);
    setMessageType("text");
    toast.success("Mensagem adicionada à sequência!");
  };

  const removeTempMessage = (index: number) => {
    setTempMessages(
      tempMessages
        .filter((_, i) => i !== index)
        .map((msg, idx) => ({ ...msg, position: idx + 1 })),
    );
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Fundo futurista animado - mais sutil */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header ultramoderno e minimalista */}
      <div className="flex items-center justify-between relative z-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl blur-lg" />
            <div className="relative bg-gradient-to-br from-primary to-accent p-2.5 rounded-2xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground/95">
              Automações DM
            </h1>
            <p className="text-sm text-muted-foreground/70 mt-0.5">
              Sistema inteligente de respostas automáticas
            </p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 border-0 h-11 px-5">
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto glass-card border border-primary/30 shadow-2xl shadow-primary/20 backdrop-blur-2xl">
            <DialogHeader className="pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-accent/40 rounded-xl blur-lg" />
                  <div className="relative bg-gradient-to-br from-primary to-accent p-2 rounded-xl">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">Criar Nova Automação</DialogTitle>
                  <DialogDescription className="text-muted-foreground/80">
                    Configure sua automação de mensagens em poucos passos
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Nome da Automação
                </Label>
                <Input
                  value={newAutomationName}
                  onChange={(e) => setNewAutomationName(e.target.value)}
                  placeholder="Ex: Boas-vindas Automáticas"
                  className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Tipo de Gatilho
                </Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 glass-card border-border/50">
                    <SelectItem value="comment">Comentário no Post</SelectItem>
                    <SelectItem value="dm">DM Recebido</SelectItem>
                    <SelectItem value="story_mention">Menção nos Stories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {triggerType === "comment" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      Palavra-chave do Comentário (opcional)
                    </Label>
                    <Input
                      value={triggerKeyword}
                      onChange={(e) => setTriggerKeyword(e.target.value.toLowerCase())}
                      placeholder="Ex: info, preço, link (deixe vazio para todos os comentários)"
                      className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                    <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5 mt-1.5 bg-primary/5 p-2 rounded-lg border border-primary/10">
                      <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                      Se deixar vazio, a automação dispara para qualquer comentário
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      URL do Post do Instagram
                    </Label>
                    <Input
                      value={postUrl}
                      onChange={(e) => setPostUrl(e.target.value)}
                      placeholder="https://www.instagram.com/p/..."
                      className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                    <p className="text-xs text-muted-foreground/80 mt-1.5">
                      Cole o link do post que irá disparar a automação
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Resposta Pública no Comentário
                    </Label>
                    <Textarea
                      value={publicReply}
                      onChange={(e) => setPublicReply(e.target.value)}
                      placeholder="Ex: Oi 👋 te enviei um direct, dá uma olhadinha lá!"
                      className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[80px]"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5 mt-1.5 bg-accent/5 p-2 rounded-lg border border-accent/10">
                      <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                      Esta mensagem será enviada como resposta pública ao comentário
                    </p>
                  </div>
                </>
              )}

              {triggerType !== "comment" && (
                <div>
                  <Label>Palavra-chave (opcional)</Label>
                  <Input
                    value={triggerKeyword}
                    onChange={(e) => setTriggerKeyword(e.target.value)}
                    placeholder="Ex: preço, produto, comprar"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para ativar em todos os DMs
                  </p>
                </div>
              )}

              {/* Sequência de Mensagens */}
              <div className="border-t pt-4">
                <Label className="mb-3 block flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Sequência de Mensagens
                </Label>
                
                {/* Display temp messages */}
                {tempMessages.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {tempMessages.map((msg, index) => {
                      const MessageIcon = messageTypes.find(t => t.value === msg.message_type)?.icon;
                      return (
                        <Card key={index} className="p-3 bg-primary/5 border-primary/20">
                          <div className="flex items-start gap-2">
                            <Badge className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                              {index + 1}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {MessageIcon && <MessageIcon className="h-3 w-3 text-primary" />}
                                <span className="text-xs font-medium capitalize">{msg.message_type}</span>
                                {msg.delay_seconds > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    ⏱️ {msg.delay_seconds}s
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm truncate">{msg.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTempMessage(index)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Add message form */}
                <Card className="p-3 bg-background/50">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <div className="grid grid-cols-5 gap-1 mt-1">
                        {messageTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setMessageType(type.value)}
                            className={cn(
                              "p-1.5 rounded border transition-all flex flex-col items-center gap-0.5",
                              messageType === type.value
                                ? "border-primary bg-primary/10"
                                : "border-border/50 hover:border-primary/50"
                            )}
                          >
                            <type.icon className="h-3 w-3" />
                            <span className="text-[10px]">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Conteúdo</Label>
                      <Textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Digite o conteúdo..."
                        className="mt-1 min-h-[60px] text-sm"
                      />
                    </div>

                    {messageType !== 'text' && messageType !== 'link' && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileUpload}
                          accept={
                            messageType === "image" ? "image/*" :
                            messageType === "video" ? "video/*" :
                            messageType === "audio" ? "audio/*" :
                            "*"
                          }
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingMedia}
                          className="w-full"
                        >
                          {uploadingMedia ? (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3 mr-2" />
                          )}
                          {uploadingMedia ? "Enviando..." : mediaUrl ? "✓ Arquivo enviado" : "Upload"}
                        </Button>
                      </div>
                    )}

                    {messageType === 'link' && (
                      <div>
                        <Label className="text-xs">URL</Label>
                        <Input
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://..."
                          className="mt-1 text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Delay (segundos)</Label>
                      <Input
                        type="number"
                        value={delaySeconds}
                        onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="0"
                        className="mt-1 text-sm"
                      />
                    </div>

                    <Button
                      onClick={addTempMessage}
                      size="sm"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md shadow-primary/20 border-0 h-10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar à Sequência
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    Plataformas
                  </Label>
                  
                  {selectedAutomation?.platforms?.some(p => !isConnected(p)) && (
                    <Alert className="mt-2 py-2 px-3 border-amber-500/50 bg-amber-500/10">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <AlertDescription className="ml-2 text-xs">
                        Algumas plataformas não estão conectadas
                      </AlertDescription>
                      </Alert>
)}

                  {!hasAnyConnection ? (
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="ml-2">
                        <p className="font-medium text-sm mb-2">Nenhuma plataforma conectada</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Conecte Instagram ou Facebook para criar automações.
                        </p>
                        <Link to="/settings">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Settings className="h-3 w-3" />
                            Conectar Agora
                          </Button>
                        </Link>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <CompactPlatformSelector
                        selectedPlatforms={selectedPlatforms}
                        onPlatformToggle={(platformId) => {
                          setSelectedPlatforms(prev =>
                            prev.includes(platformId)
                              ? prev.filter(p => p !== platformId)
                              : [...prev, platformId]
                          );
                        }}
                      />
                      
                      {selectedPlatforms.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Selecione pelo menos uma plataforma
                        </p>
                      )}
                    </>
                  )}
                </div>
            </div>

            <DialogFooter>
              <Button
                onClick={createAutomation}
                disabled={isLoading}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 border-0 h-11 px-5"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Automação {tempMessages.length > 0 && `(${tempMessages.length} mensagens)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automations List - ultramoderno */}
        <Card className="glass-card border-white/5 p-6 bg-gradient-to-b from-background/50 to-background/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground/90">Suas Automações</h3>
          </div>

          {automations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma automação criada ainda</p>
              <p className="text-xs mt-1">Clique em "Nova Automação" para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map((automation) => {
                return (
                  <Card
                    key={automation.id}
                    onClick={() => setSelectedAutomation(automation)}
                    className={cn(
                      "p-4 cursor-pointer transition-all duration-300 border-white/5 bg-gradient-to-br hover:shadow-lg",
                      selectedAutomation?.id === automation.id 
                        ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10" 
                        : "from-background/40 to-background/20 hover:border-primary/30",
                      ""
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-foreground/90">
                            {automation.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground/70">
                          Gatilho: {automation.trigger_type === 'comment' ? 'Comentário' : 
                                  automation.trigger_type === 'dm' ? 'DM' : 'Story'}
                          {automation.trigger_keyword && ` · Palavra: "${automation.trigger_keyword}"`}
                        </p>
                      </div>
                      <Switch
                        checked={automation.active}
                        onCheckedChange={() => toggleAutomation(automation)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>  
                  
                    <div className="flex flex-wrap gap-1 mb-2">
                      {automation.platforms.map((platformId) => {
                        const integration = getIntegration(platformId);
                        const platform = platforms.find(p => p.id === platformId);
                        
                        if (!platform) return null;

                        return (
                          <Badge 
                            key={platformId} 
                            variant="outline" 
                            className={cn(
                              "text-xs flex items-center gap-1",
                              !integration && "opacity-50"
                            )}
                          >
                            <platform.icon className={cn("h-3 w-3", platform.color)} />
                            {platform.name}
                            {integration && integration.credentials?.username && (
                              <span className="text-[10px] text-muted-foreground">
                                (@{integration.credentials.username})
                              </span>
                            )}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAutomation(automation);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAutomation(automation.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        {/* Messages Configuration - ultramoderno */}
        <div className="lg:col-span-2">
              {selectedAutomation ? (
            <Card className="glass-card border-white/5 p-6 bg-gradient-to-b from-background/50 to-background/30 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground/90">Mensagens da Automação</h3>
                    
                  </div>
                  <p className="text-sm text-muted-foreground/70">{selectedAutomation.name}</p>
                </div>
                <Badge className={selectedAutomation.active ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-muted/50 text-muted-foreground border-muted"}>
                  {selectedAutomation.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>

              {/* Existing Messages - Flow View */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Sequência de Mensagens
                </h4>
                {automationMessages.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma mensagem adicionada ainda
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Adicione mensagens abaixo para criar seu fluxo
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {automationMessages.map((msg, index) => {
                      const MessageIcon = messageTypes.find(t => t.value === msg.message_type)?.icon;
                      
                      return (
                        <div key={msg.id}>
                          <Card className="p-4 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center gap-1">
                                <Badge className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center">
                                  {index + 1}
                                </Badge>
                                {index < automationMessages.length - 1 && (
                                  <div className="h-8 w-0.5 bg-primary/30" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-2">
                                  {MessageIcon && <MessageIcon className="h-4 w-4 text-primary" />}
                                  <span className="text-sm font-medium capitalize">{msg.message_type}</span>
                                  {msg.delay_seconds > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      ⏱️ {msg.delay_seconds}s
                                    </Badge>
                                  )}
                                  {msg.is_followup && (
                                    <Badge variant="secondary" className="text-xs">
                                      📩 Follow-up ({msg.followup_delay_hours}h)
                                    </Badge>
                                  )}
                                  {msg.use_ai_response && (
                                    <Badge variant="default" className="text-xs bg-purple-500">
                                      🤖 IA Ativa
                                    </Badge>
                                  )}
                                </div>
                                
                                <p className="text-sm mb-2">{msg.content}</p>
                                
                                {msg.media_url && (
                                  <div className="flex items-center gap-1 text-xs text-primary">
                                    <Link2 className="h-3 w-3" />
                                    <span className="truncate">{msg.media_url}</span>
                                  </div>
                                )}

                                {msg.buttons && msg.buttons.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs text-muted-foreground">Botões:</p>
                                    {msg.buttons.map((btn, bidx) => (
                                      <Badge key={bidx} variant="secondary" className="text-xs mr-1">
                                        {btn.type === 'quick_reply' ? '⚡' : btn.type === 'url' ? '🔗' : '📤'} {btn.title}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMessage(msg.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                          
                          {msg.delay_seconds > 0 && index < automationMessages.length - 1 && (
                            <div className="flex items-center gap-2 py-2 pl-14 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Aguarda {msg.delay_seconds}s antes da próxima mensagem</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Message Form */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Nova Mensagem
                </h4>
              
                <div className="space-y-3">
                  <div>
                    <Label>Tipo de Mensagem</Label>
                    <div className="grid grid-cols-5 gap-2 mt-1">
                      {messageTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setMessageType(type.value)}
                          className={cn(
                            "p-2 rounded border-2 transition-all flex flex-col items-center gap-1",
                            messageType === type.value
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:border-primary/50"
                          )}
                        >
                          <type.icon className="h-4 w-4" />
                          <span className="text-xs">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Follow-up Configuration */}
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Mensagem de Follow-up</Label>
                      <p className="text-xs text-muted-foreground">
                        Envia se não houver resposta
                      </p>
                    </div>
                    <Switch
                      checked={isFollowup}
                      onCheckedChange={setIsFollowup}
                    />
                  </div>

                  {isFollowup && (
                    <div>
                      <Label>Aguardar quantas horas?</Label>
                      <Input
                        type="number"
                        value={followupDelayHours}
                        onChange={(e) => setFollowupDelayHours(parseInt(e.target.value) || 24)}
                        placeholder="24"
                        className="mt-1"
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Exemplo: 1ª mensagem agora, 2ª em {followupDelayHours}h, 3ª em {followupDelayHours * 2}h
                      </p>
                    </div>
                  )}

                  {/* AI Response Configuration */}
                  <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        🤖 Resposta com ChatGPT
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        IA responde perguntas automaticamente
                      </p>
                    </div>
                    <Switch
                      checked={useAiResponse}
                      onCheckedChange={setUseAiResponse}
                    />
                  </div>

                  <div>
                    <Label>Conteúdo</Label>
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Digite o conteúdo da mensagem..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>

                  {messageType !== 'text' && messageType !== 'link' && (
                    <div>
                      <Label>Upload de Mídia</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        accept={
                          messageType === "image" ? "image/*" :
                          messageType === "video" ? "video/*" :
                          messageType === "audio" ? "audio/*" :
                          "*"
                        }
                        className="hidden"
                      />
                      <div className="flex gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingMedia}
                          className="flex-1"
                        >
                          {uploadingMedia ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {uploadingMedia ? "Enviando..." : "Selecionar Arquivo"}
                        </Button>
                      </div>
                      {mediaUrl && (
                        <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Arquivo enviado com sucesso
                        </p>
                      )}
                    </div>
                  )}

                  {messageType === 'link' && (
                    <div>
                      <Label>URL do Link</Label>
                      <Input
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://exemplo.com/pagina"
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Delay antes de enviar (segundos)</Label>
                    <Input
                      type="number"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
                      min="0"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>

                  {/* Buttons Section */}
                  <Card className="p-3 bg-background/50 border-primary/20">
                    <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Botões Interativos (ManyChat Style)
                    </h5>

                    {buttons.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {buttons.map((btn, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-primary/5 rounded border border-primary/20">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {btn.type === 'quick_reply' ? '⚡ Quick Reply' : btn.type === 'url' ? '🔗 URL' : '📤 Postback'}
                              </Badge>
                              <span className="text-sm font-medium">{btn.title}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeButton(idx)}
                              className="h-6 w-6 p-0 text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Select value={buttonType} onValueChange={(v: any) => setButtonType(v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quick_reply">⚡ Quick Reply</SelectItem>
                          <SelectItem value="url">🔗 URL Button</SelectItem>
                          <SelectItem value="postback">📤 Postback</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        value={buttonTitle}
                        onChange={(e) => setButtonTitle(e.target.value)}
                        placeholder="Texto do botão"
                        className="h-9"
                      />

                      {buttonType === 'url' && (
                        <Input
                          value={buttonUrl}
                          onChange={(e) => setButtonUrl(e.target.value)}
                          placeholder="https://..."
                          className="h-9"
                        />
                      )}

                      {(buttonType === 'quick_reply' || buttonType === 'postback') && (
                        <Input
                          value={buttonPayload}
                          onChange={(e) => setButtonPayload(e.target.value)}
                          placeholder="Payload (ex: YES, NO, NEXT)"
                          className="h-9"
                        />
                      )}

                      <Button
                        onClick={addButton}
                        size="sm"
                        variant="outline"
                        className="w-full h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar Botão
                      </Button>
                    </div>
                  </Card>

                  <Button
                    onClick={addMessage}
                    disabled={isLoading}
                    className="w-full btn-glow"
                  >
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Mensagem
                  </Button>
                </div>
              </Card>
              
            </Card>
          ) : (
            <Card className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione uma Automação</h3>
              <p className="text-sm text-muted-foreground">
                Escolha uma automação na lista ao lado para configurar as mensagens
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}