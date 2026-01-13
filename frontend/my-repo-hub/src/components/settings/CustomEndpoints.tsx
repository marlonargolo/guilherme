import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Play } from "lucide-react";
import { WebhookTestModal } from "./WebhookTestModal";

interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: any;
  body: any;
}

export function CustomEndpoints() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState<Endpoint | null>(null);
  const [newEndpoint, setNewEndpoint] = useState({
    name: "",
    url: "",
    method: "POST",
    headers: "{}",
    body: "{}",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEndpoints();
    ensureN8nEndpoint();
  }, []);

  const ensureN8nEndpoint = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Verificar se o endpoint n8n já existe
    const { data: existing } = await supabase
      .from("custom_endpoints")
      .select("*")
      .eq("user_id", user.id)
      .eq("url", "https://fearlesscassowary-n8n.cloudfy.live/webhook/criar-evo-instancia")
      .single();

    if (!existing) {
      // Criar endpoint automaticamente
      await supabase.from("custom_endpoints").insert({
        user_id: user.id,
        name: "n8n Evolution WhatsApp",
        url: "https://fearlesscassowary-n8n.cloudfy.live/webhook/criar-evo-instancia",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {},
      });

      toast({
        title: "Webhook configurado",
        description: "Endpoint n8n Evolution WhatsApp criado automaticamente",
      });

      loadEndpoints();
    }
  };

  const loadEndpoints = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("custom_endpoints")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading endpoints:", error);
      return;
    }

    setEndpoints(data || []);
  };

  const handleAdd = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const headers = JSON.parse(newEndpoint.headers);
      const body = JSON.parse(newEndpoint.body);

      const { error } = await supabase.from("custom_endpoints").insert({
        user_id: user.id,
        name: newEndpoint.name,
        url: newEndpoint.url,
        method: newEndpoint.method,
        headers,
        body,
      });

      if (error) throw error;

      toast({
        title: "Endpoint adicionado",
        description: "Webhook configurado com sucesso",
      });

      setNewEndpoint({
        name: "",
        url: "",
        method: "POST",
        headers: "{}",
        body: "{}",
      });
      setIsAdding(false);
      loadEndpoints();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Verifique o formato JSON dos campos",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("custom_endpoints")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o endpoint",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Endpoint excluído",
    });
    loadEndpoints();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-lg">Endpoints Personalizados</h4>
          <p className="text-sm text-muted-foreground">
            Configure webhooks e endpoints externos para automações avançadas
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {isAdding && (
        <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Endpoint</Label>
              <Input
                value={newEndpoint.name}
                onChange={(e) =>
                  setNewEndpoint({ ...newEndpoint, name: e.target.value })
                }
                placeholder="Meu Webhook"
              />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select
                value={newEndpoint.method}
                onValueChange={(value) =>
                  setNewEndpoint({ ...newEndpoint, method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={newEndpoint.url}
              onChange={(e) =>
                setNewEndpoint({ ...newEndpoint, url: e.target.value })
              }
              placeholder="https://api.exemplo.com/webhook"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                value={newEndpoint.headers}
                onChange={(e) =>
                  setNewEndpoint({ ...newEndpoint, headers: e.target.value })
                }
                placeholder='{"Authorization": "Bearer token"}'
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Body (JSON)</Label>
              <Textarea
                value={newEndpoint.body}
                onChange={(e) =>
                  setNewEndpoint({ ...newEndpoint, body: e.target.value })
                }
                placeholder='{"key": "value"}'
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAdd}>Salvar Endpoint</Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewEndpoint({
                  name: "",
                  url: "",
                  method: "POST",
                  headers: "{}",
                  body: "{}",
                });
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {endpoints.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.map((endpoint) => (
              <TableRow key={endpoint.id}>
                <TableCell className="font-medium">{endpoint.name}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                    {endpoint.method}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {endpoint.url}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTestEndpoint(endpoint)}
                      title="Testar webhook"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(endpoint.id)}
                      title="Excluir webhook"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {testEndpoint && (
        <WebhookTestModal
          open={!!testEndpoint}
          onOpenChange={() => setTestEndpoint(null)}
          endpoint={testEndpoint}
        />
      )}
    </Card>
  );
}
