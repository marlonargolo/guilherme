import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WebhookLog {
  id: string;
  endpoint_id: string;
  status_code: number;
  request_payload: any;
  response_payload: any;
  executed_at: string;
  execution_time_ms: number;
  error_message: string | null;
  success: boolean;
  custom_endpoints: {
    name: string;
    url: string;
  };
}

export function WebhookLogs() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select(`
          *,
          custom_endpoints (
            name,
            url
          )
        `)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error);
      toast.error("Erro ao carregar logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Histórico de Execuções</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{log.custom_endpoints?.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {log.custom_endpoints?.url}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.status_code || 'Erro'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.execution_time_ms}ms</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(log.executed_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Execução</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Endpoint</p>
                  <p className="font-medium">{selectedLog.custom_endpoints?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedLog.success ? "default" : "destructive"}>
                    {selectedLog.status_code || 'Erro'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Execução</p>
                  <p className="font-medium">{selectedLog.execution_time_ms}ms</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(selectedLog.executed_at)}</p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Erro</p>
                  <pre className="text-sm bg-destructive/10 text-destructive p-3 rounded">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Payload Enviado</p>
                <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedLog.request_payload, null, 2)}
                </pre>
              </div>

              {selectedLog.response_payload && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Resposta</p>
                  <pre className="text-xs bg-muted/30 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.response_payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
