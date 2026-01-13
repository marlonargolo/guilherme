/**
 * Inbox - Página principal do Omnichannel (UI do front antigo portado)
 * Mantém integração com `useOmnichannel` do `chatter-sphere-pro-main` (dados reais)
 */

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useOmnichannel, Conversation } from "@/hooks/useOmnichannel";
import { ConversationList } from "@/components/omnichannel/ConversationList";
import { ChatArea } from "@/components/omnichannel/ChatArea";
import { TokenGuard } from "@/components/omnichannel/TokenGuard";
import { HandoffButton } from "@/components/omnichannel/HandoffButton";
import { IntelligentCRM } from "@/components/omnichannel/IntelligentCRM";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wifi, WifiOff, MessageSquare } from "lucide-react";

export default function Inbox() {
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    isLoading,
    isOffline,
    sendMessage,
    takeoverConversation,
    tokensUsed,
    tokensLimit,
    tokenPercentage,
    connectedAccounts,
    selectedConversationAccountId,
    setConversationAccount,
  } = useOmnichannel();

  const [isSending, setIsSending] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Handler para enviar mensagem
  const handleSendMessage = async (content: string) => {
    setIsSending(true);
    try {
      await sendMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  // Handler para assumir conversa
  const handleTakeover = async () => {
    setIsTakingOver(true);
    try {
      await takeoverConversation();
    } finally {
      setIsTakingOver(false);
    }
  };

  // Handler para selecionar conversa sem scroll
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header principal */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/30"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Omnichannel Inbox
              </h1>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              {isOffline ? (
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1.5">
                  <WifiOff className="h-3 w-3" />
                  <span className="text-xs">Modo Demo</span>
                </Badge>
              ) : (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1.5">
                  <Wifi className="h-3 w-3" />
                  <span className="text-xs">Online</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Layout principal - altura fixa sem scroll */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-[calc(100vh-140px)]">
          
          {/* Coluna 1: Lista de conversas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              isLoading={isLoading}
              filterPlatform={filterPlatform}
              onFilterChange={setFilterPlatform}
            />
          </motion.div>

          {/* Coluna 2: Área de chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-full"
          >
            <ChatArea
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              connectedAccounts={connectedAccounts}
              selectedAccountId={selectedConversationAccountId}
              onAccountChange={(accountId) => {
                if (selectedConversation && accountId) {
                  setConversationAccount(selectedConversation.id, accountId);
                }
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Rodapé informativo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="fixed bottom-4 right-4 glass-card px-4 py-2 rounded-full border border-border/30 shadow-lg"
      >
        <p className="text-xs text-muted-foreground">
          ⚡ Economizando <span className="font-semibold text-primary">{(100 - tokenPercentage).toFixed(0)}%</span> em custos com IA
        </p>
      </motion.div>
    </div>
  );
}
