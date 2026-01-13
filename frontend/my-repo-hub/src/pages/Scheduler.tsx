import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Sparkles,
  Image,
  Hash,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Instagram,
  MessageCircle,
  Linkedin,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import api, { ConnectedAccount, SocialPost } from "@/lib/api";

export default function Scheduler() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [postContent, setPostContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const loadConnectedAccounts = useCallback(async () => {
    try {
      const accounts = await api.getConnectedAccounts();
      setConnectedAccounts(accounts || []);
      if (accounts?.length && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id);
      }
    } catch (error) {
      console.error("Error loading connected accounts", error);
      toast.error("Erro ao carregar contas conectadas");
    }
  }, [selectedAccountId]);

  const loadScheduledPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const data = await api.getScheduledPosts();
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts", error);
      toast.error("Erro ao carregar posts agendados");
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    loadConnectedAccounts();
    loadScheduledPosts();
  }, [loadConnectedAccounts, loadScheduledPosts]);

  const platforms = [
    { id: "instagram", name: "Instagram", color: "badge-instagram", icon: "instagram" },
    { id: "tiktok", name: "TikTok", color: "badge-tiktok", icon: "tiktok" },
    { id: "facebook", name: "Facebook", color: "badge-facebook", icon: "facebook" },
    { id: "linkedin", name: "LinkedIn", color: "badge-linkedin", icon: "linkedin" },
    { id: "whatsapp", name: "WhatsApp", color: "badge-whatsapp", icon: "whatsapp" },
    { id: "telegram", name: "Telegram", color: "badge-telegram", icon: "telegram" },
    { id: "kwai", name: "Kwai", color: "badge-kwai", icon: "kwai" },
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error("Digite o conteúdo do post");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Selecione pelo menos uma plataforma");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Selecione uma conta conectada");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createPost({
        format: "feed",
        platforms: selectedPlatforms,
        caption: postContent,
        description: postContent,
        scheduled_at: scheduledDateTime ? new Date(scheduledDateTime).toISOString() : null,
        connected_account_id: selectedAccountId,
      });
      toast.success("Post agendado com sucesso");
      setPostContent("");
      setSelectedPlatforms([]);
      setScheduledDateTime("");
      await loadScheduledPosts();
    } catch (error: any) {
      console.error("Error creating post", error);
      toast.error(error?.message || "Erro ao agendar post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!postContent.trim()) {
      toast.error("Digite um tópico ou ideia para gerar conteúdo");
      return;
    }

    setIsGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt: `Crie um post criativo e engajador sobre: ${postContent}`,
          type: "post-content",
        },
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {},
      });

      if (error) throw error;

      if (data?.generatedText) {
        setPostContent(data.generatedText);
        toast.success("Conteúdo gerado com sucesso!");
      }
    } catch (error) {
      console.error("Error generating content", error);
      toast.error("Erro ao gerar conteúdo. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!postContent.trim()) {
      toast.error("Digite o conteúdo do post primeiro");
      return;
    }

    setIsGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          prompt: `Baseado neste conteúdo, gere 8-10 hashtags relevantes: ${postContent}`,
          type: "hashtags",
        },
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : {},
      });

      if (error) throw error;

      if (data?.generatedText) {
        setPostContent((prev) => `${prev}\n\n${data.generatedText}`);
        toast.success("Hashtags geradas com sucesso!");
      }
    } catch (error) {
      console.error("Error generating hashtags", error);
      toast.error("Erro ao gerar hashtags. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const scheduledCards = useMemo(() => {
    return posts
      .slice()
      .sort((a, b) =>
        new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()
      );
  }, [posts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <CalendarIcon className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Agendador Inteligente
            </h1>
            <p className="text-muted-foreground mt-1">
              Planeje e agende posts para todas as redes com IA
            </p>
          </div>
        </div>
        <Button className="btn-glow" onClick={handleCreatePost} disabled={isSubmitting}>
          <Plus className="h-4 w-4 mr-2" />
          {isSubmitting ? "Salvando..." : "Agendar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <Card className="backdrop-blur-xl bg-background/70 border-purple-500/20 p-4 shadow-lg">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md w-full pointer-events-auto"
            />
          </Card>
        </div>

        {/* Post Creation */}
        <div className="lg:col-span-3">
          <Card className="backdrop-blur-xl bg-background/70 border-purple-500/20 p-6 shadow-lg">
            <Tabs defaultValue="create">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="create">Criar Post</TabsTrigger>
                <TabsTrigger value="scheduled">Agendados</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo do Post</label>
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Digite seu conteúdo aqui..."
                    className="min-h-[150px] bg-muted/30 border-border/50"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {postContent.length} caracteres
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateContent}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Gerar com IA
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Selecione as Plataformas</label>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((platform) => {
                      const PlatformIcon =
                        platform.icon === "instagram"
                          ? Instagram
                          : platform.icon === "facebook"
                          ? MessageCircle
                          : platform.icon === "linkedin"
                          ? Linkedin
                          : platform.icon === "whatsapp"
                          ? MessageCircle
                          : platform.icon === "telegram"
                          ? Send
                          : platform.icon === "tiktok"
                          ? Hash
                          : Hash;

                      return (
                        <button
                          key={platform.id}
                          onClick={() => togglePlatform(platform.id)}
                          className={cn(
                            "px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 hover:scale-105",
                            selectedPlatforms.includes(platform.id)
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:border-primary/50"
                          )}
                        >
                          <PlatformIcon
                            className={cn(
                              "h-4 w-4",
                              platform.icon === "instagram" && "text-pink-500",
                              platform.icon === "facebook" && "text-blue-600",
                              platform.icon === "linkedin" && "text-blue-700",
                              platform.icon === "whatsapp" && "text-green-500",
                              platform.icon === "telegram" && "text-blue-400",
                              platform.icon === "tiktok" && "text-gray-900 dark:text-white"
                            )}
                          />
                          <span className="text-sm font-medium">{platform.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Conta conectada</label>
                  {connectedAccounts.length === 0 ? (
                    <p className="text-xs text-yellow-500">
                      Conecte uma conta compatível nas configurações para publicar.
                    </p>
                  ) : (
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger className="h-11 bg-muted/30 border-border/50">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {connectedAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {(account.display_name || account.platform || "Conta")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data e Horário</label>
                    <Input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="bg-muted/30 border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Upload de mídia</label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="justify-start">
                        <Image className="h-4 w-4 mr-2" />
                        Imagem
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Hash className="h-4 w-4 mr-2" />
                        Hashtags
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={handleGenerateHashtags}>
                      <Hash className="h-4 w-4 mr-2" />
                      Gerar Hashtags
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      Salvar Rascunho
                    </Button>
                    <Button
                      className="btn-glow"
                      onClick={handleCreatePost}
                      disabled={isSubmitting || connectedAccounts.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Salvando..." : "Agendar Post"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scheduled" className="space-y-4">
                {isLoadingPosts ? (
                  <p className="text-sm text-muted-foreground">Carregando posts...</p>
                ) : scheduledCards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum post agendado.</p>
                ) : (
                  scheduledCards.map((post) => {
                    const scheduledAt = post.scheduled_at ? new Date(post.scheduled_at) : null;
                    return (
                      <Card
                        key={post.id}
                        className="bg-muted/20 border border-border/40 p-5 hover:border-primary/40 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {post.platforms.map((platform) => (
                                <Badge key={`${post.id}-${platform}`} variant="secondary" className="capitalize">
                                  {platform}
                                </Badge>
                              ))}
                              <Badge
                                variant={post.status === "scheduled" ? "default" : "outline"}
                                className={cn(
                                  "capitalize",
                                  post.status === "scheduled" ? "bg-primary/20 text-primary" : "text-muted-foreground"
                                )}
                              >
                                {post.status}
                              </Badge>
                            </div>

                            <p className="text-sm mb-2 break-words">{post.caption || "(Sem legenda)"}</p>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              {scheduledAt && (
                                <>
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {scheduledAt.toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </>
                              )}
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Status: {post.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
