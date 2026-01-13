import { supabase } from "@/integrations/supabase/client";
import { getCache, setCache } from "@/utils/cache";

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://api.aitonomy.ai';
const BASE = API_BASE; // Adicionando esta linha para compatibilidade

const simpleFetch = async (url: string, options?: RequestInit) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // Adicionar user_id se disponível
  if (session?.user?.id) {
    headers['x-user-id'] = session.user.id;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

// Função para fetch autorizado (mantida para compatibilidade)
// Função para fetch autorizado
const authorizedFetch = async (url: string, options?: RequestInit) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  // Adicionar user_id se disponível
  if (session?.user?.id) {
    headers['x-user-id'] = session.user.id;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

type GetMessagesOpts = { limit?: number; cacheTtlMs?: number };

export interface ConnectedAccount {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  status: string;
  connected_at: string;
  expires_at?: string;
}

export interface DMAutomationMessage {
  id: number;
  automation_id: number;
  position: number;
  type: string;
  message_type: string;
  content: string;
  media_url?: string | null;
  delay_seconds: number;
  is_followup: boolean;
  followup_delay_hours?: number | null;
  use_ai_response: boolean;
  buttons?: any[] | null;
}

export interface DMAutomation {
  id: number;
  name: string;
  trigger: string;
  trigger_filter?: string | null;
  public_reply?: string | null;
  platforms: string[];
  active: boolean;
  created_at: string;
}

export interface DMAutomationCreatePayload {
  name: string;
  trigger: string;
  trigger_filter?: string | null;
  public_reply?: string | null;
  platforms: string[];
  sequences: DMAutomationMessageInput[];
  active?: boolean;
}

export interface DMAutomationMessageInput {
  position: number;
  type: string;
  content: string;
  delay_seconds?: number;
  message_type?: string;
  media_url?: string | null;
  is_followup?: boolean;
  followup_delay_hours?: number | null;
  use_ai_response?: boolean;
  buttons?: any[] | null;
}

export interface DMAutomationSequence {
  position: number;
  type?: string;
  content: string;
  delay_seconds?: number;
  message_type?: string;
  media_url?: string | null;
  is_followup?: boolean;
  followup_delay_hours?: number | null;
  use_ai_response?: boolean;
  buttons?: any[] | null;
}

export interface CreateDMAutomationPayload {
  name: string;
  trigger: string;
  trigger_filter?: string | null;
  public_reply?: string;
  platforms: string[];
  sequences: DMAutomationSequence[];
  active?: boolean;
}

export interface UpdateDMAutomationPayload {
  name?: string;
  trigger?: string;
  trigger_filter?: string | null;
  public_reply?: string;
  platforms?: string[];
  active?: boolean;
}

export interface SocialPostPayload {
  format: string;
  platforms: string[];
  caption?: string;
  description?: string;
  main_media_url?: string;
  cover_image_url?: string;
  scheduled_at?: string | null;
  connected_account_id: string;
}

export interface SocialPost {
  id: string;
  format: string;
  platforms: string[];
  caption?: string | null;
  description?: string | null;
  status: string;
  scheduled_at?: string | null;
  created_at: string;
  connected_account_id?: string | null;
}

const DEFAULT_CACHE_TTLS = {
  messages: 10_000,
  pendingComments: 30_000,
  commentStats: 120_000,
  connectedAccounts: 300_000,
  automations: 60_000,
  automationMessages: 60_000,
  scheduledPosts: 60_000,
} as const;

async function withUserScopedCache<T>(
  suffix: string,
  ttlMs: number | undefined,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!ttlMs || ttlMs <= 0) {
    return fetcher();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fetcher();
  }

  const cacheKey = `api:${user.id}:${suffix}`;
  const cached = getCache<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await fetcher();
  setCache(cacheKey, result, ttlMs);
  return result;
}

/**
 * Lista todas as automações DM do usuário
 */
export const getDMAutomations = async (): Promise<DMAutomation[]> => {
  const response = await authorizedFetch(`${BASE}/api/dm-automations`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Cria uma nova automação DM
 */
export const createDMAutomation = async (
  payload: CreateDMAutomationPayload
): Promise<DMAutomation> => {
  const response = await authorizedFetch(`${BASE}/api/dm-automations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Atualiza uma automação DM existente
 */
export const updateDMAutomation = async (
  automationId: number,
  payload: UpdateDMAutomationPayload
): Promise<any> => {
  const response = await authorizedFetch(`/api/dm-automations/${automationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Deleta uma automação DM
 */
export const deleteDMAutomation = async (automationId: number): Promise<void> => {
  const response = await authorizedFetch(`/api/dm-automations/${automationId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
};

/**
 * Lista mensagens de uma automação
 */
export const getDMAutomationMessages = async (automationId: number): Promise<DMAutomationMessage[]> => {
  const response = await authorizedFetch(
    `${BASE}/api/dm-automations/${automationId}/messages`,
    {
      method: 'GET',
    }
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Adiciona uma mensagem a uma automação
 */
export const addDMAutomationMessage = async (
  automationId: number,
  payload: DMAutomationMessageInput
): Promise<DMAutomationMessage> => {
  const response = await authorizedFetch(
    `${BASE}/api/dm-automations/${automationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};


/**
 * Deleta uma mensagem de uma automação
 */
export const deleteDMAutomationMessage = async (
  automationId: number,
  messageId: number
): Promise<void> => {
  const response = await authorizedFetch(
    `/api/dm-automations/${automationId}/messages/${messageId}`,
    {
      method: 'DELETE',
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
};

// Crie uma nova função no api.ts para teste
export const createDMAutomationSimple = async (
  payload: any
): Promise<any> => {
  console.log("🔍 Enviando payload para createDMAutomationSimple:", payload);
  
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  if (session?.user?.id) {
    headers['x-user-id'] = session.user.id;
  }

  const response = await fetch(`${API_BASE}/api/dm-automations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erro na resposta:", errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }
  
  return response.json();
};

// Exemplo de uso com cache (opcional)
export const getDMAutomationsWithCache = async () => {
  return withUserScopedCache(
    'dm-automations',
    getDMAutomations,
    5 * 60 * 1000 // 5 minutos
  );
};

const api = {
  async getMessages(opts: GetMessagesOpts = {}) {
    const limit = opts.limit ?? 200;
    const cacheTtl = opts.cacheTtlMs ?? DEFAULT_CACHE_TTLS.messages;
    const fetcher = async () => {
      const url = `${BASE.replace(/\/$/, "")}/api/messages/?limit=${encodeURIComponent(limit)}`;
      const res = await authorizedFetch(url, {
        method: "GET",
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Backend messages fetch failed: ${res.status} ${body}`);
      }
      const data = await res.json();
      return (data || []).map((item: any) => ({
        id: item.id,
        conversation_id: item.conversation_id,
        contact_id: item.contact_id,
        platform: item.platform,
        sender_name: item.sender_name || item.contact?.name,
        sender_type: item.sender_type,
        message: item.message || item.content || item.message_content,
        message_type: item.message_type,
        created_at: item.created_at,
        status: item.status,
        metadata: item.metadata || {},
      }));
    };

    return withUserScopedCache(`messages:${limit}`, cacheTtl, fetcher);
  },

  // sendMessage still falls back to calling backend if available, otherwise throws
  async sendMessage(payload: {
    platform: string;
    recipient_id: string;
    message: string;
    connected_account_id?: string;
  }) {
    const url = `${BASE.replace(/\/$/, "")}/api/messages/`;
    try {
      const res = await authorizedFetch(url, {
        method: "POST",
        body: JSON.stringify({
          platform: payload.platform,
          recipient_id: payload.recipient_id,
          message: payload.message,
          connected_account_id: payload.connected_account_id,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Backend sendMessage failed: ${res.status} ${body}`);
      }
      return await res.json();
    } catch (err) {
      throw err;
    }
  },

  async getComments() {
    // Not used for omnichannel — implement if needed
    return [];
  },

  async replyToComment() {
    throw new Error("replyToComment not implemented on backend client");
  },

  async getPendingComments(limit = 100) {
    const fetcher = async () => {
      const url = `${BASE.replace(/\/$/, "")}/api/comments/pending?limit=${encodeURIComponent(limit)}`;
      const res = await authorizedFetch(url, {
        method: "GET",
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Backend comments fetch failed: ${res.status} ${body}`);
      }
      return await res.json();
    };

    return withUserScopedCache(`pending-comments:${limit}`, DEFAULT_CACHE_TTLS.pendingComments, fetcher);
  },

  async getCommentStats(days = 7) {
    const fetcher = async () => {
      const url = `${BASE.replace(/\/$/, "")}/api/comments/stats?days=${encodeURIComponent(days)}`;
      const res = await authorizedFetch(url, {
        method: "GET",
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Backend comment stats failed: ${res.status} ${body}`);
      }
      return await res.json();
    };

    return withUserScopedCache(`comment-stats:${days}`, DEFAULT_CACHE_TTLS.commentStats, fetcher);
  },

  async generateCommentResponses() {
    const url = `${BASE.replace(/\/$/, "")}/api/comments/generate-ai-responses`;
    const res = await authorizedFetch(url, {
      method: "POST",
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend generate comment responses failed: ${res.status} ${body}`);
    }
    return await res.json();
  },

  async approveComment(commentId: string, responseText?: string) {
    const url = `${BASE.replace(/\/$/, "")}/api/comments/${encodeURIComponent(commentId)}/approve`;
    const res = await authorizedFetch(url, {
      method: "POST",
      body: JSON.stringify({
        response_text: responseText ?? null,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend approve comment failed: ${res.status} ${body}`);
    }
    return await res.json();
  },

  async ignoreComment(commentId: string) {
    const url = `${BASE.replace(/\/$/, "")}/api/comments/${encodeURIComponent(commentId)}/ignore`;
    const res = await authorizedFetch(url, {
      method: "POST",
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend ignore comment failed: ${res.status} ${body}`);
    }
    return await res.json();
  },

  async getConnectedAccounts(): Promise<ConnectedAccount[]> {
    try {
      const fetcher = async () => {
        const response = await simpleFetch(`${API_BASE}/oauth/accounts`);
        return await response.json();
      };
      
      return withUserScopedCache("connected-accounts", DEFAULT_CACHE_TTLS.connectedAccounts, fetcher);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      return [];
    }
  },

  async disconnectConnectedAccount(accountId: string) {
    const url = `${BASE.replace(/\/$/, "")}/oauth/accounts/${accountId}`;
    const res = await authorizedFetch(url, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend disconnect account failed: ${res.status} ${body}`);
    }
    return await res.json();
  },

  async getDMAutomations(): Promise<DMAutomation[]> {
    const fetcher = async () => {
      const url = `${BASE.replace(/\/$/, "")}/api/dm-automations`;
      const res = await authorizedFetch(url, { method: "GET" });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Backend automations fetch failed: ${res.status} ${body}`);
      }
      return (await res.json()) || [];
    };

    return withUserScopedCache("dm-automations", DEFAULT_CACHE_TTLS.automations, fetcher);
  },

  async getDMAutomationMessages(automationId: number): Promise<DMAutomationMessage[]> {
    const fetcher = async () => {
      const url = `${BASE.replace(/\/$/, "")}/api/dm-automations/${automationId}/messages`;
      const res = await authorizedFetch(url, { method: "GET" });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Backend automation messages fetch failed: ${res.status} ${body}`);
      }
      return (await res.json()) || [];
    };

    return withUserScopedCache(`dm-automation-messages:${automationId}`, DEFAULT_CACHE_TTLS.automationMessages, fetcher);
  },

  async createDMAutomation(payload: DMAutomationCreatePayload): Promise<DMAutomation> {
    const url = `${BASE.replace(/\/$/, "")}/api/dm-automations`;
    const res = await authorizedFetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend create automation failed: ${res.status} ${body}`);
    }
    return await res.json();
  },

  async addDMAutomationMessage(
    automationId: number,
    payload: DMAutomationMessageInput,
  ): Promise<DMAutomationMessage> {
    const url = `${BASE.replace(/\/$/, "")}/api/dm-automations/${automationId}/messages`;
    const res = await authorizedFetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend add automation message failed: ${res.status} ${body}`);
    }
    return await res.json();
  },

  async updateDMAutomation(
    automationId: number,
    payload: Partial<DMAutomationCreatePayload>,
  ): Promise<DMAutomation> {
    const url = `${BASE.replace(/\/$/, "")}/admin/automations/${automationId}`;
    const res = await authorizedFetch(url, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend update automation failed: ${res.status} ${body}`);
    }
    return await res.json();
  },

  async deleteDMAutomation(automationId: number): Promise<void> {
    const url = `${BASE.replace(/\/$/, "")}/admin/automations/${automationId}`;
    const res = await authorizedFetch(url, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend delete automation failed: ${res.status} ${body}`);
    }
  },

  async deleteDMAutomationMessage(automationId: number, messageId: number): Promise<void> {
    const url = `${BASE.replace(/\/$/, "")}/api/dm-automations/${automationId}/messages/${messageId}`;
    const res = await authorizedFetch(url, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend delete automation message failed: ${res.status} ${body}`);
    }
  },

  async getScheduledPosts(): Promise<SocialPost[]> {
    const fetcher = async () => {
      const url = `${BASE.replace(/\/$/, "")}/api/posts/scheduled`;
      const res = await authorizedFetch(url, {
        method: "GET",
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Backend scheduled posts fetch failed: ${res.status} ${body}`);
      }
      const data = await res.json();
      return data || [];
    };

    return withUserScopedCache("scheduled-posts", DEFAULT_CACHE_TTLS.scheduledPosts, fetcher);
  },

  async createPost(payload: SocialPostPayload): Promise<SocialPost> {
    const url = `${BASE.replace(/\/$/, "")}/api/posts`;
    const res = await authorizedFetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Backend create post failed: ${res.status} ${body}`);
    }
    return await res.json();
  },
};

export default api;

// Função standalone exportada separadamente para uso direto
export const getConnectedAccounts = async (): Promise<ConnectedAccount[]> => {
  return api.getConnectedAccounts();
};