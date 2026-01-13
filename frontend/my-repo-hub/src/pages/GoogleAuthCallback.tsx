import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        console.log('Processando callback do Google...');
        console.log('URL completa:', window.location.href);
        
        // Extrair parâmetros da hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const expiresAt = params.get('expires_at');
        
        if (accessToken) {
          console.log('Token encontrado na URL');
          
          // Definir a sessão manualmente se necessário
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || undefined,
          });
          
          if (sessionError) {
            console.error('Erro ao definir sessão:', sessionError);
            throw sessionError;
          }
          
          if (session) {
            console.log('Sessão definida com sucesso:', session.user.email);
            
            // Verificar se o usuário já tem um perfil
            const { data: existingUser, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Erro ao verificar perfil:', profileError);
            }

            // Se não existe perfil, criar um
            if (!existingUser && session.user) {
              console.log('Criando novo perfil para usuário do Google...');
              
              const { error: insertError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || 
                              session.user.user_metadata?.name || 
                              '',
                    avatar_url: session.user.user_metadata?.avatar_url || 
                               session.user.user_metadata?.picture,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }
                ]);

              if (insertError) {
                console.error('Erro ao criar perfil:', insertError);
              } else {
                console.log('Perfil criado com sucesso');
              }
            }

            // Verificar se é superadmin
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('role', 'superadmin')
              .maybeSingle();

            setStatus('success');
            setMessage(`Bem-vindo, ${session.user.user_metadata?.full_name || session.user.email}!`);

            toast({
              title: "Login realizado!",
              description: `Bem-vindo, ${session.user.user_metadata?.full_name || session.user.email}!`,
            });

            // Redirecionar baseado no papel após 2 segundos
            setTimeout(() => {
              if (roles) {
                navigate("/super-admin", { replace: true });
              } else {
                navigate("/inbox", { replace: true });
              }
            }, 2000);
            
          } else {
            throw new Error('Sessão não criada');
          }
        } else {
          // Tentar obter a sessão normalmente
          console.log('Nenhum token na URL, tentando obter sessão...');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Erro ao obter sessão:', error);
            throw error;
          }

          if (session) {
            // Mesma lógica acima...
            console.log('Sessão obtida:', session.user.email);
            // ... resto do código para criar perfil e redirecionar
          } else {
            throw new Error('Nenhuma sessão encontrada');
          }
        }

      } catch (error: any) {
        console.error('Erro no callback do Google:', error);
        setStatus('error');
        setMessage(error.message || "Erro na autenticação");
        
        toast({
          title: "Erro na autenticação",
          description: error.message || "Não foi possível concluir o login com Google.",
          variant: "destructive",
        });

        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    };

    handleGoogleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8 max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">{message}</h2>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto processamos sua autenticação...
            </p>
            <div className="text-xs text-muted-foreground mt-4">
              URL: {window.location.hostname}
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-green-600">{message}</h2>
            <p className="text-sm text-muted-foreground">
              Redirecionando em instantes...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-red-600">Erro</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">
              Você será redirecionado para a página de login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}