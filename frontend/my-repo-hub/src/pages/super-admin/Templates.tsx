import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Sparkles, Eye, TrendingUp, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface Template {
  id: string;
  title: string;
  description: string;
  image_url: string;
  prompt: string;
  category: string;
  subcategory: string;
  created_at: string;
}

const categories = ["Estilos artísticos", "Corporativo e profissional", "Gênero e temas", "Humor e tom", "Complementos opcionais"];
const subcategories: Record<string, string[]> = {
  "Estilos artísticos": ["Realista", "Cinematográfico", "Anime", "Arquitetura", "Desenho animado", "Renderização 3D", "Vetor", "Aquarela", "Esboço / Arte de linha", "Pintura a óleo", "Resumo", "Surreal", "Moda", "Fotografia", "Retrato"],
  "Corporativo e profissional": ["Corporativo", "Negócios", "Minimalista", "Moderno", "Produto / Cartaz", "Logotipo", "Infográfico", "Arte conceitual"],
  "Gênero e temas": ["Fantasia", "Ficção científica", "Cyberpunk", "Retrô / Vintage", "Grunge"],
  "Humor e tom": ["Vibrante / Colorido", "Escuro / Temperamental", "Elegante"],
  "Complementos opcionais": ["Falha", "Néon", "Design plano"],
};

const categoryGradients: Record<string, string> = {
  "Estilos artísticos": "from-purple-500 to-pink-500",
  "Corporativo e profissional": "from-blue-500 to-cyan-500",
  "Gênero e temas": "from-green-500 to-emerald-500",
  "Humor e tom": "from-orange-500 to-red-500",
  "Complementos opcionais": "from-pink-500 to-purple-500",
};

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase.from("user_templates").select("*").eq("is_system_template", true).order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar templates: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `templates/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("automation-media").upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from("automation-media").getPublicUrl(filePath);
    return publicUrl;
  };

  const handleCreateTemplate = async () => {
    if (!title || !category || !subcategory || !prompt || !imageFile) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setIsSaving(true);
    try {
      const imageUrl = await uploadImage(imageFile);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("user_templates").insert({ user_id: user.id, title, description, category, subcategory, prompt, image_url: imageUrl, is_system_template: true });
      if (error) throw error;
      toast.success("Template criado com sucesso!");
      setTitle(""); setDescription(""); setCategory(""); setSubcategory(""); setPrompt(""); setImageFile(null); setImagePreview(""); setIsDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      toast.error("Erro ao criar template: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este template?")) return;
    try {
      const { error } = await supabase.from("user_templates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Template deletado com sucesso!");
      loadTemplates();
    } catch (error: any) {
      toast.error("Erro ao deletar template: " + error.message);
    }
  };

  const filteredTemplates = selectedCategory === "all" ? templates : templates.filter((t) => t.category === selectedCategory);
  const totalTemplates = templates.length;
  const categoryCounts = categories.reduce((acc, cat) => { acc[cat] = templates.filter((t) => t.category === cat).length; return acc; }, {} as Record<string, number>);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl"><Sparkles className="h-6 w-6 text-white" /></div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Templates Globais</h1>
              <p className="text-muted-foreground mt-1">Disponíveis no Creator Studio para todos os usuários</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"><Plus className="h-4 w-4" />Novo Template</Button></DialogTrigger>
            <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto border-primary/20">
              <DialogHeader><DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Criar Template</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do template" className="bg-background/50 border-border" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="bg-background/50 border-border"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Subcategoria</Label><Select value={subcategory} onValueChange={setSubcategory} disabled={!category}><SelectTrigger className="bg-background/50 border-border"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{category && subcategories[category]?.map((sub) => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}</SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Descrição (opcional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição" className="bg-background/50 border-border" /></div>
                <div className="space-y-2"><Label>Prompt</Label><Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt para geração" rows={5} className="bg-background/50 border-border resize-none" /></div>
                <div className="space-y-2"><Label>Imagem</Label><Input type="file" accept="image/*" onChange={handleImageChange} className="bg-background/50 border-border" />{imagePreview && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-3"><img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-border" /></motion.div>)}</div>
                <Button onClick={handleCreateTemplate} disabled={isSaving} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">{isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</>) : (<><Plus className="mr-2 h-4 w-4" />Criar Template</>)}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><Card className="glass-card border-purple-500/20"><CardContent className="pt-6"><div className="flex items-start justify-between"><div className="space-y-2"><p className="text-sm text-muted-foreground">Total</p><p className="text-3xl font-bold">{totalTemplates}</p><div className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-400" /><span className="text-xs text-green-400 font-semibold">Templates ativos</span></div></div><div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 bg-opacity-10"><Sparkles className="h-6 w-6 text-purple-400" /></div></div></CardContent></Card></motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}><Card className="glass-card border-blue-500/20"><CardContent className="pt-6"><div className="flex items-start justify-between"><div className="space-y-2"><p className="text-sm text-muted-foreground">Categorias</p><p className="text-3xl font-bold">{categories.length}</p><p className="text-xs text-muted-foreground">Organizadas</p></div><div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 bg-opacity-10"><Eye className="h-6 w-6 text-blue-400" /></div></div></CardContent></Card></motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Card className="glass-card border-green-500/20"><CardContent className="pt-6"><div className="flex items-start justify-between"><div className="space-y-2"><p className="text-sm text-muted-foreground">Mais Popular</p><p className="text-lg font-bold truncate">{Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}</p><p className="text-xs text-muted-foreground">{Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} templates</p></div><div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 bg-opacity-10"><Users className="h-6 w-6 text-green-400" /></div></div></CardContent></Card></motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}><Card className="glass-card border-orange-500/20"><CardContent className="pt-6"><div className="flex items-start justify-between"><div className="space-y-2"><p className="text-sm text-muted-foreground">Uso do Sistema</p><p className="text-3xl font-bold">94%</p><Progress value={94} className="h-1.5" /></div><div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 bg-opacity-10"><Zap className="h-6 w-6 text-orange-400" /></div></div></CardContent></Card></motion.div>
        </div>

        {/* Templates Grid */}
        <Card className="glass-card border-primary/20">
          <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
            <CardHeader className="border-b border-border/50">
              <TabsList className="grid w-full grid-cols-6 bg-background/50">
                <TabsTrigger value="all">Todos</TabsTrigger>
                {categories.map((cat) => (<TabsTrigger key={cat} value={cat} className="truncate">{cat.split(" ")[0]}</TabsTrigger>))}
              </TabsList>
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="all" className="mt-0">
                {isLoading ? (<div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>) : filteredTemplates.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 space-y-4"><div className="p-4 bg-primary/10 rounded-full"><Sparkles className="h-12 w-12 text-primary" /></div><div className="text-center"><h3 className="text-xl font-semibold mb-2">Nenhum template encontrado</h3><p className="text-muted-foreground mb-4">Crie seu primeiro template</p><Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500"><Plus className="h-4 w-4" />Criar Template</Button></div></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><AnimatePresence mode="popLayout">{filteredTemplates.map((template, idx) => { const gradient = categoryGradients[template.category] || "from-gray-500 to-gray-700"; return (<motion.div key={template.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05 }}><Card className="glass-card border-primary/20 hover:border-primary/40 transition-all group overflow-hidden"><div className="aspect-square relative overflow-hidden"><img src={template.image_url} alt={template.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" /><div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"><div className="absolute bottom-0 left-0 right-0 p-4"><Button size="sm" variant="destructive" className="w-full gap-2" onClick={() => handleDeleteTemplate(template.id)}><Trash2 className="h-3.5 w-3.5" />Excluir</Button></div></div></div><CardContent className="p-4"><h3 className="font-semibold text-lg mb-2 truncate">{template.title}</h3>{template.description && (<p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.description}</p>)}<div className="flex gap-2 flex-wrap"><Badge className={`bg-gradient-to-r ${gradient} text-white border-0`}>{template.category}</Badge><Badge variant="outline" className="border-border/50">{template.subcategory}</Badge></div></CardContent></Card></motion.div>); })}</AnimatePresence></div>)}
              </TabsContent>
              {categories.map((cat) => (<TabsContent key={cat} value={cat} className="mt-0"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><AnimatePresence mode="popLayout">{filteredTemplates.map((template, idx) => { const gradient = categoryGradients[template.category] || "from-gray-500 to-gray-700"; return (<motion.div key={template.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05 }}><Card className="glass-card border-primary/20 hover:border-primary/40 transition-all group overflow-hidden"><div className="aspect-square relative overflow-hidden"><img src={template.image_url} alt={template.title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" /><div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"><div className="absolute bottom-0 left-0 right-0 p-4"><Button size="sm" variant="destructive" className="w-full gap-2" onClick={() => handleDeleteTemplate(template.id)}><Trash2 className="h-3.5 w-3.5" />Excluir</Button></div></div></div><CardContent className="p-4"><h3 className="font-semibold text-lg mb-2 truncate">{template.title}</h3>{template.description && (<p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.description}</p>)}<div className="flex gap-2 flex-wrap"><Badge className={`bg-gradient-to-r ${gradient} text-white border-0`}>{template.category}</Badge><Badge variant="outline" className="border-border/50">{template.subcategory}</Badge></div></CardContent></Card></motion.div>); })}</AnimatePresence></div></TabsContent>))}
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
