// OAuthIntegrationCard.tsx - ATUALIZE ESTE ARQUIVO
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Configuração para produção
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://api.aitonomy.ai';

interface Integration {
  id: string;
  channel: string;
  status: string;
  account_name?: string;
  last_sync?: string;
}

interface Channel {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  requiresOAuth: boolean;
}

interface OAuthIntegrationCardProps {
  channel: Channel;
  integration: Integration | null;
  onDisconnect: (integrationId?: string) => void;
  onConnected?: () => void;
  appType?: string;
}

export function OAuthIntegrationCard({
  channel,
  integration,
  onDisconnect,
  onConnected,
  appType = 'omnichannel',
}: OAuthIntegrationCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data || {};
      if (data?.source !== "socialflow-oauth") return;
      setIsConnecting(false);
      if (data?.status === "success") {
        toast.success(`Integração ${channel.name} conectada!`);
        onConnected?.();
      } else {
        toast.error(data?.message || "Falha ao conectar integração");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [channel.name, onConnected]);

  const handleOAuthConnect = async () => {
    setIsConnecting(true);
    try {
      // Determinar qual plataforma usar
      const platform = (() => {
        switch (channel.id) {
          case "facebook":
            return "facebook"; // Mude de "meta" para "facebook"
          case "instagram":
            return "instagram";
          case "tiktok":
            return "tiktok";
          case "linkedin_oidc":
            return "linkedin";
          default:
            throw new Error("Canal não suporta OAuth");
        }
      })();

      // Obter URL de autenticação direto do backend (SEM auth headers)
      const response = await fetch(`${API_BASE}/oauth/${platform}/auth-url`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Falha ao obter URL de autenticação");
      }

      const data = await response.json();
      const authUrl = data?.auth_url;
      
      if (!authUrl) {
        throw new Error("URL de autenticação não retornada");
      }

      // Abrir popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        authUrl,
        "oauth",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error("Não foi possível abrir a janela de autenticação");
      }
      
      popup.focus();
      
      // Verificar periodicamente se a janela foi fechada
      const checkWindow = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkWindow);
          setIsConnecting(false);
          
          // Aguardar um pouco e verificar se foi conectado
          setTimeout(() => {
            onConnected?.();
            toast.success(`Autenticação ${channel.name} concluída!`);
          }, 1000);
        }
      }, 500);
      
    } catch (error: any) {
      console.error('OAuth error:', error);
      toast.error(error.message || 'Erro ao conectar integração');
      setIsConnecting(false);
    }
  };

  const isConnected = integration?.status === "connected";
  const Icon = channel.icon;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${channel.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold">{channel.name}</h4>
            <p className="text-sm text-muted-foreground">
              {channel.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {isConnected ? (
          <>
            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
              ✓ Conectado
            </Badge>
            {integration.account_name && (
              <p className="text-sm text-muted-foreground">
                Conta: {integration.account_name}
              </p>
            )}
            {integration.last_sync && (
              <p className="text-xs text-muted-foreground">
                Última sincronização:{" "}
                {new Date(integration.last_sync).toLocaleString("pt-BR")}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDisconnect(integration?.id)}
              className="w-full"
            >
              Desconectar
            </Button>
          </>
        ) : (
          <Button
            onClick={handleOAuthConnect}
            className="w-full"
            variant="outline"
            disabled={isConnecting}
          >
            {isConnecting ? 'Conectando...' : `Conectar ${channel.name}`}
          </Button>
        )}
      </div>
    </Card>
  );
}