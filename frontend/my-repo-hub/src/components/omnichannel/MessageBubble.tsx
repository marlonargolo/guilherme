/**
 * MessageBubble - Componente de mensagem individual
 * Design moderno com glassmorphism e animações suaves
 */

import { motion } from "framer-motion";
import { Bot, User2, CheckCheck, Clock, AlertCircle, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Message, Contact } from "@/hooks/useOmnichannel";

interface MessageBubbleProps {
  message: Message;
  contact?: Contact;
  index: number;
}

export function MessageBubble({ message, contact, index }: MessageBubbleProps) {
  const isCustomer = message.sender_type === 'customer';
  const isAI = message.sender_type === 'ai';
  
  // Calcular tempo relativo
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "flex gap-2 mb-3",
        isCustomer ? "justify-start" : "justify-end"
      )}
    >
      {/* Avatar (só para cliente) */}
      {isCustomer && (
        <Avatar className="h-8 w-8 border-2 border-border/30 flex-shrink-0">
          <AvatarImage src={contact?.avatar_url} />
          <AvatarFallback className="text-xs bg-muted">
            {contact?.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Conteúdo da mensagem */}
      <div className={cn(
        "flex flex-col gap-1 max-w-[70%]",
        !isCustomer && "items-end"
      )}>
        {/* Bolha da mensagem */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={cn(
            "px-2.5 py-1.5 rounded-2xl relative overflow-hidden group break-words",
            "backdrop-blur-sm border shadow-sm",
            isCustomer 
              ? "bg-muted/50 border-border/30 rounded-tl-none" 
              : isAI
                ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 rounded-tr-none"
                : "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 rounded-tr-none"
          )}
        >
          {/* Glow effect sutil */}
          {!isCustomer && (
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-xl",
              isAI 
                ? "bg-gradient-to-br from-primary/20 to-accent/20"
                : "bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
            )} />
          )}

          {/* Texto da mensagem */}
          <p className={cn(
            "text-xs relative z-10 leading-snug whitespace-pre-wrap break-words",
            isCustomer ? "text-foreground" : "text-foreground font-medium"
          )}>
            {message.content}
          </p>

          {/* Badge de IA */}
          {isAI && message.ai_confidence && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30"
            >
              <Sparkles className="h-2.5 w-2.5 text-primary" />
              <span className="text-[10px] font-medium text-primary">
                IA {Math.round(message.ai_confidence * 100)}%
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Metadados (timestamp e status) */}
        <div className={cn(
          "flex items-center gap-1.5 px-2",
          isCustomer ? "justify-start" : "justify-end"
        )}>
          {/* Ícone do tipo de sender */}
          {isAI ? (
            <Bot className="h-3 w-3 text-primary" />
          ) : !isCustomer ? (
            <User2 className="h-3 w-3 text-blue-500" />
          ) : null}
          
          {/* Timestamp */}
          <span className="text-[10px] text-muted-foreground">
            {getTimeAgo(message.created_at)}
          </span>

          {/* Status da mensagem (só para mensagens enviadas) */}
          {!isCustomer && message.status && (
            <>
              {message.status === 'sent' && (
                <CheckCheck className="h-3 w-3 text-green-500" />
              )}
              {message.status === 'sending' && (
                <Clock className="h-3 w-3 text-muted-foreground animate-pulse" />
              )}
              {message.status === 'failed' && (
                <AlertCircle className="h-3 w-3 text-red-500" />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}