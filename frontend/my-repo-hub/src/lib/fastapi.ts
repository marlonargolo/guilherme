// src/lib/fastapi.ts - Configuração para seu backend FastAPI

const FASTAPI_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

export interface ConnectedAccount {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  status: string;
  connected_at: string;
  external_id?: string;
  display_name?: string;
  metadata?: Record<string, any>;
}

export interface MessagePayload {
  id: string;
  conversation_id: string;
  contact_id: string;
  platform: string;
  sender_name: string;
  sender_type: string;
  message: string;
  message_type: string;
  created_at: string;
  status?: string;
  metadata?: {
    contact_username?: string;
    raw?: Record<string, any>;
    conversation?: Record<string, any>;
  };
}

class FastAPI {
  private baseUrl: string;

  constructor(baseUrl: string = FASTAPI_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getMessages(params?: { limit?: number }): Promise<MessagePayload[]> {
    try {
      const url = new URL(`${this.baseUrl}/api/messages/`);
      if (params?.limit) {
        url.searchParams.append('limit', params.limit.toString());
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getConnectedAccounts(): Promise<ConnectedAccount[]> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      return [];
    }
  }

  async sendMessage(data: {
    platform: string;
    recipient_id: string;
    message: string;
    connected_account_id?: string;
  }): Promise<any> {
    try {
      // Primeiro, obter o usuário atual para o user_id
      const { data: { user } } = await import('@/integrations/supabase/client').then(
        ({ supabase }) => supabase.auth.getUser()
      );

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const payload = {
        channel: data.platform,
        to: data.recipient_id,
        message: data.message,
        user_id: user.id,
        meta: {
          connected_account_id: data.connected_account_id,
          platform: data.platform,
        },
      };

      const response = await fetch(`${this.baseUrl}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getConversationMessages(conversationId: string): Promise<MessagePayload[]> {
    try {
      // Como seu backend não tem um endpoint específico por conversação,
      // vamos filtrar as mensagens localmente após buscar todas
      const allMessages = await this.getMessages({ limit: 200 });
      
      return allMessages.filter(
        (message) => message.conversation_id === conversationId
      );
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to mark message as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  async getHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Error checking backend health:', error);
      throw error;
    }
  }
}

export const fastApi = new FastAPI();
export default fastApi;