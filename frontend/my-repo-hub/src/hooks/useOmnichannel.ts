/**
 * Hook customizado para gerenciar o Omnichannel usando o backend FastAPI
 * - Conversas e mensagens em tempo real
 * - Conversões para o design avançado (ConversationList / ChatArea)
 * - Controle básico de IA Points (estimativa)
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { fastApi, ConnectedAccount as FastAPIConnectedAccount } from "@/lib/fastapi";

// Re-export para compatibilidade
export type ConnectedAccount = FastAPIConnectedAccount;

// Tipos de dados consumidos pelos componentes de UI
export interface Contact {
  id: string;
  name: string;
  username?: string;
  avatar_url?: string;
  platform_user_id?: string;
  phone_number?: string;
}

export interface Conversation {
  id: string;
  platform: string;
  status: string;
  ai_status?: string;
  ai_confidence?: number;
  last_message_preview?: string;
  last_message_at: string;
  unread_count: number;
  contact: Contact;
  recipient_id?: string;
  connected_account_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "customer" | "ai" | "human";
  message_type: string;
  content: string;
  media_url?: string;
  status?: string;
  ai_generated?: boolean;
  ai_confidence?: number;
  created_at: string;
}

const estimateTokens = (text: string) => Math.max(20, Math.round(text.length * 0.6));

const normalizePlatform = (platform?: string) => {
  if (!platform) return undefined;
  const map: Record<string, string> = {
    facebook: "meta",
    facebook_page: "meta",
    messenger: "meta",
    instagram: "instagram",
    whatsapp: "whatsapp",
    wa: "whatsapp",
    meta: "meta",
    telegram: "telegram",
    tiktok: "tiktok",
  };
  return map[platform.toLowerCase()] || platform.toLowerCase();
};

const normalizeSenderType = (sender: string): Message["sender_type"] => {
  if (sender === "customer" || sender === "user") return "customer";
  if (sender === "agent" || sender === "human" || sender === "assistant") return "human";
  return "ai";
};

export function useOmnichannel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokensLimit] = useState(10000);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [accountOverrides, setAccountOverrides] = useState<Record<string, string | undefined>>({});

  // Função para converter mensagens do FastAPI para o formato do frontend
  const buildStateFromApi = useCallback((payload: any[]) => {
    const conversationMap = new Map<string, Conversation>();
    const messageMap: Record<string, Message[]> = {};
    let computedTokens = 0;

    payload.forEach((item) => {
      // Adapatação para o formato do FastAPI
      const metadata = item.metadata || {};
      const conversationMeta = metadata.conversation || {};
      
      // Identificar o tipo de remetente baseado no conteúdo da mensagem
      let senderType = "customer";
      if (item.sender_type) {
        senderType = normalizeSenderType(item.sender_type);
      } else if (item.user_id) {
        // Se tem user_id, provavelmente é mensagem enviada por nós
        senderType = "human";
      }

      const normalizedMessage: Message = {
        id: item.id || `msg_${Date.now()}_${Math.random()}`,
        conversation_id: item.conversation_id || `conv_${item.channel}_${item.to}`,
        sender_type: senderType,
        message_type: item.message_type || "text",
        content: item.message || item.content || "",
        media_url: metadata.media_url || item.media_url,
        status: item.status || "sent",
        created_at: item.created_at || new Date().toISOString(),
      };

      const conversationId = normalizedMessage.conversation_id;
      
      if (!messageMap[conversationId]) {
        messageMap[conversationId] = [];
      }
      messageMap[conversationId].push(normalizedMessage);

      // Criar ou atualizar a conversa
      const contact: Contact = {
        id: item.contact_id || item.to || `contact_${conversationId}`,
        name: conversationMeta.contact_name || 
              item.sender_name || 
              metadata.contact_name || 
              "Contato",
        username: metadata.contact_username || conversationMeta.contact_username,
        avatar_url: conversationMeta.contact_avatar_url || metadata.avatar_url,
        phone_number: conversationMeta.contact_phone || 
                     metadata.phone_number || 
                     (item.channel === "whatsapp" ? item.to : undefined),
        platform_user_id: conversationMeta.contact_platform_user_id ||
                         metadata.platform_user_id ||
                         item.to,
      };

      const existingConversation = conversationMap.get(conversationId);
      const connectedAccountId = conversationMeta.connected_account_id ||
                                metadata.connected_account_id;

      const shouldUpdate = !existingConversation ||
                          new Date(normalizedMessage.created_at).getTime() >
                          new Date(existingConversation.last_message_at).getTime();

      if (shouldUpdate) {
        conversationMap.set(conversationId, {
          id: conversationId,
          platform: item.channel || item.platform || "unknown",
          status: conversationMeta.status || normalizedMessage.status || "active",
          ai_status: conversationMeta.ai_status || "idle",
          ai_confidence: conversationMeta.ai_confidence || 0,
          last_message_preview: normalizedMessage.content.substring(0, 50) + 
                               (normalizedMessage.content.length > 50 ? "..." : ""),
          last_message_at: normalizedMessage.created_at,
          unread_count: conversationMeta.unread_count || 0,
          contact,
          recipient_id: contact.platform_user_id || item.to,
          connected_account_id: connectedAccountId,
        });
      }

      if (normalizedMessage.sender_type !== "customer") {
        computedTokens += estimateTokens(normalizedMessage.content);
      }
    });

    // Ordenar conversas por última mensagem
    const orderedConversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    // Ordenar mensagens por data crescente para cada conversa
    Object.keys(messageMap).forEach((key) => {
      messageMap[key].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return {
      orderedConversations,
      messageMap,
      computedTokens,
    };
  }, []);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Usar o FastAPI para buscar mensagens
      const data = await fastApi.getMessages({ limit: 200 });
      const { orderedConversations, messageMap, computedTokens } = buildStateFromApi(data);
      
      setConversations(orderedConversations);
      setMessagesByConversation(messageMap);
      setTokensUsed(Math.min(computedTokens, tokensLimit));

      // Manter a conversa selecionada ou selecionar a primeira
      if (orderedConversations.length > 0) {
        setSelectedConversation((current) => {
          if (current) {
            const stillExists = orderedConversations.find((conv) => conv.id === current.id);
            return stillExists || orderedConversations[0];
          }
          return orderedConversations[0];
        });
      } else {
        setSelectedConversation(null);
      }

      setIsOffline(false);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      setIsOffline(true);
      setConversations([]);
      setSelectedConversation(null);
      toast.error(error?.message || "Não foi possível carregar as conversas.");
    } finally {
      setIsLoading(false);
    }
  }, [buildStateFromApi, tokensLimit]);

  const loadConnectedAccounts = useCallback(async () => {
    try {
      // Usar o FastAPI para buscar contas conectadas
      const accounts = await fastApi.getConnectedAccounts();
      
      // Formatar as contas para o formato esperado pelo frontend
      const formattedAccounts: ConnectedAccount[] = accounts.map(account => ({
        ...account,
        external_id: account.account_id,
        display_name: account.account_name,
      }));
      
      setConnectedAccounts(formattedAccounts);
    } catch (error) {
      console.error("Error loading connected accounts", error);
      // Tentar buscar do Supabase como fallback
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("integrations")
          .select("*")
          .eq("status", "connected");
        
        if (data) {
          const formattedAccounts: ConnectedAccount[] = data.map((integration: any) => ({
            id: integration.id,
            platform: integration.channel,
            account_id: integration.credentials?.username || integration.credentials?.phone || integration.id,
            account_name: integration.credentials?.username || integration.channel,
            status: integration.status,
            connected_at: integration.last_sync,
            external_id: integration.credentials?.username || integration.credentials?.phone,
            display_name: integration.credentials?.username || integration.channel,
          }));
          setConnectedAccounts(formattedAccounts);
        }
      } catch (supabaseError) {
        console.error("Error loading from Supabase:", supabaseError);
      }
    }
  }, []);

  const resolveConversationAccount = useCallback(
    (conversation?: Conversation | null): string | undefined => {
      if (!conversation) return undefined;
      
      const override = accountOverrides[conversation.id];
      const normalized = normalizePlatform(conversation.platform);
      
      // Verificar se a conta sobreposta existe
      if (override && connectedAccounts.some((acc) => acc.id === override)) {
        return override;
      }

      // Verificar se a conta vinculada à conversa existe
      if (conversation.connected_account_id && 
          connectedAccounts.some((acc) => acc.id === conversation.connected_account_id)) {
        return conversation.connected_account_id;
      }

      // Tentar encontrar conta pela plataforma
      const providerMatch = connectedAccounts.find(
        (acc) => normalizePlatform(acc.platform) === normalized
      );
      if (providerMatch) return providerMatch.id;

      // Fallback para WhatsApp se tiver número de telefone
      if (conversation.contact.phone_number) {
        const whatsappAccount = connectedAccounts.find(
          (acc) => normalizePlatform(acc.platform) === "whatsapp"
        );
        if (whatsappAccount) return whatsappAccount.id;
      }

      // Retornar a primeira conta disponível
      return connectedAccounts[0]?.id;
    },
    [accountOverrides, connectedAccounts]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversation) {
        toast.error("Selecione uma conversa primeiro");
        return;
      }
      
      const trimmed = content.trim();
      if (!trimmed) {
        toast.error("Digite uma mensagem");
        return;
      }

      try {
        // Encontrar a conta conectada apropriada
        const connectedAccountId = resolveConversationAccount(selectedConversation);
        
        if (!connectedAccountId) {
          toast.error("Nenhuma conta conectada disponível para enviar mensagens");
          return;
        }

        // Preparar payload para o FastAPI
        const payload = {
          platform: selectedConversation.platform,
          recipient_id: selectedConversation.recipient_id || selectedConversation.contact.platform_user_id,
          message: trimmed,
          connected_account_id: connectedAccountId,
        };

        await fastApi.sendMessage(payload);
        
        // Adicionar a mensagem localmente para feedback imediato
        const tempMessage: Message = {
          id: `temp_${Date.now()}`,
          conversation_id: selectedConversation.id,
          sender_type: "human",
          message_type: "text",
          content: trimmed,
          status: "sending",
          created_at: new Date().toISOString(),
        };

        setMessagesByConversation(prev => ({
          ...prev,
          [selectedConversation.id]: [...(prev[selectedConversation.id] || []), tempMessage]
        }));

        setMessages(prev => [...prev, tempMessage]);

        // Atualizar preview da conversa
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id ? {
            ...conv,
            last_message_preview: trimmed.substring(0, 50) + (trimmed.length > 50 ? "..." : ""),
            last_message_at: new Date().toISOString(),
          } : conv
        ));

        toast.success("Mensagem enviada");
        
        // Recarregar conversas para obter a mensagem real do servidor
        setTimeout(() => {
          loadConversations();
        }, 1000);

      } catch (error: any) {
        console.error("Error sending message:", error);
        toast.error(error?.message || "Erro ao enviar mensagem");
      }
    },
    [selectedConversation, resolveConversationAccount, loadConversations]
  );

  const takeoverConversation = useCallback(() => {
    if (!selectedConversation) return;
    
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedConversation.id
          ? { ...conversation, ai_status: "idle", ai_confidence: 0 }
          : conversation
      )
    );
    
    toast.success("Você assumiu o controle desta conversa");
  }, [selectedConversation]);

  // Carregar dados iniciais
  useEffect(() => {
    loadConversations();
    loadConnectedAccounts();
  }, [loadConversations, loadConnectedAccounts]);

  // Atualizar mensagens quando a conversa selecionada mudar
  useEffect(() => {
    if (selectedConversation) {
      setMessages(messagesByConversation[selectedConversation.id] || []);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, messagesByConversation]);

  const setConversationAccount = useCallback((conversationId: string, accountId?: string) => {
    setAccountOverrides((prev) => ({ ...prev, [conversationId]: accountId }));
  }, []);

  // Polling para novas mensagens
  useEffect(() => {
    const POLLING_INTERVAL_MS = 30000; // 30 segundos
    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      if (document.visibilityState !== "visible") return;
      
      loadConversations();
      intervalId = setInterval(() => {
        loadConversations();
      }, POLLING_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadConversations]);

  return {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    isLoading,
    isOffline,
    sendMessage,
    takeoverConversation,
    loadConversations,
    tokensUsed,
    tokensLimit,
    tokenPercentage: tokensLimit ? (tokensUsed / tokensLimit) * 100 : 0,
    connectedAccounts,
    selectedConversationAccountId: resolveConversationAccount(selectedConversation),
    setConversationAccount,
  };
}