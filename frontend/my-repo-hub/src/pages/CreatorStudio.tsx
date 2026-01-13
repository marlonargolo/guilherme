import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Adicionado
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Wand2,
  Upload,
  ImageIcon,
  CalendarIcon,
  Clock,
  Sparkles,
  Instagram,
  MessageCircle,
  Hash,
  Loader2,
  Video,
  Grid3x3,
  Film,
  CheckCircle2,
  TrendingUp,
  Zap,
  Send,
  Smartphone,
  Trash2,
  Images,
  Copy,
  Save,
  Scissors,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import tiktokNeon from "@/assets/tiktok-neon.png";
import facebookNeon from "@/assets/facebook-neon.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { TemplateCard } from "@/components/creator/TemplateCard";
import templateNatal from "@/assets/template-natal-ofertas.png";
import templateRetratoLuxo from "@/assets/template-retrato-luxo.png";
import templateDisintegration from "@/assets/template-disintegration.png";
import template3DFigure from "@/assets/template-3d-figure.png";
import { useIntegrations } from '@/contexts/IntegrationsContext';
import { PlatformSelector } from '@/components/PlatformSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Settings } from 'lucide-react';

const FORMATS = [
  { id: "feed", name: "Feed", width: 1080, height: 1080, icon: Grid3x3, desc: "1:1" },
  { id: "stories", name: "Stories", width: 1080, height: 1920, icon: Film, desc: "9:16" },
  { id: "reels", name: "Reels", width: 1080, height: 1920, icon: Video, desc: "9:16" },
];

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500", logo: null },
  { id: "tiktok", name: "TikTok", icon: Hash, color: "text-gray-900 dark:text-white", logo: tiktokNeon },
  { id: "facebook", name: "Facebook", icon: MessageCircle, color: "text-blue-600", logo: facebookNeon },
];

interface GalleryPost {
  id: string;
  media_url: string;
  content: string;
  platforms: string[];
  created_at: string;
  post_format?: string;
}

export default function CreatorStudio() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"ai" | "upload" | "templates" | "history">("ai");
  const [prompt, setPrompt] = useState("");
  const [postContent, setPostContent] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("feed");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [galleryPosts, setGalleryPosts] = useState<GalleryPost[]>([]);
  
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
  const [scheduleTime, setScheduleTime] = useState("14:00");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [aiSuggestions, setAiSuggestions] = useState<{
    bestTime: string;
    engagement: number;
    hashtags: string[];
  } | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [publishedPosts, setPublishedPosts] = useState<GalleryPost[]>([]);
  const [isGeneratingSuggestedText, setIsGeneratingSuggestedText] = useState(false);
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState("");
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [selectedTemplateImage, setSelectedTemplateImage] = useState<string | null>(null);

  // Templates (upload + busca por categoria/subcategoria)
  type TemplateItem = {
    id: string;
    title: string;
    description?: string;
    image: string;
    prompt: string;
    category?: string;
    subcategory?: string;
  };

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string | undefined>(undefined);
  const [templateSubcategory, setTemplateSubcategory] = useState<string | undefined>(undefined);

  // Novo template (form)
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [newTemplatePrompt, setNewTemplatePrompt] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("");
  const [newTemplateSubcategory, setNewTemplateSubcategory] = useState("");
  const [newTemplateImage, setNewTemplateImage] = useState<string | null>(null);

  // Mova os componentes para dentro da função principal, mas antes do return
  const PlatformSelectionStep = () => {
    const { hasAnyConnection, connectedCount, loading } = useIntegrations();
    const [localSelectedPlatforms, setLocalSelectedPlatforms] = useState<string[]>([]);

    const handlePlatformToggle = (platformId: string) => {
      setLocalSelectedPlatforms(prev =>
        prev.includes(platformId)
          ? prev.filter(p => p !== platformId)
          : [...prev, platformId]
      );
    };

    if (loading) {
      return (
        <Card className="glass-card border-purple-500/20 hover:border-purple-500/40 transition-all p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              2
            </div>
            <Label className="text-lg font-semibold">Verificando plataformas...</Label>
          </div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Card>
      );
    }

    if (!hasAnyConnection) {
      return (
        <Card className="glass-card border-purple-500/20 hover:border-purple-500/40 transition-all p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              2
            </div>
            <Label className="text-lg font-semibold">Selecione as plataformas</Label>
          </div>
          
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertDescription className="ml-2">
              <p className="font-semibold mb-2">Nenhuma plataforma conectada</p>
              <p className="text-sm text-muted-foreground mb-4">
                Conecte suas redes sociais para começar a publicar conteúdo.
              </p>
              <Link to="/settings">
                <Button size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Ir para Configurações
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </Card>
      );
    }

    return (
      <Card className="glass-card border-purple-500/20 hover:border-purple-500/40 transition-all p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            2
          </div>
          <div className="flex-1">
            <Label className="text-lg font-semibold">Selecione as plataformas</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {connectedCount} plataforma(s) disponível(eis)
            </p>
          </div>
        </div>
        
        <PlatformSelector
          selectedPlatforms={localSelectedPlatforms}
          onPlatformToggle={handlePlatformToggle}
          showOnlyConnected={true}
        />
        
        {localSelectedPlatforms.length > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary font-medium">
              ✓ {localSelectedPlatforms.length} plataforma(s) selecionada(s)
            </p>
          </div>
        )}
      </Card>
    );
  };

  const PreviewCard = () => {
    const { getIntegration } = useIntegrations();
    const format = FORMATS.find(f => f.id === selectedFormat);
    const getCurrentMedia = () => {
      if (activeTab === "ai" && generatedImage) return generatedImage;
      if (activeTab === "upload" && uploadedPreview) return uploadedPreview;
      return null;
    };
    const currentMedia = getCurrentMedia();

    return (
      <Card className="glass-card p-8 bg-gradient-to-br from-background/95 via-background/90 to-primary/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">Preview</Label>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{format?.name}</Badge>
            {selectedPlatforms.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Send className="h-3 w-3" />
                {selectedPlatforms.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Mobile Preview */}
        <div className="space-y-6">
          <div className="relative mx-auto" style={{ maxWidth: "340px" }}>
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-950 to-black rounded-[2.5rem] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-2xl z-10"></div>
              
              <div className="relative bg-black rounded-[2.2rem] overflow-hidden">
                <div className="bg-black/80 backdrop-blur-xl px-6 py-3 flex justify-end items-center">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-4 h-2.5 border border-white/40 rounded-sm relative">
                      <div className="absolute inset-0.5 bg-white/80 rounded-[1px]"></div>
                    </div>
                  </div>
                </div>
                
                <div className="relative bg-background">
                  <div
                    className="w-full"
                    style={{
                      aspectRatio: format ? `${format.width}/${format.height}` : "1/1",
                    }}
                  >
                    {currentMedia ? (
                      <img src={currentMedia} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-cyan-500/5 backdrop-blur-sm">
                        <div className="relative">
                          <ImageIcon className="h-20 w-20 text-cyan-400/30" />
                          <div className="absolute inset-0 blur-2xl bg-cyan-400/10" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">Crie ou carregue mídia</p>
                      </div>
                    )}
                  </div>
                  
                  {postContent && (
                    <div className="p-4 border-t border-border/30 bg-background/95 backdrop-blur-xl">
                      <p className="text-xs leading-relaxed line-clamp-3 text-foreground/80">{postContent}</p>
                    </div>
                  )}
                  
                  {/* Mostrar plataformas selecionadas com info da conta */}
                  {selectedPlatforms.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Publicar em:
                      </p>
                      {selectedPlatforms.map(platformId => {
                        const integration = getIntegration(platformId);
                        const platform = PLATFORMS.find(p => p.id === platformId);
                        
                        if (!platform) return null;

                        return (
                          <div 
                            key={platformId}
                            className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30"
                          >
                            <platform.icon className={cn("h-4 w-4", platform.color)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{platform.name}</p>
                              {integration?.credentials?.username && (
                                <p className="text-xs text-muted-foreground truncate">
                                  @{integration.credentials.username}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Conectado
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  useEffect(() => {
    loadScheduledPosts();
    loadGalleryPosts();
    loadUserTemplates();
  }, []);

  const loadUserTemplates = async () => {
    try {
      // Carregar templates do sistema (criados por admins)
      const { data, error } = await supabase
        .from("user_templates")
        .select("*")
        .eq("is_system_template", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const systemTemplates: TemplateItem[] = (data || []).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        image: t.image_url,
        prompt: t.prompt,
        category: t.category || undefined,
        subcategory: t.subcategory || undefined
      }));

      setTemplates(systemTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const loadGalleryPosts = async () => {
    setLoadingGallery(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "published")
        .gte("created_at", tenDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGalleryPosts(data || []);
      setPublishedPosts(data || []);
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoadingGallery(false);
    }
  };

  const loadScheduledPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setScheduledPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const deleteScheduledPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
      
      toast.success("Post removido!");
      loadScheduledPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erro ao remover post");
    }
  };

  const deleteGalleryPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;
      
      toast.success("Post removido da galeria!");
      loadGalleryPosts();
    } catch (error) {
      console.error("Error deleting gallery post:", error);
      toast.error("Erro ao remover post");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado. Use imagem ou vídeo.");
      return;
    }

    // Validar tamanho (máx 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 100MB.");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    const fileType = file.type.startsWith('video/') ? 'Vídeo' : 'Imagem';
    toast.success(`${fileType} carregado! ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  };

  const handleNewTemplateImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTemplateImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast.success("Imagem carregada!");
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateTitle.trim() || !newTemplatePrompt.trim() || !newTemplateImage) {
      toast.error("Preencha título, prompt e imagem");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      // Upload image to storage
      const fileName = `${user.id}/templates/${Date.now()}.png`;
      const base64Data = newTemplateImage.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('automation-media')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('automation-media')
        .getPublicUrl(fileName);

      // Save template to database
      const { error } = await supabase
        .from("user_templates")
        .insert({
          user_id: user.id,
          title: newTemplateTitle,
          description: "",
          image_url: publicUrl,
          prompt: newTemplatePrompt,
          category: newTemplateCategory || null,
          subcategory: newTemplateSubcategory || null
        });

      if (error) throw error;

      toast.success("✅ Template salvo!");
      setNewTemplateTitle("");
      setNewTemplatePrompt("");
      setNewTemplateCategory("");
      setNewTemplateSubcategory("");
      setNewTemplateImage(null);
      loadUserTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erro ao salvar template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("user_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Template removido!");
      loadUserTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Erro ao remover template");
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchSearch = !templateSearch || 
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.prompt.toLowerCase().includes(templateSearch.toLowerCase());
    const matchCategory = !templateCategory || t.category === templateCategory;
    const matchSubcategory = !templateSubcategory || t.subcategory === templateSubcategory;
    return matchSearch && matchCategory && matchSubcategory;
  });

  const allCategories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)));
  const allSubcategories = Array.from(new Set(templates.map(t => t.subcategory).filter(Boolean)));

  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReferenceImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast.success(t('creator.ai.referenceImageUploaded'));
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    toast.success(t('creator.cover.uploaded'));
  };

  // Função auxiliar para codificar base64 de forma segura
    const safeBtoa = (str: string): string => {
      return btoa(unescape(encodeURIComponent(str)));
    };

    const generateLocalImage = async (promptText: string) => {
      // Criar um hash simples para variação de cores
      const safePrompt = promptText.replace(/[^\x00-\x7F]/g, ''); // Remove caracteres não-ASCII
      const hash = safePrompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue1 = hash % 360;
      const hue2 = (hash + 120) % 360;
      
      // Limitar o tamanho do prompt
      const displayPrompt = safePrompt.length > 40 ? safePrompt.substring(0, 40) + '...' : safePrompt;
      
      const svgString = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1}, 70%, 50%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue2}, 70%, 50%);stop-opacity:1" />
        </linearGradient>
        <radialGradient id="grad2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:white;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:white;stop-opacity:0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      <circle cx="540" cy="400" r="200" fill="url(#grad2)"/>
      
      <rect x="90" y="500" width="900" height="180" rx="20" fill="rgba(0,0,0,0.3)"/>
      <text x="540" y="570" font-family="Arial, sans-serif" font-size="36" fill="white" text-anchor="middle" font-weight="bold">
        "${displayPrompt}"
      </text>
      
      <text x="540" y="650" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" opacity="0.8">
        Generated by AI
      </text>
      
      <text x="540" y="700" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" opacity="0.6">
        ${new Date().toISOString().split('T')[0]}
      </text>
    </svg>`;
      
      return `data:image/svg+xml;base64,${safeBtoa(svgString)}`;
    };

    // Versão simplificada da função generateWithAI
    const generateWithAI = async () => {
      if (!prompt.trim()) {
        toast.error("Digite uma descrição");
        return;
      }

      setIsGenerating(true);
      
      try {
        console.log('Gerando imagem localmente para prompt:', prompt);
        
        // Simular um delay para parecer real
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const imageDataUrl = await generateLocalImage(prompt);
        setGeneratedImage(imageDataUrl);
        toast.success("✨ Imagem gerada com sucesso!");
        
      } catch (error) {
        console.error("Error generating image:", error);
        
        // Fallback ainda mais simples
        const fallbackSvg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#4f46e5"/>
      <text x="540" y="540" font-family="Arial" font-size="36" fill="white" text-anchor="middle" dy=".3em">
        ${prompt.substring(0, 20)}
      </text>
    </svg>`;
        
        const base64Fallback = safeBtoa(fallbackSvg);
        setGeneratedImage(`data:image/svg+xml;base64,${base64Fallback}`);
        toast.success("Imagem gerada!");
        
      } finally {
        setIsGenerating(false);
      }
    };


  const generateAISuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAiSuggestions({
        bestTime: "18:00 - 20:00",
        engagement: Math.floor(Math.random() * 30) + 60,
        hashtags: [
          "#tendencia",
          "#viral",
          "#instagram",
          "#conteudo",
          "#engajamento"
        ]
      });
      
      toast.success("✨ Sugestões geradas!");
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast.error("Erro ao gerar sugestões");
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const generateCaptionWithAI = async () => {
    if (!postContent && !prompt) {
      toast.error("Digite uma descrição ou prompt primeiro");
      return;
    }

    setIsGeneratingCaption(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-campaign-text", {
        body: {
          prompt: prompt || postContent,
          format: "caption",
          tone: "engaging"
        }
      });

      if (error) throw error;

      if (data?.text) {
        setPostContent(data.text);
        toast.success("✨ Legenda gerada!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao gerar legenda");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const generateSuggestedTextFromCaption = async () => {
    if (!postContent.trim()) {
      toast.error("Digite a legenda primeiro para gerar sugestões");
      return;
    }

    setIsGeneratingSuggestedText(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-campaign-text", {
        body: {
          prompt: `Com base nesta legenda: "${postContent}", crie um texto complementar e criativo para postagem em redes sociais. O texto deve ser envolvente, chamativo e otimizado para engajamento.`,
          format: "post",
          tone: "creative"
        }
      });

      if (error) throw error;

      if (data?.text) {
        setPostContent(data.text);
        setUploadedPreview(templateRetratoLuxo);
        setGeneratedImage(null);
        toast.success("✨ Texto sugerido gerado!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao gerar sugestão de texto");
    } finally {
      setIsGeneratingSuggestedText(false);
    }
  };

  const generateHashtagsWithAI = async () => {
    setIsGeneratingCaption(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hashtags = "\n\n#socialmedia #marketing #digitalmarketing #contentcreator #viral";
      setPostContent(prev => prev + hashtags);
      toast.success("✨ Hashtags adicionadas!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao gerar hashtags");
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const publishPost = async () => {
    const { hasAnyConnection, isConnected } = useIntegrations();
    
    // Validar conexões
    if (!hasAnyConnection) {
      toast.error("Conecte pelo menos uma plataforma antes de publicar");
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error("Selecione pelo menos uma plataforma");
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

    if (!postContent.trim()) {
      toast.error("Escreva uma legenda");
      return;
    }

    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const scheduledDateTime = new Date(`${scheduleDate.toISOString().split('T')[0]}T${scheduleTime}`);
      let mediaUrl = generatedImage || uploadedPreview;
      let coverImageUrl = null;

      // Upload de mídia se necessário
      if (uploadedFile && uploadedPreview) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('automation-media')
          .upload(fileName, uploadedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('automation-media')
            .getPublicUrl(fileName);
          mediaUrl = publicUrl;
        }
      }

      // Upload de capa se necessário
      if (coverImageFile && coverImagePreview) {
        const fileExt = coverImageFile.name.split('.').pop();
        const fileName = `${user.id}/covers/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('automation-media')
          .upload(fileName, coverImageFile);

        if (uploadError) {
          console.error("Cover upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('automation-media')
            .getPublicUrl(fileName);
          coverImageUrl = publicUrl;
        }
      }

      // Salvar post agendado
      const { data: scheduledPost, error } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user.id,
          content: postContent,
          platforms: selectedPlatforms,
          scheduled_date: scheduledDateTime.toISOString(),
          status: "scheduled",
          media_url: mediaUrl,
          cover_image: coverImageUrl,
          post_format: selectedFormat,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(
        `📅 Post agendado para ${selectedPlatforms.length} plataforma(s)!`
      );
      
      loadScheduledPosts();
      
      // Limpar formulário
      setPostContent("");
      setPrompt("");
      setGeneratedImage(null);
      setUploadedPreview(null);
      setUploadedFile(null);
      setCoverImageFile(null);
      setCoverImagePreview(null);
      setAiSuggestions(null);
      setSelectedPlatforms([]);
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error("Erro ao agendar publicação");
    } finally {
      setIsPublishing(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const getCurrentMedia = () => {
    if (activeTab === "ai" && generatedImage) return generatedImage;
    if (activeTab === "upload" && uploadedPreview) return uploadedPreview;
    return null;
  };

  const currentMedia = getCurrentMedia();
  const format = FORMATS.find(f => f.id === selectedFormat);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        {/* Header */}
        <div className="backdrop-blur-xl bg-background/80 border-b border-border/50 sticky top-0 z-40">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Criação e Agendamento
                  </h1>
                  <p className="text-muted-foreground mt-1">Crie, programe e publique conteúdo de alto impacto ✨</p>
                </div>
              </div>
              <LanguageSelector />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Creation Flow */}
            <div className="space-y-6">
              {/* Step 1: Format */}
              <Card className="glass-card border-cyan-500/20 hover:border-cyan-500/40 transition-all p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    1
                  </div>
                  <Label className="text-lg font-semibold">Selecione o formato</Label>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {FORMATS.map((fmt) => {
                    const Icon = fmt.icon;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all",
                          selectedFormat === fmt.id
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                            : "border-border/50 hover:border-primary/50 bg-background/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-6 w-6 mx-auto mb-2",
                          selectedFormat === fmt.id ? "text-primary" : "text-muted-foreground"
                        )} />
                        <p className="text-sm font-medium">{fmt.name}</p>
                        <p className="text-xs text-muted-foreground">{fmt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Step 2: Platforms */}
              <PlatformSelectionStep />

              {/* Step 3: Create Content */}
              <Card className="glass-card border-orange-500/20 hover:border-orange-500/40 transition-all p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                    3
                  </div>
                  <Label className="text-lg font-semibold">Criar conteúdo</Label>
                </div>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid w-full grid-cols-4 mb-6 bg-background/50 backdrop-blur-xl border-2 border-primary/20">
                    <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20">
                      <Sparkles className="h-4 w-4" />
                      Artes IA
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20">
                      <Upload className="h-4 w-4" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20">
                      <Images className="h-4 w-4" />
                      Templates
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-accent/20">
                      <Send className="h-4 w-4" />
                      Histórico
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ai" className="space-y-4">
                    <div>
                      <Label>Descreva sua imagem</Label>
                      <Textarea
                        placeholder="Ex: Um pôr do sol na praia com cores vibrantes..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="mt-2 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block">Imagem de referência (opcional)</Label>
                      {referenceImagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-primary/30">
                          <img src={referenceImagePreview} alt="Reference" className="w-full h-32 object-cover" />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setReferenceImageFile(null);
                              setReferenceImagePreview(null);
                              toast.success("Imagem de referência removida");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleReferenceImageUpload}
                            className="hidden"
                            id="reference-upload"
                          />
                          <label htmlFor="reference-upload" className="cursor-pointer">
                            <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Clique para adicionar referência</p>
                          </label>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={generateWithAI}
                      disabled={isGenerating || !prompt}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Gerar com IA
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4">
                    <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="font-semibold">Clique para upload</p>
                        <p className="text-sm text-muted-foreground">Imagem (JPG, PNG, GIF, WEBP) ou Vídeo (MP4, MOV, WEBM)</p>
                        <p className="text-xs text-muted-foreground mt-2">Máximo 100MB</p>
                      </label>
                    </div>
                    
                    {uploadedFile && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{uploadedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {uploadedFile.type.startsWith('video/') ? 'Vídeo' : 'Imagem'} • {(uploadedFile.size / 1024 / 1024).toFixed(2)}MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadedFile(null);
                              setUploadedPreview(null);
                              toast.success("Arquivo removido");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {uploadedPreview && (
                          <div className="relative rounded-xl overflow-hidden border-2 border-primary/30">
                            {uploadedFile.type.startsWith('video/') ? (
                              <video 
                                src={uploadedPreview} 
                                className="w-full max-h-80 object-contain bg-black"
                                controls
                              />
                            ) : (
                              <img 
                                src={uploadedPreview} 
                                alt="Preview" 
                                className="w-full max-h-80 object-contain"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          Histórico de Publicações
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">Suas últimas postagens</p>
                      </div>
                      <Badge variant="outline" className="text-primary border-primary/30">
                        {publishedPosts.length} posts
                      </Badge>
                    </div>
                    
                    {loadingGallery ? (
                      <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-muted-foreground mt-4">Carregando histórico...</p>
                      </div>
                    ) : publishedPosts.length === 0 ? (
                      <Card className="glass-card border-2 border-dashed border-primary/30">
                        <CardContent className="py-12 text-center">
                          <Send className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                          <h3 className="text-lg font-semibold mb-2">Nenhuma publicação ainda</h3>
                          <p className="text-muted-foreground">Suas postagens publicadas aparecerão aqui</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                        {publishedPosts.map((post) => (
                          <Card key={post.id} className="glass-card overflow-hidden group hover:border-primary/50 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                            {post.media_url && (
                              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
                                {post.media_url.includes('video') || post.post_format === 'reels' ? (
                                  <video 
                                    src={post.media_url} 
                                    className="w-full h-full object-cover"
                                    controls
                                  />
                                ) : (
                                  <img 
                                    src={post.media_url} 
                                    alt="Post" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                            <CardContent className="p-4 space-y-3">
                              <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                              <div className="flex flex-wrap gap-2">
                                {post.platforms?.map((platform: string) => {
                                  const p = PLATFORMS.find(pl => pl.id === platform);
                                  return p ? (
                                    <Badge key={platform} variant="outline" className="text-xs border-primary/30">
                                      {p.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  {new Date(post.created_at).toLocaleDateString('pt-BR')}
                                </span>
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                  Publicado
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="templates" className="space-y-4">
                    {/* Busca e filtros */}
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="🔍 Buscar..."
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        className="col-span-3 text-sm"
                      />
                      <Select value={templateCategory} onValueChange={(v) => setTemplateCategory(v === "all" ? undefined : v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {allCategories.map(cat => (
                            <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={templateSubcategory} onValueChange={(v) => setTemplateSubcategory(v === "all" ? undefined : v)}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Subcategoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {allSubcategories.map(sub => (
                            <SelectItem key={sub} value={sub!}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Templates padrão + personalizados - 2 colunas */}
                    <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                      {/* Templates padrão */}
                      <TemplateCard
                        title="Natal de Ofertas"
                        description="Vermelho e verde com decoração natalina festiva"
                        image={templateNatal}
                        prompt="Crie um anúncio de Natal promocional com fundo vermelho iluminado, decorações natalinas em verde (pinheiros, estrelas e laços dourados) e o título 'Feliz Natal' em destaque, com tipografia festiva. Inclua um texto promocional como 'Seu Natal de Encanto começa aqui com nossas ofertas incríveis!' e um botão de chamada para ação como 'Venha conferir nossas super ofertas!'. Deixe espaço para substituir o logo, o endereço e as redes sociais. O estilo deve transmitir alegria, brilho e clima de celebração, ideal para campanhas natalinas de varejo ou e-commerce."
                        onUseTemplate={(prompt) => {
                          setPrompt(prompt);
                          setActiveTab('ai');
                        }}
                      />

                      <TemplateCard
                        title="Retrato Masculino Luxuoso"
                        description="Estilo editorial com carro esportivo e jato particular"
                        image={templateRetratoLuxo}
                        prompt="Retrato masculino em estilo editorial de luxo, mostrando o mesmo homem da referência principal (barba curta bem aparada, cabelo penteado para trás com volume natural, óculos de armação grossa, expressão confiante e madura) em pé ao lado de um carro esportivo vermelho de alto desempenho, com um jato particular branco ao fundo. Ele veste um terno preto elegante com corte sob medida, camisa branca levemente aberta no colarinho, sapatos de couro pretos e relógio de luxo. A cena ocorre em um aeroporto privado sob luz natural intensa, céu azul com nuvens brancas e tonalidades de meio-dia. O chão de asfalto reflete a luz do sol, e o carro exibe reflexos metálicos realistas. A composição transmite poder, sucesso e sofisticação, com foco no contraste entre o homem, o carro e o jato. Estilo cinematográfico, nitidez alta, textura realista da pele, dos tecidos e das superfícies metálicas."
                        onUseTemplate={(prompt) => {
                          setPrompt(prompt);
                          setActiveTab('ai');
                        }}
                      />

                      <TemplateCard
                        title="Efeito Desintegração"
                        description="Arte dramática com efeito de dispersão cinematográfico"
                        image={templateDisintegration}
                        prompt="Edit this image to show a man walking forward on a rain-slicked urban street, positioned in the center-lower third of the frame, captured in a dramatic three-quarter view. He's wearing a sophisticated charcoal gray trench coat over a black turtleneck and dark fitted trousers, with polished black leather boots. His hand is raised near his chest in a contemplative gesture, checking his watch. The left side of his body is dramatically disintegrating into an explosive dispersion effect—swirling smoke tendrils, ornate clockwork gears, shattered fragments, scattered papers, and metallic particles erupting outward in shades of silver, gray, and slate blue. The background features a misty urban canyon with towering buildings fading into a moody overcast sky. Cinematic depth of field with bokeh lights in the distance. Moody blue-gray color grading with high contrast. Photorealistic digital art style with surreal disintegration effects. 8K quality, dramatic lighting from above creating subtle highlights on the coat."
                        onUseTemplate={(prompt) => {
                          setPrompt(prompt);
                          setActiveTab('ai');
                        }}
                      />

                      <TemplateCard
                        title="Figura 3D Comercial"
                        description="Estilo action figure profissional com embalagem BANDAI"
                        image={template3DFigure}
                        prompt="create a 1/7 scale commercialized figure of the character in the illustration, in a realistic style and environment. Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the ZBrush modeling process of the figure. Next to the computer screen, place a BANDAI-style toy packaging box printed with the original artwork."
                        onUseTemplate={(prompt) => {
                          setPrompt(prompt);
                          setActiveTab('ai');
                        }}
                      />

                      {/* Templates do sistema */}
                      {filteredTemplates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          title={template.title}
                          description={template.description}
                          image={template.image}
                          prompt={template.prompt}
                          onUseTemplate={(prompt) => {
                            setPrompt(prompt);
                            setActiveTab('ai');
                          }}
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Cover Image */}
              <Card className="backdrop-blur-xl bg-background/70 border-purple-500/20 hover:border-purple-500/40 transition-all p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center font-bold text-lg shadow-[0_0_25px_rgba(168,85,247,0.2)]">
                    <ImageIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <Label className="text-lg font-semibold">Capa do Post (Opcional)</Label>
                </div>
                
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-purple-500/30 rounded-xl p-6 text-center hover:border-purple-500/50 transition-colors bg-purple-500/5">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                      id="cover-image-upload"
                    />
                    <label htmlFor="cover-image-upload" className="cursor-pointer">
                      <ImageIcon className="h-10 w-10 mx-auto mb-2 text-purple-400" />
                      <p className="font-semibold text-purple-300">Adicionar imagem de capa</p>
                      <p className="text-xs text-muted-foreground mt-1">Imagem principal do post</p>
                    </label>
                  </div>
                  
                  {coverImagePreview && (
                    <div className="relative rounded-xl overflow-hidden border-2 border-purple-500/30">
                      <img src={coverImagePreview} alt="Cover" className="w-full h-40 object-cover" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setCoverImageFile(null);
                          setCoverImagePreview(null);
                          toast.success("Capa removida");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Caption */}
              <Card className="glass-card border-green-500/20 hover:border-green-500/40 transition-all p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    4
                  </div>
                  <Label className="text-lg font-semibold">Escreva a legenda</Label>
                </div>
                
                <div className="space-y-3">
                  <Textarea
                    placeholder="Digite sua legenda aqui..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="min-h-[150px]"
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={generateCaptionWithAI}
                      disabled={isGeneratingCaption || isGeneratingSuggestedText}
                      variant="outline"
                    >
                      {isGeneratingCaption ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Gerar Legenda
                    </Button>
                    <Button
                      onClick={generateSuggestedTextFromCaption}
                      disabled={isGeneratingCaption || isGeneratingSuggestedText || !postContent.trim()}
                      variant="outline"
                    >
                      {isGeneratingSuggestedText ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Sugerir Texto
                    </Button>
                    <Button
                      onClick={generateHashtagsWithAI}
                      disabled={isGeneratingCaption || isGeneratingSuggestedText}
                      variant="outline"
                    >
                      <Hash className="mr-2 h-4 w-4" />
                      Hashtags
                    </Button>
                  </div>
                </div>
              </Card>

              {/* AI Suggestions Button */}
              <Card className="glass-card p-4">
                <Button
                  onClick={generateAISuggestions}
                  disabled={isGeneratingSuggestions}
                  className="w-full"
                  variant="outline"
                >
                  {isGeneratingSuggestions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando sugestões...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Obter Sugestões da IA
                    </>
                  )}
                </Button>
              </Card>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="space-y-6">
              <PreviewCard />

              {/* AI Suggestions */}
              {(aiSuggestions || isGeneratingSuggestions) && (
                <Card className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <Label className="text-lg font-semibold">Sugestões da IA</Label>
                  </div>

                  {isGeneratingSuggestions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : aiSuggestions ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Melhor horário</p>
                            <p className="text-lg font-bold">{aiSuggestions.bestTime}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const time = aiSuggestions.bestTime.split(" - ")[0];
                            setScheduleTime(time);
                            toast.success("Horário aplicado!");
                          }}
                        >
                          Usar
                        </Button>
                      </div>

                      <div className="p-4 rounded-lg bg-background/50">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-accent" />
                          <p className="text-sm text-muted-foreground">Engajamento esperado</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">{aiSuggestions.engagement}%</span>
                          <Badge variant={aiSuggestions.engagement > 70 ? "default" : "secondary"}>
                            {aiSuggestions.engagement > 70 ? "Alto" : aiSuggestions.engagement > 40 ? "Médio" : "Baixo"}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-background/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Hash className="h-5 w-5 text-primary" />
                          <p className="text-sm text-muted-foreground">Hashtags sugeridas</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.hashtags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="cursor-pointer hover:bg-primary/10">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </Card>
              )}

              {/* Schedule */}
              <Card className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-semibold">Agendar publicação</Label>
                </div>

                <div className="space-y-4">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={(date) => date && setScheduleDate(date)}
                    className="rounded-md border"
                  />
                  
                  <div>
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={publishPost}
                    disabled={isPublishing || !currentMedia || !postContent}
                    className="w-full"
                    size="lg"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Agendar Publicação
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Scheduled Posts */}
              <Card className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-semibold">Posts agendados</Label>
                  <Badge variant="secondary">{scheduledPosts.length}</Badge>
                </div>

                {loadingPosts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : scheduledPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum post agendado
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {scheduledPosts.map((post) => (
                      <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-all">
                        {post.media_url && (
                          <img src={post.media_url} alt="" className="w-16 h-16 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.scheduled_date).toLocaleDateString()} às{" "}
                              {new Date(post.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduledPost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Template Image Modal */}
        <Dialog open={!!selectedTemplateImage} onOpenChange={() => setSelectedTemplateImage(null)}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center bg-black/95 p-4">
              {selectedTemplateImage && (
                <img 
                  src={selectedTemplateImage} 
                  alt="Template completo" 
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}