import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Facebook, MessageCircle, CheckCircle, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FirstTimeSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

interface ConnectionForm {
  username: string;
  password: string;
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

interface ConnectedAccount {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  status: string;
  connected_at: string;
}

const BACKEND_URL = 
  import.meta.env.VITE_BACKEND_URL || 
  'https://api.aitonomy.ai';

export function FirstTimeSetupModal({ open, onComplete }: FirstTimeSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [instagram, setInstagram] = useState<ConnectionForm>({ username: "", password: "" });
  const [facebook, setFacebook] = useState<ConnectionForm>({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set<string>());
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estados específicos do WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [qrPolling, setQrPolling] = useState<NodeJS.Timeout | null>(null);

  const platforms = [
    { 
      id: "instagram", 
      name: "Instagram", 
      icon: Instagram, 
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      form: instagram, 
      setForm: setInstagram 
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      icon: Facebook, 
      color: "text-blue-600",
      bgColor: "bg-blue-600/10",
      form: facebook, 
      setForm: setFacebook 
    },
    { 
      id: "whatsapp", 
      name: "WhatsApp", 
      icon: MessageCircle, 
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      form: null, 
      setForm: null 
    },
  ];

  // Obter userId
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // Verificar status do WhatsApp ao abrir o modal
  useEffect(() => {
    if (open && platforms[currentStep]?.id === "whatsapp" && userId) {
      checkWhatsAppStatus();
    }
  }, [open, currentStep, userId]);

  // Polling do QR Code
  useEffect(() => {
    if (whatsappStatus?.requiresQR && !whatsappStatus.ready) {
      const interval = setInterval(() => {
        fetchQRCode();
      }, 3000);
      
      setQrPolling(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (qrPolling) {
      clearInterval(qrPolling);
      setQrPolling(null);
    }
  }, [whatsappStatus?.requiresQR, whatsappStatus?.ready]);

  // Limpar polling ao fechar o modal
  useEffect(() => {
    if (!open && qrPolling) {
      clearInterval(qrPolling);
      setQrPolling(null);
    }
  }, [open]);

  // Verificar contas já conectadas ao abrir o modal
  useEffect(() => {
    if (open) {
      checkConnectedAccounts();
    }
  }, [open]);

  const checkConnectedAccounts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/oauth/accounts`, {
        headers: userId ? { 'X-User-ID': userId } : {}
      });
      
      if (response.ok) {
        const accounts: ConnectedAccount[] = await response.json();
        const connectedPlatforms = new Set<string>(accounts.map((acc: ConnectedAccount) => acc.platform));
        setCompleted(connectedPlatforms);
      }
    } catch (error) {
      console.error('Erro ao verificar contas conectadas:', error);
    }
  };

  const handleInstagramOAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/oauth/instagram/auth-url`, {
        headers: userId ? { 'X-User-ID': userId } : {}
      });
      
      if (!response.ok) throw new Error('Falha ao obter URL de autenticação');
      
      const data = await response.json();
      
      if (data.auth_url) {
        window.open(data.auth_url, 'instagram_oauth', 'width=500,height=600');
        
        // Verificar periodicamente se conectou
        const checkInterval = setInterval(async () => {
          await checkConnectedAccounts();
          if (completed.has('instagram')) {
            clearInterval(checkInterval);
            toast.success('Instagram conectado com sucesso!');
          }
        }, 2000);
        
        setTimeout(() => clearInterval(checkInterval), 60000);
      }
    } catch (error) {
      console.error('Erro no OAuth Instagram:', error);
      toast.error('Erro ao iniciar autenticação do Instagram');
    }
  };

  const handleFacebookOAuth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/oauth/facebook/auth-url`, {
        headers: userId ? { 'X-User-ID': userId } : {}
      });
      
      if (!response.ok) throw new Error('Falha ao obter URL de autenticação');
      
      const data = await response.json();
      
      if (data.auth_url) {
        window.open(data.auth_url, 'facebook_oauth', 'width=500,height=600');
        
        const checkInterval = setInterval(async () => {
          await checkConnectedAccounts();
          if (completed.has('facebook')) {
            clearInterval(checkInterval);
            toast.success('Facebook conectado com sucesso!');
          }
        }, 2000);
        
        setTimeout(() => clearInterval(checkInterval), 60000);
      }
    } catch (error) {
      console.error('Erro no OAuth Facebook:', error);
      toast.error('Erro ao iniciar autenticação do Facebook');
    }
  };

  const handleLegacyConnect = async (platformId: string, credentials: ConnectionForm) => {
    if (!credentials.username || !credentials.password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const endpoint = platformId === 'instagram' 
        ? `${BACKEND_URL}/oauth/instagram/connect`
        : `${BACKEND_URL}/oauth/facebook/connect`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-ID': userId } : {})
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (!response.ok) throw new Error('Falha na conexão');

      const data = await response.json();
      
      if (data.success && userId) {
        await supabase.from("integrations").upsert([
          {
            user_id: userId,
            channel: platformId as "instagram" | "facebook",
            credentials: {
              username: credentials.username,
              connected_at: new Date().toISOString()
            },
            status: "connected",
            last_sync: new Date().toISOString(),
          },
        ]);

        const newCompleted = new Set<string>(completed);
        newCompleted.add(platformId);
        setCompleted(newCompleted);
        toast.success(`${platforms.find(p => p.id === platformId)?.name} conectado!`);
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("Erro ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== WHATSAPP FUNCTIONS ====================

  const checkWhatsAppStatus = async () => {
    if (!userId) return;
    
    setWhatsappLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/whatsapp/status`, {
        headers: {
          'X-User-ID': userId
        }
      });
      
      if (!response.ok) {
        throw new Error('Servidor WhatsApp indisponível');
      }

      const data: WhatsAppStatus = await response.json();
      setWhatsappStatus(data);

      if (data.ready) {
        await saveWhatsAppConnection(data.clientInfo?.phone || 'connected');
        const newCompleted = new Set<string>(completed);
        newCompleted.add('whatsapp');
        setCompleted(newCompleted);
        toast.success('WhatsApp já conectado!');
      } else if (data.requiresQR) {
        fetchQRCode();
      }
    } catch (error) {
      console.error('Erro ao verificar status WhatsApp:', error);
      toast.error('Erro ao conectar com servidor WhatsApp');
      setWhatsappStatus({
        userId: userId,
        status: 'error',
        ready: false,
        requiresQR: false
      });
    } finally {
      setWhatsappLoading(false);
    }
  };

  const fetchQRCode = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/whatsapp/qr`, {
        headers: {
          'X-User-ID': userId
        }
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
        const newCompleted = new Set<string>(completed);
        newCompleted.add('whatsapp');
        setCompleted(newCompleted);
        toast.success('WhatsApp conectado com sucesso!');
        
        if (qrPolling) {
          clearInterval(qrPolling);
          setQrPolling(null);
        }
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
    
    setWhatsappLoading(true);
    try {
      await fetch(`${BACKEND_URL}/whatsapp/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        }
      });
      
      toast.info('Reiniciando conexão WhatsApp...');
      setTimeout(() => checkWhatsAppStatus(), 3000);
    } catch (error) {
      toast.error('Erro ao reiniciar conexão');
      setWhatsappLoading(false);
    }
  };

  const handleSkipAll = () => {
    onComplete();
  };

  const allConnected = completed.size === platforms.length;
  const currentPlatform = platforms[currentStep];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Bem-vindo ao SocialFlow! 🚀</DialogTitle>
          <DialogDescription className="text-base">
            Conecte suas redes sociais para começar a automatizar suas mensagens
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentPlatform?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {platforms.map((platform, index) => {
              const Icon = platform.icon;
              const isCompleted = completed.has(platform.id);
              return (
                <TabsTrigger
                  key={platform.id}
                  value={platform.id}
                  onClick={() => setCurrentStep(index)}
                  className="relative data-[state=active]:bg-primary/10"
                >
                  <Icon className={cn("h-4 w-4 mr-2", platform.color)} />
                  <span className="hidden sm:inline">{platform.name}</span>
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-500 absolute -top-1 -right-1" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* INSTAGRAM - Conteúdo igual ao anterior */}
          <TabsContent value="instagram" className="space-y-4">
            {!completed.has("instagram") ? (
              <>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20">
                  <div className="p-3 rounded-lg bg-background">
                    <Instagram className="h-6 w-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Instagram</h3>
                    <p className="text-sm text-muted-foreground">
                      Conecte sua conta para automação de mensagens
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <Button
                    onClick={handleInstagramOAuth}
                    disabled={loading}
                    className="w-full h-11 btn-glow bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Conectar com Instagram (Recomendado)
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Ou use credenciais</span>
                    </div>
                  </div>

                  <Input
                    value={instagram.username}
                    onChange={(e) => setInstagram({ ...instagram, username: e.target.value })}
                    placeholder="Usuário"
                    className="h-11"
                  />

                  <Input
                    type="password"
                    value={instagram.password}
                    onChange={(e) => setInstagram({ ...instagram, password: e.target.value })}
                    placeholder="Senha"
                    className="h-11"
                  />

                  <Button
                    onClick={() => handleLegacyConnect("instagram", instagram)}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-11"
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Conectar com Credenciais
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-600">Instagram Conectado!</p>
              </div>
            )}
          </TabsContent>

          {/* FACEBOOK - Similar ao Instagram */}
          <TabsContent value="facebook" className="space-y-4">
            {/* Conteúdo similar ao Instagram */}
          </TabsContent>

          {/* WHATSAPP */}
          <TabsContent value="whatsapp" className="space-y-4">
            {!completed.has("whatsapp") ? (
              <>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-green-400/10 rounded-lg border border-green-500/20">
                  <div className="p-3 rounded-lg bg-background">
                    <MessageCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">
                      Escaneie o QR Code com seu celular
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={restartWhatsAppConnection}
                    disabled={whatsappLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", whatsappLoading && "animate-spin")} />
                  </Button>
                </div>

                {whatsappLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground">Conectando ao servidor...</p>
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
              </>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-600">WhatsApp Conectado!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          {currentStep > 0 && (
            <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
              Voltar
            </Button>
          )}
          
          <Button variant="outline" onClick={handleSkipAll} className="flex-1">
            Pular Configuração
          </Button>
          
          {currentStep < platforms.length - 1 ? (
            <Button onClick={() => setCurrentStep(prev => prev + 1)} className="flex-1">
              Próximo
            </Button>
          ) : (
            <Button onClick={onComplete} className="flex-1" disabled={!allConnected}>
              {allConnected ? "Concluir ✨" : "Finalizar Depois"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}