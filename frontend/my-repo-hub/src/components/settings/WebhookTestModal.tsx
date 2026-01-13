import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";

interface WebhookTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpoint: {
    id: string;
    name: string;
    url: string;
    method: string;
    body?: any;
  };
}

export function WebhookTestModal({ open, onOpenChange, endpoint }: WebhookTestModalProps) {
  const [payload, setPayload] = useState(JSON.stringify(endpoint.body || {}, null, 2));
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(payload);
      } catch (e) {
        toast.error("Payload JSON inválido");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('call-webhook', {
        body: {
          endpointId: endpoint.id,
          testPayload: parsedPayload,
        }
      });

      if (error) throw error;

      setResult(data);

      if (data.success) {
        toast.success(`Webhook executado com sucesso! (${data.statusCode})`);
      } else {
        toast.error(`Falha ao executar webhook: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      console.error('Erro ao testar webhook:', error);
      toast.error(error.message || "Erro ao executar teste");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Testar Webhook: {endpoint.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">URL</Label>
            <p className="text-sm font-mono bg-muted/30 p-2 rounded">{endpoint.url}</p>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Método</Label>
            <p className="text-sm font-mono bg-muted/30 p-2 rounded">{endpoint.method}</p>
          </div>

          <div>
            <Label htmlFor="payload">Payload (JSON)</Label>
            <Textarea
              id="payload"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="font-mono text-sm min-h-[150px] bg-muted/30"
              placeholder='{"key": "value"}'
            />
          </div>

          <Button 
            onClick={handleTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Teste
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-2">
              <Label>Resultado</Label>
              <div className="bg-muted/30 p-4 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`text-sm font-medium ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                    {result.statusCode || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tempo:</span>
                  <span className="text-sm font-medium">{result.executionTime}ms</span>
                </div>
                {result.error && (
                  <div>
                    <span className="text-sm text-muted-foreground">Erro:</span>
                    <p className="text-sm text-red-500 mt-1">{result.error}</p>
                  </div>
                )}
                {result.response && (
                  <div>
                    <span className="text-sm text-muted-foreground">Resposta:</span>
                    <pre className="text-xs bg-background p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
