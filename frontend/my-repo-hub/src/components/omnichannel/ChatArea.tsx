/**
 * ChatArea - Área de chat do omnichannel
 * Exibe mensagens e input com design 2035
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Phone, Instagram, MessageSquare, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";
import { Conversation, Message, ConnectedAccount } from "@/hooks/useOmnichannel";
import { MessageBubble } from "./MessageBubble";
import { AIStatusBadge } from "./AIStatusBadge";

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isSending?: boolean;
  connectedAccounts?: ConnectedAccount[];
  selectedAccountId?: string;
  onAccountChange?: (accountId: string) => void;
}

export function ChatArea({
  conversation,
  messages,
  onSendMessage,
  isSending = false,
  connectedAccounts = [],
  selectedAccountId,
  onAccountChange,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const skipNextScrollRef = useRef(false);

  // Evitar auto-scroll ao trocar de conversa
  useEffect(() => {
    skipNextScrollRef.current = true;
  }, [conversation?.id]);

  // Auto scroll para última mensagem (somente quando novas mensagens chegam)
  useEffect(() => {
    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Enviar mensagem
  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    
    const message = inputValue;
    setInputValue("");
    await onSendMessage(message);
  };

  // Ícone da plataforma
  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "whatsapp": return <Phone className="h-4 w-4" />;
      case "instagram": return <Instagram className="h-4 w-4" />;
      case "telegram": return <MessageSquare className="h-4 w-4" />;
      case "facebook":
      case "tiktok": return <Hash className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Cor da plataforma
  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "whatsapp": return "text-green-500";
      case "instagram": return "text-pink-500";
      case "telegram": return "text-blue-500";
      case "facebook": return "text-blue-600";
      default: return "text-primary";
    }
  };

  const availableAccounts = useMemo(() => {
    if (!conversation) return [];
    const normalized = conversation.platform?.toLowerCase();
    const map: Record<string, string> = {
      facebook: "meta",
      facebook_page: "meta",
      instagram: "instagram",
      whatsapp: "whatsapp",
      meta: "meta",
    };
    const normalizedPlatform = map[normalized] || normalized;
    return connectedAccounts.filter(
      (acc) => (map[acc.platform?.toLowerCase()] || acc.platform?.toLowerCase()) === normalizedPlatform
    );
  }, [conversation, connectedAccounts]);

  const effectiveAccountId = useMemo(() => {
    if (selectedAccountId && availableAccounts.some((acc) => acc.id === selectedAccountId)) {
      return selectedAccountId;
    }
    return availableAccounts[0]?.id;
  }, [selectedAccountId, availableAccounts]);

  if (!conversation) {
    return (
      <Card className="flex-1 glass-card flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl rounded-full" />
            <MessageSquare className="h-16 w-16 mx-auto text-primary/50 relative z-10" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Selecione uma conversa
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Escolha uma conversa da lista para começar a responder
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card flex flex-col h-full max-h-full relative overflow-hidden border-0 bg-gradient-to-b from-background/95 to-background/80">
      {/* Background ultramoderno com gradiente sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-accent/5 opacity-30" />
      
      {/* Header do chat - ultramoderno e compacto */}
      <div className="relative z-10 px-6 py-3 border-b border-white/5 backdrop-blur-xl bg-gradient-to-r from-primary/5 to-accent/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Avatar com glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-md" />
            <Avatar className="h-10 w-10 border border-white/10 relative z-10 ring-1 ring-primary/20">
              <AvatarImage src={conversation.contact.avatar_url} />
              <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/30 to-accent/30 text-foreground">
                {conversation.contact.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info - mais compacta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-foreground/95 truncate">
                {conversation.contact.name}
              </h3>
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center justify-center p-1 rounded-full bg-background/50 backdrop-blur-sm border border-white/5",
                  getPlatformColor(conversation.platform)
                )}
              >
                {getPlatformIcon(conversation.platform)}
              </motion.div>
            </div>
            
            <div className="flex items-center gap-2">
              {conversation.contact.username && (
                <p className="text-[10px] text-muted-foreground/70">
                  @{conversation.contact.username}
                </p>
              )}
              
              {/* AI Status - inline e minimalista */}
              <AIStatusBadge 
                aiStatus={conversation.ai_status}
                aiConfidence={conversation.ai_confidence}
                conversationStatus={conversation.status}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens - área scrollável ultramoderna */}
      <div className="flex-1 relative z-10 overflow-hidden min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full min-h-[400px]"
                >
                  <div className="text-center space-y-2">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-xl rounded-full" />
                      <MessageSquare className="h-12 w-12 mx-auto text-primary/50 relative z-10" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma mensagem ainda
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      contact={conversation.contact}
                      index={index}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Input de mensagem - ultramoderno e futurista */}
      <div className="relative z-10 px-6 py-4 border-t border-white/5 backdrop-blur-2xl bg-gradient-to-r from-background/90 via-background/95 to-background/90 flex-shrink-0">
        {availableAccounts.length === 0 ? (
          <div className="mb-3 text-xs text-yellow-500">
            Conecte uma conta compatível com {conversation.platform} para responder mensagens.
          </div>
        ) : (
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground">Conta conectada</Label>
            <Select
              value={effectiveAccountId || undefined}
              onValueChange={(value) => onAccountChange?.(value)}
            >
              <SelectTrigger className="mt-1 h-9 bg-background/60 border-white/10 text-xs">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.display_name || account.external_id || account.platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            {/* Glow effect no input */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-30" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua mensagem..."
              disabled={isSending}
              className="relative h-11 bg-background/60 border-white/10 rounded-2xl hover:border-primary/30 focus:border-primary/50 focus:bg-background/80 transition-all placeholder:text-muted-foreground text-muted-foreground text-sm px-5"
            />
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={!inputValue.trim() || isSending || availableAccounts.length === 0}
              className={cn(
                "h-11 w-11 p-0 rounded-2xl transition-all duration-300",
                "bg-gradient-to-br from-primary via-primary to-accent hover:from-primary/90 hover:via-primary/95 hover:to-accent/90",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
                "relative overflow-hidden group border border-white/10"
              )}
            >
              {/* Glow effect ultramoderno */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
              
              {/* Ícone */}
              <div className="relative z-10 flex items-center justify-center">
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </div>
            </Button>
          </motion.div>
        </form>
      </div>
    </Card>
  );
}
