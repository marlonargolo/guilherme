import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WhatsAppQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface WhatsAppStatus {
  status: string;
  ready: boolean;
  connected: boolean;
  requiresQR: boolean;
  qrCode?: string;
  clientInfo?: {
    phone: string;
    pushname: string;
    platform?: string;
  };
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.aitonomy.ai';

export function WhatsAppQRModal({ open, onOpenChange, onSuccess }: WhatsAppQRModalProps) {
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrPolling, setQrPolling] = useState<NodeJS.Timeout | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Obter userId uma vez ao abrir o modal
  useEffect(() => {
    const getUserId = async () => {
      if (open) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setCurrentUserId(user.id);
            checkWhatsAppStatus(user.id);
          }
        } catch (error) {
          console.error('Erro ao obter usuário:', error);
          toast.error('Erro de autenticação');
        }
      }
    };
    
    getUserId();
    
    return () => {
      setCurrentUserId(null);
    };
  }, [open]);

  // Polling do QR Code quando necessário
  useEffect(() => {
    if (open && currentUserId && whatsappStatus?.requiresQR && !whatsappStatus.ready) {
      const interval = setInterval(() => {
        if (currentUserId) {
          fetchQRCode(currentUserId);
        }
      }, 3000);
      
      setQrPolling(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (qrPolling) {
      clearInterval(qrPolling);
      setQrPolling(null);
    }
  }, [open, currentUserId, whatsappStatus?.requiresQR, whatsappStatus?.ready]);

  // Limpar polling ao fechar
  useEffect(() => {
    if (!open && qrPolling) {
      clearInterval(qrPolling);
      setQrPolling(null);
    }
  }, [open, qrPolling]);

  const checkWhatsAppStatus = async (userId: string) => {
    setLoading(true);
    try {
      // Buscar status do servidor WhatsApp via backend
      const response = await fetch(`${BACKEND_URL}/whatsapp/status`, {
        headers: {
          'X-User-ID': userId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Servidor retornou status ${response.status}`);
      }

      const data: WhatsAppStatus = await response.json();
      
      // Adicionar userId ao objeto de status para consistência
      const enhancedData = { ...data };
      
      setWhatsappStatus(enhancedData);

      // Se já está conectado, salvar e finalizar
      if (data.ready && data.connected) {
        await saveWhatsAppConnection(data.clientInfo?.phone || 'connected', userId);
        toast.success('WhatsApp já conectado!');
        onSuccess();
      } else if (data.requiresQR) {
        // Buscar QR Code imediatamente
        fetchQRCode(userId);
      }
    } catch (error) {
      console.error('Erro ao verificar status WhatsApp:', error);
      toast.error('Erro ao conectar com servidor WhatsApp');
      setWhatsappStatus({
        status: 'error',
        ready: false,
        connected: false,
        requiresQR: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCode = async (userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/whatsapp/qr`, {
        headers: {
          'X-User-ID': userId
        }
      });
      
      const data = await response.json();

      if (data.connected) {
        // Conectado com sucesso
        setWhatsappStatus(prev => ({
          ...prev!,
          ready: true,
          connected: true,
          requiresQR: false,
          status: 'connected',
          clientInfo: data.clientInfo
        }));
        
        await saveWhatsAppConnection(data.clientInfo?.phone || 'connected', userId);
        toast.success('WhatsApp conectado com sucesso!');
        
        if (qrPolling) {
          clearInterval(qrPolling);
          setQrPolling(null);
        }

        // Aguardar um momento e chamar onSuccess
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else if (data.qrCode) {
        // Atualizar QR Code
        setWhatsappStatus(prev => ({
          ...prev!,
          qrCode: data.qrCode,
          requiresQR: true
        }));
      } else if (data.qrCodeDataURL) {
        // Usar Data URL se disponível
        setWhatsappStatus(prev => ({
          ...prev!,
          qrCode: data.qrCodeDataURL,
          requiresQR: true
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar QR Code:', error);
    }
  };

  const saveWhatsAppConnection = async (phone: string, userId: string) => {
    try {
      const { error } = await supabase.from("integrations").upsert([
        {
          user_id: userId,
          channel: "whatsapp",
          credentials: {
            phone: phone,
            user_id: userId, // Importante: identificador único por usuário
            connected_at: new Date().toISOString()
          },
          status: "connected",
          last_sync: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar conexão WhatsApp:", error);
      throw error;
    }
  };

  const restartWhatsAppConnection = async () => {
    if (!currentUserId) {
      toast.error('Usuário não autenticado');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/whatsapp/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUserId
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error('Falha ao reiniciar conexão');
      }
      
      toast.info('Reiniciando conexão WhatsApp...');
      
      // Aguardar e verificar status
      setTimeout(() => {
        checkWhatsAppStatus(currentUserId);
      }, 3000);
    } catch (error) {
      console.error('Erro ao reiniciar WhatsApp:', error);
      toast.error('Erro ao reiniciar conexão');
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (currentUserId) {
      checkWhatsAppStatus(currentUserId);
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          checkWhatsAppStatus(user.id);
        }
      } catch (error) {
        toast.error('Usuário não autenticado');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com seu celular para conectar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Conectando ao servidor...</p>
            </div>
          ) : whatsappStatus?.status === 'error' ? (
            <div className="p-6 text-center bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="font-semibold text-red-600 mb-2">Servidor Indisponível</p>
              <p className="text-sm text-muted-foreground mb-4">
                Não foi possível conectar ao servidor WhatsApp
              </p>
              <Button onClick={handleCheckStatus} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          ) : whatsappStatus?.ready && whatsappStatus?.connected ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-green-600 mb-2">WhatsApp Conectado!</p>
              {whatsappStatus.clientInfo && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{whatsappStatus.clientInfo.pushname}</p>
                  {whatsappStatus.clientInfo.phone && (
                    <p className="text-xs mt-1">({whatsappStatus.clientInfo.phone})</p>
                  )}
                </div>
              )}
            </div>
          ) : whatsappStatus?.requiresQR && whatsappStatus.qrCode ? (
            <div className="space-y-4">
              <div className="bg-muted/30 p-6 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Abra o WhatsApp no seu celular e escaneie o código QR abaixo:
                </p>
                
                {/* QR Code */}
                <div className="bg-white p-6 rounded-lg inline-block shadow-lg">
                  {whatsappStatus.qrCode.startsWith('data:image') ? (
                    // Se for Data URL, usar diretamente
                    <img 
                      src={whatsappStatus.qrCode}
                      alt="WhatsApp QR Code"
                      className="w-[300px] h-[300px] mx-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    // Se for string de QR, gerar via API
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappStatus.qrCode)}`}
                      alt="WhatsApp QR Code"
                      className="w-[300px] h-[300px] mx-auto"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  )}
                </div>
                
                <div className="mt-6 space-y-2 text-left">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Abra o WhatsApp no celular</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Toque em Menu (⋮) ou Configurações</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Toque em "Aparelhos conectados" → "Conectar aparelho"</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="font-semibold">4.</span>
                    <span>Escaneie este código QR</span>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Aguardando conexão...
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={restartWhatsAppConnection}
                  disabled={loading}
                  className="flex-1"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Gerar Novo QR
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Clique no botão abaixo para iniciar a conexão
              </p>
              <Button onClick={handleCheckStatus} className="btn-glow">
                <RefreshCw className="h-4 w-4 mr-2" />
                Iniciar Conexão
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}