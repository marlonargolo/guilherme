import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  RefreshCw,
  CheckCircle,
  Loader2,
  Briefcase,
  Music,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type IntegrationChannel = Database['public']['Enums']['integration_channel'];

export interface Integration {
  id: string;
  channel: IntegrationChannel;
  status: string;
  credentials: any;
  phone_number?: string;
  last_sync?: string;
}

const BACKEND_URL = 
  import.meta.env.VITE_BACKEND_URL || 
  'https://api.aitonomy.ai';

const WHATSAPP_SERVER_URL = 
  import.meta.env.VITE_WHATSAPP_SERVER_URL || 
  'http://localhost:8001';

// ==================== TIPOS ====================
interface OAuthChannel {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  endpoint: string;
}

interface WhatsAppStatus {
  userId: string;
  status: string;
  ready: boolean;
  requiresQR: boolean;
  qrCode?: string;
  qrCodeDataURL?: string;
  clientInfo?: {
    phone: string;
    pushname: string;
  };
}

// ==================== COMPONENTE OAUTH CARD ====================
function OAuthChannelCard({ 
  channel, 
  integration, 
  onConnect, 
  onDisconnect,
  isConnecting
}: { 
  channel: OAuthChannel;
  integration: Integration | null;
  onConnect: (channelId: string) => void;
  onDisconnect: (channelId: string) => void;
  isConnecting: boolean;
}) {
  const Icon = channel.icon;
  const isConnected = integration?.status === "connected";

  return (
    <div className={cn(
      "border rounded-lg p-6 transition-all hover:shadow-md relative",
      isConnected && "border-green-500/30 bg-green-500/5"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-lg", channel.bgColor)}>
            <Icon className={cn("h-6 w-6", channel.color)} />
          </div>
          <div>
            <h3 className="font-semibold">{channel.name}</h3>
            <p className="text-sm text-muted-foreground">{channel.description}</p>
          </div>
        </div>
        {isConnected && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
      </div>

      {isConnected ? (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Conta: <span className="font-medium text-foreground">
              {integration.credentials?.username || 
               integration.credentials?.page_name ||
               integration.credentials?.name ||
               integration.credentials?.display_name ||
               "Conta conectada"}
            </span>
          </div>
          {integration.last_sync && (
            <p className="text-xs text-muted-foreground">
              Última sincronização: {new Date(integration.last_sync).toLocaleString('pt-BR')}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(channel.id)}
            className="w-full"
            disabled={isConnecting}
          >
            Desconectar
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => onConnect(channel.id)}
          className="w-full"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Conectando...
            </>
          ) : (
            `Conectar ${channel.name}`
          )}
        </Button>
      )}
      
      {isConnecting && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

// ==================== COMPONENTE WHATSAPP MODAL ====================
function WhatsAppQRModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSuccess: () => void;
}) {
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrPolling, setQrPolling] = useState<NodeJS.Timeout | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (open && userId) {
      checkWhatsAppStatus();
    }
    
    return () => {
      if (qrPolling) {
        clearInterval(qrPolling);
        setQrPolling(null);
      }
    };
  }, [open, userId]);

  useEffect(() => {
    if (whatsappStatus?.requiresQR && !whatsappStatus.ready && open) {
      const interval = setInterval(() => {
        fetchQRCode();
      }, 3000);
      
      setQrPolling(interval);
      return () => clearInterval(interval);
    } else if (qrPolling) {
      clearInterval(qrPolling);
      setQrPolling(null);
    }
  }, [whatsappStatus?.requiresQR, whatsappStatus?.ready, open]);

  const checkWhatsAppStatus = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/whatsapp/status`, {
        headers: { 'X-User-ID': userId }
      });
      
      if (!response.ok) throw new Error('Servidor WhatsApp indisponível');

      const data: WhatsAppStatus = await response.json();
      setWhatsappStatus(data);

      if (data.ready) {
        await saveWhatsAppConnection(data.clientInfo?.phone || 'connected');
        toast({
          title: "Sucesso",
          description: "WhatsApp já conectado!",
        });
        onSuccess();
      } else if (data.requiresQR) {
        fetchQRCode();
      }
    } catch (error) {
      console.error('Erro ao verificar status WhatsApp:', error);
      toast({
        title: "Erro",
        description: "Erro ao conectar com servidor WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/whatsapp/qr`, {
        headers: { 'X-User-ID': userId }
      });
      
      const data = await response.json();

      if (data.connected) {
        setWhatsappStatus(prev => ({
          ...prev!,
          ready: true,
          requiresQR: false,
          status: 'connected'
        }));
        
        await saveWhatsAppConnection(data.clientInfo?.phone || 'connected');
        toast({
          title: "Sucesso",
          description: "WhatsApp conectado com sucesso!",
        });
        
        if (qrPolling) {
          clearInterval(qrPolling);
          setQrPolling(null);
        }
        
        onSuccess();
      } else if (data.qrCodeDataURL || data.qrCode) {
        setWhatsappStatus(prev => ({
          ...prev!,
          qrCode: data.qrCode,
          qrCodeDataURL: data.qrCodeDataURL,
          requiresQR: true
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
    }
  };

  const saveWhatsAppConnection = async (phone: string) => {
    if (!userId) return;
    
    try {
      await supabase.from("integrations").upsert([
        {
          user_id: userId,
          channel: "whatsapp",
          credentials: {
            phone: phone,
            server_url: WHATSAPP_SERVER_URL,
            connected_at: new Date().toISOString()
          },
          status: "connected",
          last_sync: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Erro ao salvar conexão WhatsApp:", error);
    }
  };

  const restartWhatsAppConnection = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/whatsapp/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        }
      });
      
      toast({
        title: "Reiniciando",
        description: "Reiniciando conexão WhatsApp...",
      });
      
      setTimeout(() => checkWhatsAppStatus(), 3000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reiniciar conexão",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Conectar WhatsApp</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={restartWhatsAppConnection}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu WhatsApp para conectar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Conectando ao servidor...</p>
            </div>
          ) : whatsappStatus?.ready ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-600">WhatsApp Conectado!</p>
              {whatsappStatus?.clientInfo && (
                <p className="text-sm text-muted-foreground mt-2">
                  {whatsappStatus.clientInfo.pushname} ({whatsappStatus.clientInfo.phone})
                </p>
              )}
              <Button onClick={() => onOpenChange(false)} className="mt-4">
                Fechar
              </Button>
            </div>
          ) : whatsappStatus?.requiresQR && (whatsappStatus.qrCodeDataURL || whatsappStatus.qrCode) ? (
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <div className="bg-white p-6 rounded-lg inline-block shadow-lg">
                {whatsappStatus.qrCodeDataURL ? (
                  <img 
                    src={whatsappStatus.qrCodeDataURL}
                    alt="WhatsApp QR Code"
                    className="w-[300px] h-[300px] mx-auto"
                  />
                ) : (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappStatus.qrCode!)}`}
                    alt="WhatsApp QR Code"
                    className="w-[300px] h-[300px] mx-auto"
                  />
                )}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Aguardando conexão...
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Preparando conexão...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================
export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showWhatsAppQR, setShowWhatsAppQR] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
  const { toast } = useToast();

  // Canais OAuth disponíveis
  const oauthChannels: OAuthChannel[] = [
    {
      id: "facebook",
      name: "Facebook",
      icon: FacebookIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      description: "Conecte sua página do Facebook",
      endpoint: "/oauth/facebook/auth-url"
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: InstagramIcon,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      description: "Conecte seu Instagram Business",
      endpoint: "/oauth/instagram/auth-url"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Briefcase,
      color: "text-blue-700",
      bgColor: "bg-blue-700/10",
      description: "Conecte seu perfil profissional",
      endpoint: "/oauth/linkedin/auth-url"
    },
    {
      id: "tiktok",
      name: "TikTok",
      icon: Music,
      color: "text-pink-600",
      bgColor: "bg-pink-600/10",
      description: "Conecte sua conta do TikTok",
      endpoint: "/oauth/tiktok/auth-url"
    },
  ];

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadIntegrations(user.id);
      }
    };
    getUserId();
  }, []);

  const loadIntegrations = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", uid);

    if (error) {
      console.error("Error loading integrations:", error);
      return;
    }

    setIntegrations(data || []);
  }, []);

  const handleOAuthConnect = async (channelId: string) => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }
    
    const channel = oauthChannels.find(c => c.id === channelId);
    if (!channel) return;

    setConnectingChannel(channelId);

    try {
      // Obter URL de autenticação
      const response = await fetch(`${BACKEND_URL}${channel.endpoint}`, {
        headers: { 'X-User-ID': userId }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao obter URL de autenticação');
      }
      
      const data = await response.json();
      
      if (!data.auth_url) {
        throw new Error('URL de autenticação não recebida');
      }
      
      console.log('🔗 Abrindo OAuth para:', channelId);
      console.log('📊 State:', data.state);
      
      // Abrir popup
      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        data.auth_url,
        `${channelId}_oauth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0,resizable=1`
      );
      
      if (!popup) {
        throw new Error('Popup bloqueado. Permita pop-ups para este site.');
      }
      
      popup.focus();
      
      // Listener para mensagens do callback
      const messageHandler = (event: MessageEvent) => {
        // Validar origem da mensagem
        const allowedOrigins = [
          window.location.origin,
          BACKEND_URL
        ];
        
        if (!allowedOrigins.some(origin => event.origin.includes(origin.replace(/https?:\/\//, '')))) {
          return;
        }

        if (event.data.type === 'oauth_success' && event.data.platform === channelId) {
          console.log('✅ OAuth Success:', event.data);
          popup?.close();
          setConnectingChannel(null);
          loadIntegrations(userId);
          toast({
            title: "Sucesso!",
            description: `${channel.name} conectado com sucesso!`,
          });
          window.removeEventListener('message', messageHandler);
          clearInterval(checkInterval);
        } else if (event.data.type === 'oauth_error') {
          console.error('❌ OAuth Error:', event.data);
          popup?.close();
          setConnectingChannel(null);
          toast({
            title: "Erro",
            description: event.data.error || "Falha na autenticação",
            variant: "destructive",
          });
          window.removeEventListener('message', messageHandler);
          clearInterval(checkInterval);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Verificar se popup foi fechado manualmente
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
          window.removeEventListener('message', messageHandler);
          setConnectingChannel(null);
          
          // Aguardar e recarregar integrações (caso tenha conectado)
          setTimeout(() => {
            loadIntegrations(userId);
          }, 1000);
        }
      }, 500);
      
      // Timeout de 5 minutos
      setTimeout(() => {
        clearInterval(checkInterval);
        window.removeEventListener('message', messageHandler);
        if (!popup.closed) {
          popup.close();
          setConnectingChannel(null);
          toast({
            title: "Timeout",
            description: "Tempo de autenticação expirado",
            variant: "destructive",
          });
        }
      }, 300000);
      
    } catch (error: any) {
      console.error(`❌ Erro OAuth ${channelId}:`, error);
      setConnectingChannel(null);
      toast({
        title: "Erro",
        description: error.message || `Erro ao conectar ${channel.name}`,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (channelId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("user_id", userId)
      .eq("channel", channelId as IntegrationChannel);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível desconectar",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Desconectado",
      description: "Integração removida com sucesso",
    });

    loadIntegrations(userId);
  };

  const getIntegrationStatus = (channel: string) => {
    return integrations.find((i) => i.channel === channel) || null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-2">Integrações de Redes Sociais</h3>
        <p className="text-muted-foreground">
          Conecte suas contas para gerenciar conversas e publicações em um só lugar
        </p>
      </div>

      {/* Redes Sociais OAuth */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Redes Sociais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {oauthChannels.map((channel) => (
            <OAuthChannelCard
              key={channel.id}
              channel={channel}
              integration={getIntegrationStatus(channel.id)}
              onConnect={handleOAuthConnect}
              onDisconnect={handleDisconnect}
              isConnecting={connectingChannel === channel.id}
            />
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Mensageria</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className={cn(
            "border rounded-lg p-6 transition-all hover:shadow-md",
            getIntegrationStatus("whatsapp") && "border-green-500/30 bg-green-500/5"
          )}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <MessageSquare className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">Conecte via QR Code</p>
                </div>
              </div>
              {getIntegrationStatus("whatsapp") && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>

            {getIntegrationStatus("whatsapp") ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Telefone: <span className="font-medium text-foreground">
                    {getIntegrationStatus("whatsapp")?.credentials?.phone || "Conectado"}
                  </span>
                </div>
                {getIntegrationStatus("whatsapp")?.last_sync && (
                  <p className="text-xs text-muted-foreground">
                    Última sincronização: {new Date(getIntegrationStatus("whatsapp")!.last_sync!).toLocaleString('pt-BR')}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect("whatsapp")}
                  className="w-full"
                >
                  Desconectar
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowWhatsAppQR(true)}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Conectar WhatsApp
              </Button>
            )}
          </div>
        </div>
      </div>

      <WhatsAppQRModal
        open={showWhatsAppQR}
        onOpenChange={setShowWhatsAppQR}
        onSuccess={() => {
          if (userId) loadIntegrations(userId);
          setShowWhatsAppQR(false);
        }}
      />
    </div>
  );
}