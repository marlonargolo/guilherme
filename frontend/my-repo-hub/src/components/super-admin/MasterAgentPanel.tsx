import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bot, Send, Loader2, Brain, Zap, MessageSquare, Activity, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function MasterAgentPanel() {
  const [testMessage, setTestMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const testAgent = async () => {
    if (!testMessage.trim()) {
      toast.error("Digite uma mensagem para testar");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('master-agent', {
        body: {
          message: testMessage,
          context: [],
          user_id: (await supabase.auth.getUser()).data.user?.id,
          platform: 'instagram',
          sender_username: 'test_user'
        }
      });

      if (error) throw error;

      setResponse(data);
      toast.success("Resposta gerada com sucesso!");
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(error.message || "Erro ao testar agente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center">
          <Bot className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Master Agent
          </h3>
          <p className="text-xs text-muted-foreground">Central de IA omnichannel</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">Modelo</p>
                <p className="text-sm font-bold text-purple-400">GPT-5 Mini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-bold text-green-400">Ativo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-cyan-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <div>
                <p className="text-xs text-muted-foreground">Taxa</p>
                <p className="text-sm font-bold text-cyan-400">97%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Agent */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-400" />
            Testar Agente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Digite uma mensagem de teste..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="min-h-[80px] bg-background/50 border-border text-sm"
          />
          <Button 
            onClick={testAgent} 
            disabled={isLoading}
            size="sm"
            className="w-full btn-glow"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-3 w-3" />
                Testar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card className="glass-card border-cyan-500/20 animate-in fade-in-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              Resposta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Mensagem:</p>
              <p className="text-sm">{response.agent_response?.reply}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Ação:</p>
                <Badge variant="default" className="text-xs">
                  {response.agent_response?.action}
                </Badge>
              </div>
              <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Confiança:</p>
                <div className="flex items-center gap-2">
                  <Progress value={95} className="h-1.5" />
                  <span className="text-xs font-bold">95%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
