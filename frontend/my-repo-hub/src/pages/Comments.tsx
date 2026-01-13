import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrations } from '@/contexts/IntegrationsContext';
import {
  Bot,
  MessageSquare,
  Reply,
  TrendingUp,
  Filter,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  X,
  Settings,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type BackendComment = {
  comment: {
    id: string;
    platform: string;
    post_id?: string | null;
    author_username?: string | null;
    text: string;
    status: string;
    confidence: number;
    created_at: string;
  };
  ai_response?: {
    text: string;
    confidence: number;
  } | null;
};

type CommentDisplay = {
  id: string;
  platform: string;
  post: string;
  user: string;
  comment: string;
  createdAt: string;
  status: string;
  aiResponse?: string | null;
  confidence?: number | null;
};

type CommentStats = {
  total: number;
  responded: number;
  pending: number;
  engagement: number;
};

const STATUS_TABS = [
  { id: "pending", label: "Pendentes" },
  { id: "approved", label: "Aprovados" },
  { id: "ignored", label: "Ignorados" },
  { id: "all", label: "Todos" },
] as const;

export default function Comments() {
  const [rawComments, setRawComments] = useState<BackendComment[]>([]);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]["id"]>("pending");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedResponse, setEditedResponse] = useState<string>("");
  const [keywordFilter, setKeywordFilter] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("");

  const [predefinedKeywords, setPredefinedKeywords] = useState<string[]>([
    "preço", "entrega", "qualidade", "comprar", "urgente", "dúvida", "reclamação"
  ]);
  const [newKeyword, setNewKeyword] = useState("");
  const [stats, setStats] = useState<CommentStats>({ total: 0, responded: 0, pending: 0, engagement: 0 });

  const { 
    isConnected, 
    getIntegration, 
    hasAnyConnection,
    connectedCount 
  } = useIntegrations();
  
  useEffect(() => {
    void loadComments();
  }, []);
  
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncComments = async () => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://api.aitonomy.ai'}/api/comments/fetch-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao sincronizar comentários');
      }

      const data = await response.json();
      
      if (data.new_comments > 0) {
        toast.success(`${data.new_comments} novos comentários encontrados!`);
      } else {
        toast.info("Nenhum comentário novo encontrado");
      }
      
      await loadComments();
    } catch (error: any) {
      console.error("Erro ao sincronizar comentários:", error);
      toast.error(error?.message || "Erro ao sincronizar comentários");
    } finally {
      setIsSyncing(false);
    }
  };

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const [commentsData, statsData] = await Promise.all([
        api.getPendingComments(200),
        api.getCommentStats(14),
      ]);

      setRawComments(Array.isArray(commentsData) ? commentsData : []);

      if (Array.isArray(statsData) && statsData.length > 0) {
        const totals = statsData.reduce(
          (acc: CommentStats, item: { total_comments: number; responded_by_ai: number; pending_review: number; engagement_rate: number }) => ({
            total: acc.total + (item.total_comments ?? 0),
            responded: acc.responded + (item.responded_by_ai ?? 0),
            pending: acc.pending + (item.pending_review ?? 0),
            engagement: acc.engagement + (item.engagement_rate ?? 0),
          }),
          { total: 0, responded: 0, pending: 0, engagement: 0 }
        );
        const averageEngagement = statsData.length ? totals.engagement / statsData.length : 0;
        setStats({
          total: totals.total,
          responded: totals.responded,
          pending: totals.pending,
          engagement: averageEngagement,
        });
      } else {
        setStats({ total: 0, responded: 0, pending: 0, engagement: 0 });
      }
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
      toast.error("Não foi possível carregar os comentários.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAIResponses = async () => {
    setIsGenerating(true);
    try {
      await api.generateCommentResponses();
      toast.success("Solicitação enviada. A IA está gerando respostas.");
      setSelectedComments([]);
      await loadComments();
    } catch (error: any) {
      console.error("Erro ao gerar respostas:", error);
      toast.error(error?.message ?? "Erro ao gerar respostas.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getPlatformBadge = (platform: string) => {
    const integration = getIntegration(platform);
    const colors = {
      instagram: "bg-pink-500/20 text-pink-500 border-pink-500/30",
      tiktok: "bg-gray-900/20 text-gray-900 dark:text-white border-gray-900/30",
      facebook: "bg-blue-600/20 text-blue-600 border-blue-600/30",
      linkedin: "bg-blue-700/20 text-blue-700 border-blue-700/30",
    };
    
    return (
      <Badge className={cn("text-xs", colors[platform as keyof typeof colors] || "")}>
        {platform}
        {integration?.credentials?.username && (
          <span className="ml-1 opacity-70">
            (@{integration.credentials.username})
          </span>
        )}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") {
      return (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      );
    }
    if (status === "ignored") {
      return (
        <Badge className="bg-muted border-muted-foreground/20 text-muted-foreground">
          <AlertCircle className="h-3 w-3 mr-1" />
          Ignorado
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
        <Bot className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const displayComments: CommentDisplay[] = useMemo(() => {
    return rawComments.map((item) => ({
      id: item.comment.id,
      platform: item.comment.platform,
      post: item.comment.post_id || "Publicação",
      user: item.comment.author_username || "Cliente",
      comment: item.comment.text,
      createdAt: item.comment.created_at,
      status: item.comment.status || "pending",
      aiResponse: item.ai_response?.text ?? null,
      confidence: item.ai_response?.confidence ?? item.comment.confidence ?? null,
    }));
  }, [rawComments]);

  const filteredComments = useMemo(() => {
    return displayComments.filter((item) => {
      const statusMatch = activeTab === "all" ? true : item.status === activeTab;
      
      const keyword = keywordFilter.trim().toLowerCase();
      const keywordMatch = keyword
        ? item.comment.toLowerCase().includes(keyword) ||
          (item.aiResponse?.toLowerCase().includes(keyword) ?? false) ||
          item.user.toLowerCase().includes(keyword)
        : true;
      
      const platformMatch = platformFilter 
        ? item.platform.toLowerCase() === platformFilter.toLowerCase()
        : true;
      
      const isPlatformConnected = isConnected(item.platform);
      
      return statusMatch && keywordMatch && platformMatch && isPlatformConnected;
    });
  }, [displayComments, activeTab, keywordFilter, platformFilter, isConnected]);

  const handleApprove = async (comment: CommentDisplay, customResponse?: string) => {
    try {
      await api.approveComment(comment.id, customResponse ?? comment.aiResponse ?? undefined);
      toast.success("Comentário aprovado e resposta enviada.");
      setEditingComment(null);
      setEditedResponse("");
      await loadComments();
    } catch (error: any) {
      console.error("Erro ao aprovar comentário:", error);
      toast.error(error?.message ?? "Erro ao aprovar comentário.");
    }
  };

  const handleIgnore = async (commentId: string) => {
    try {
      await api.ignoreComment(commentId);
      toast.info("Comentário marcado como ignorado.");
      await loadComments();
    } catch (error: any) {
      console.error("Erro ao ignorar comentário:", error);
      toast.error(error?.message ?? "Erro ao ignorar comentário.");
    }
  };

  const getRelativeTime = (isoDate: string) => {
    try {
      return formatDistanceToNow(new Date(isoDate), { addSuffix: true, locale: ptBR });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-xl border border-pink-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.15)]">
            <MessageSquare className="h-6 w-6 text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Central de Comentários
            </h1>
            <p className="text-muted-foreground mt-1">
              {hasAnyConnection 
                ? `Respostas automáticas de ${connectedCount} plataforma(s)` 
                : "Conecte suas redes sociais para começar"
              }
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-border/50"
            onClick={() => void loadComments()}
            disabled={isLoading || isGenerating || !hasAnyConnection}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isLoading ? "Carregando..." : "Atualizar"}
          </Button>
          <Button 
            variant="outline"
            onClick={handleGenerateAIResponses}
            disabled={isGenerating || !hasAnyConnection}
            className="border-border/50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analisar com IA
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="border-border/50"
            onClick={handleSyncComments}
            disabled={isSyncing || !hasAnyConnection}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Comentários
              </>
            )}
          </Button>
          <Button 
            className="btn-glow" 
            onClick={handleGenerateAIResponses}
            disabled={isGenerating || !hasAnyConnection}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Responder com IA
              </>
            )}
          </Button>
        </div>
      </div>

      {!hasAnyConnection && (
        <Alert className="border-amber-500/50 bg-amber-500/10 mb-6">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <AlertDescription className="ml-2">
            <p className="font-semibold mb-2">Nenhuma plataforma conectada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Conecte Instagram, Facebook, TikTok ou LinkedIn para gerenciar comentários.
            </p>
            <Link to="/settings">
              <Button size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Conectar Plataformas
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros por Palavras-chave */}
      <Card className="backdrop-blur-xl bg-background/70 border-purple-500/20 p-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </h3>
            {(keywordFilter || platformFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKeywordFilter("");
                  setPlatformFilter("");
                }}
                className="h-7 text-xs"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
          
          {/* Filtro por plataforma */}
          <div className="space-y-2">
            <Label className="text-xs">Plataforma</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={platformFilter === "" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPlatformFilter("")}
              >
                Todas
              </Badge>
              {['instagram', 'facebook', 'tiktok', 'linkedin']
                .filter(platform => isConnected(platform))
                .map((platform) => {
                  const integration = getIntegration(platform);
                  const platformConfig = {
                    instagram: { name: 'Instagram', color: 'text-pink-500' },
                    facebook: { name: 'Facebook', color: 'text-blue-600' },
                    tiktok: { name: 'TikTok', color: 'text-black dark:text-white' },
                    linkedin: { name: 'LinkedIn', color: 'text-blue-700' },
                  }[platform];

                  return (
                    <Badge
                      key={platform}
                      variant={platformFilter === platform ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer hover:bg-primary/20 transition-colors",
                        platformFilter === platform && "bg-primary/20 border-primary"
                      )}
                      onClick={() => setPlatformFilter(platform === platformFilter ? "" : platform)}
                    >
                      {platformConfig?.name}
                      {integration?.credentials?.username && (
                        <span className="text-xs ml-1 opacity-70">
                          (@{integration.credentials.username})
                        </span>
                      )}
                    </Badge>
                  );
                })}
            </div>
          </div>
          
          {/* Input de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nos comentários..."
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              className="pl-10 pr-10 bg-muted/30"
            />
            {keywordFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setKeywordFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Palavras-chave predefinidas */}
          <div className="flex flex-wrap gap-2">
            {predefinedKeywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="outline"
                className={cn(
                  "cursor-pointer hover:bg-primary/20 transition-colors",
                  keywordFilter === keyword && "bg-primary/20 border-primary"
                )}
                onClick={() => setKeywordFilter(keyword === keywordFilter ? "" : keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>

          {/* Adicionar nova palavra-chave */}
          <div className="flex gap-2">
            <Input
              placeholder="Nova palavra-chave..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newKeyword.trim()) {
                  setPredefinedKeywords([...predefinedKeywords, newKeyword.trim()]);
                  setNewKeyword("");
                  toast.success(`Palavra-chave "${newKeyword}" adicionada!`);
                }
              }}
              className="bg-muted/30"
            />
            <Button
              size="sm"
              onClick={() => {
                if (newKeyword.trim()) {
                  setPredefinedKeywords([...predefinedKeywords, newKeyword.trim()]);
                  setNewKeyword("");
                  toast.success(`Palavra-chave "${newKeyword}" adicionada!`);
                }
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="backdrop-blur-xl bg-background/70 border-cyan-500/20 p-4 shadow-lg hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Comentários</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 backdrop-blur-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </Card>
        
        <Card className="backdrop-blur-xl bg-background/70 border-purple-500/20 p-4 shadow-lg hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Respondidos pela IA</p>
              <p className="text-2xl font-bold">{stats.responded}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 backdrop-blur-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </Card>
        
        <Card className="backdrop-blur-xl bg-background/70 border-green-500/20 p-4 shadow-lg hover:border-green-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Engajamento</p>
              <p className="text-2xl font-bold">
                {stats.engagement ? `${(stats.engagement * 100).toFixed(1)}%` : "0%"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/20 backdrop-blur-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card className="backdrop-blur-xl bg-background/70 border-yellow-500/20 p-4 shadow-lg hover:border-yellow-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes de Revisão</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 backdrop-blur-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Comments Management */}
      <Card className="backdrop-blur-xl bg-background/70 border-purple-500/20 shadow-lg">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="p-6">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-6">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {selectedComments.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <p className="text-sm">
                  {selectedComments.length} comentários selecionados
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      toast.success(`${selectedComments.length} comentários selecionados.`);
                      setSelectedComments([]);
                    }}
                  >
                    Limpar seleção
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-primary"
                    onClick={handleGenerateAIResponses}
                  >
                    Responder Selecionados
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="h-[500px] relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className="space-y-3">
                {filteredComments.map((comment) => (
                  <Card
                    key={comment.id}
                    className={cn(
                      "p-4 transition-all hover:border-primary/50",
                      selectedComments.includes(comment.id) && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedComments.includes(comment.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedComments([...selectedComments, comment.id]);
                          } else {
                            setSelectedComments(selectedComments.filter(id => id !== comment.id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPlatformBadge(comment.platform)}
                            <span className="text-sm font-medium">{comment.user}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(comment.status)}
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Em resposta a: "{comment.post}"
                        </p>

                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm">{comment.comment}</p>
                        </div>

                        <div className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-primary">
                              {comment.aiResponse ? "Resposta Sugerida pela IA" : "Aguardando geração"}
                            </span>
                            {typeof comment.confidence === "number" && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(comment.confidence * 100)}% confiança
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">
                            {comment.aiResponse || "Ainda não foi gerada uma resposta de IA para este comentário."}
                          </p>
                        </div>

                        {editingComment === comment.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editedResponse}
                              onChange={(e) => setEditedResponse(e.target.value)}
                              className="min-h-[100px] bg-muted/30 border-border/50"
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => void handleApprove(comment, editedResponse)}
                              >
                                Salvar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditedResponse("");
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingComment(comment.id);
                                setEditedResponse(comment.aiResponse ?? "");
                              }}
                            >
                              <Reply className="h-3 w-3 mr-1" />
                              Editar Resposta
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-primary"
                              onClick={() => void handleApprove(comment)}
                              disabled={!comment.aiResponse}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {comment.aiResponse ? "Aprovar e Enviar" : "Gerar com IA"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => void handleIgnore(comment.id)}
                            >
                              Ignorar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {!isLoading && filteredComments.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Nenhum comentário encontrado com os filtros atuais.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}