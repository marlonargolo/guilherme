import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://api.aitonomy.ai';

export default function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        // Erro na autorização
        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Erro na autorização');
          
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth_error',
                error: error,
                description: errorDescription
              }, '*');
            }
            window.close();
          }, 2000);
          return;
        }

        // Validar parâmetros
        if (!code || !state) {
          setStatus('error');
          setMessage('Parâmetros inválidos');
          setTimeout(() => window.close(), 2000);
          return;
        }

        // Extrair informações do state: "platform_userId_timestamp"
        const stateParts = state.split('_');
        if (stateParts.length < 2) {
          setStatus('error');
          setMessage('Estado de autenticação inválido');
          setTimeout(() => window.close(), 2000);
          return;
        }
        
        const platform = stateParts[0];
        const userId = stateParts[1];
        
        // Validar userId (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
          setStatus('error');
          setMessage('ID de usuário inválido');
          setTimeout(() => window.close(), 2000);
          return;
        }

        setMessage(`Conectando ${platform}...`);

        // Enviar para o backend
        const response = await fetch(`${BACKEND_URL}/oauth/${platform}/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId
          },
          body: JSON.stringify({ code, state })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha na autenticação');
        }

        const data = await response.json();

        setStatus('success');
        setMessage(`${data.platform || platform} conectado com sucesso!`);

        // Notificar janela pai
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_success',
            platform: platform,
            data: data
          }, '*');
        }

        // Fechar após 1.5 segundos
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (error: any) {
        console.error('Erro no callback OAuth:', error);
        setStatus('error');
        setMessage(error.message || 'Erro ao processar autenticação');
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth_error',
            error: error.message
          }, '*');
        }

        setTimeout(() => window.close(), 3000);
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">{message}</h2>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto processamos sua autenticação...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-green-600">{message}</h2>
            <p className="text-sm text-muted-foreground">
              Esta janela será fechada automaticamente...
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
              Esta janela será fechada automaticamente...
            </p>
          </>
        )}
      </div>
    </div>
  );
}