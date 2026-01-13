import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Integration {
  id: string;
  channel: string;
  status: string;
  last_sync: string | null;
}

export function IntegrationsStatus() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("integrations")
        .select("id, channel, status, last_sync")
        .eq("user_id", user.id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error("Error loading integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
            Conectado
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
            Erro
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            Pendente
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Carregando status...</p>
      </Card>
    );
  }

  if (integrations.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Nenhuma integração configurada ainda.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Status das Integrações</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadIntegrations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(integration.status)}
              <div>
                <p className="font-medium capitalize">{integration.channel}</p>
                {integration.last_sync && (
                  <p className="text-xs text-muted-foreground">
                    Última sincronização:{" "}
                    {formatDistanceToNow(new Date(integration.last_sync), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge(integration.status)}
          </div>
        ))}
      </div>
    </Card>
  );
}


















