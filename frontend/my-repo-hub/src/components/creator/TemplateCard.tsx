import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Edit3, Save, Copy } from "lucide-react";
import { toast } from "sonner";

interface TemplateCardProps {
  title: string;
  description: string;
  image: string;
  prompt: string;
  onUseTemplate: (prompt: string) => void;
  onSavePrompt?: (newPrompt: string) => void;
}

export function TemplateCard({ 
  title, 
  description, 
  image, 
  prompt,
  onUseTemplate,
  onSavePrompt 
}: TemplateCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const [showImage, setShowImage] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("✅ Template baixado!");
    } catch (error) {
      toast.error("Erro ao baixar template");
    }
  };

  const handleSavePrompt = () => {
    if (onSavePrompt) {
      onSavePrompt(editedPrompt);
      setIsEditing(false);
      toast.success("✅ Prompt salvo!");
    }
  };

  const handleUseTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUseTemplate(editedPrompt || prompt);
    toast.success("Prompt copiado! Gere sua imagem.");
  };

  return (
    <>
      <Card className="overflow-hidden hover:border-primary/50 transition-all border-2 group">
        <div 
          className="aspect-video relative overflow-hidden bg-muted cursor-pointer"
          onClick={() => setShowImage(true)}
        >
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
          
          {/* Overlay com botões */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            
            {/* Botões no topo */}
            <div className="absolute top-3 right-3 flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0 bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                title="Baixar template"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {prompt && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 w-8 p-0 bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  title="Editar prompt"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Botão usar template no centro */}
            <div className="absolute inset-0 flex items-end justify-center pb-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20"
                onClick={handleUseTemplate}
              >
                <Copy className="mr-2 h-3 w-3" />
                Usar Template
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>

      {/* Dialog para editar prompt */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>✏️ Editar Prompt - {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="Cole ou edite o prompt aqui..."
              className="min-h-[200px] font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePrompt} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Prompt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar imagem */}
      <Dialog open={showImage} onOpenChange={setShowImage}>
        <DialogContent className="sm:max-w-[800px]">
          <img src={image} alt={title} className="w-full h-auto rounded-lg" />
        </DialogContent>
      </Dialog>
    </>
  );
}
