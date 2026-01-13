// contexts/IntegrationsContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Integration {
  id: string;
  user_id: string;
  channel: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'whatsapp' | 'telegram';
  status: 'connected' | 'disconnected' | 'error';
  credentials: {
    access_token?: string;
    refresh_token?: string;
    username?: string;
    account_name?: string;
    account_id?: string;
    display_name?: string;
    email?: string;
    phone?: string;
    profile_id?: string;
    open_id?: string;
    instagram_account_id?: string;
    page_id?: string;
    expires_at?: string;
    connected_at?: string;
    token_refreshed_at?: string;
  };
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}

interface IntegrationsContextType {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  
  // Métodos
  loadIntegrations: () => Promise<void>;
  getIntegration: (channel: string) => Integration | null;
  isConnected: (channel: string) => boolean;
  getConnectedChannels: () => string[];
  getAccessToken: (channel: string) => string | null;
  
  // Estatísticas
  connectedCount: number;
  hasAnyConnection: boolean;
}

const IntegrationsContext = createContext<IntegrationsContextType | undefined>(undefined);

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Obter userId ao montar
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // Carregar integrações
  const loadIntegrations = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'connected');

      if (supabaseError) throw supabaseError;

      setIntegrations(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar integrações:', err);
      setError(err.message || 'Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  // Carregar ao montar e quando userId mudar
  useEffect(() => {
    if (userId) {
      loadIntegrations();
    }
  }, [userId]);

  // Configurar listener para mudanças em tempo real
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('integrations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integrations',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Mudança nas integrações:', payload);
          loadIntegrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Obter integração específica
  const getIntegration = (channel: string): Integration | null => {
    return integrations.find((i) => i.channel === channel) || null;
  };

  // Verificar se canal está conectado
  const isConnected = (channel: string): boolean => {
    const integration = getIntegration(channel);
    return integration?.status === 'connected';
  };

  // Obter lista de canais conectados
  const getConnectedChannels = (): string[] => {
    return integrations
      .filter((i) => i.status === 'connected')
      .map((i) => i.channel);
  };

  // Obter access token de um canal
  const getAccessToken = (channel: string): string | null => {
    const integration = getIntegration(channel);
    return integration?.credentials?.access_token || null;
  };

  // Estatísticas
  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const hasAnyConnection = connectedCount > 0;

  const value: IntegrationsContextType = {
    integrations,
    loading,
    error,
    loadIntegrations,
    getIntegration,
    isConnected,
    getConnectedChannels,
    getAccessToken,
    connectedCount,
    hasAnyConnection,
  };

  return (
    <IntegrationsContext.Provider value={value}>
      {children}
    </IntegrationsContext.Provider>
  );
}

export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (context === undefined) {
    throw new Error('useIntegrations deve ser usado dentro de um IntegrationsProvider');
  }
  return context;
}

// Hook auxiliar para filtrar por plataformas específicas
export function useIntegrationsByPlatforms(platforms: string[]) {
  const { integrations } = useIntegrations();
  
  return integrations.filter(integration => 
    platforms.includes(integration.channel)
  );
}

// Hook auxiliar para obter estatísticas
export function useIntegrationsStats() {
  const { integrations } = useIntegrations();
  
  return {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    disconnected: integrations.filter(i => i.status === 'disconnected').length,
    byPlatform: integrations.reduce((acc, integration) => {
      acc[integration.channel] = (acc[integration.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}