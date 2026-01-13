/**
 * AIStatusBadge - Badge visual do status da IA
 * Mostra status atual e nível de confiança com animações
 */

import { motion } from "framer-motion";
import { Bot, User2, AlertCircle, CheckCheck, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AIStatusBadgeProps {
  aiStatus?: string;
  aiConfidence?: number;
  conversationStatus?: string;
  className?: string;
}

export function AIStatusBadge({ 
  aiStatus, 
  aiConfidence, 
  conversationStatus,
  className 
}: AIStatusBadgeProps) {
  
  // Badge para conversa aguardando revisão humana
  if (aiStatus === 'waiting_review') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        <Badge className={cn(
          "bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1",
          "hover:bg-yellow-500/30 transition-all duration-200",
          className
        )}>
          <AlertCircle className="h-3 w-3 animate-pulse" />
          <span className="text-xs font-medium">Revisar</span>
          {aiConfidence && (
            <span className="text-[10px] opacity-70">
              {Math.round(aiConfidence * 100)}%
            </span>
          )}
        </Badge>
      </motion.div>
    );
  }

  // Badge para IA respondendo
  if (aiStatus === 'responding') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        <Badge className={cn(
          "bg-primary/20 text-primary border-primary/30 gap-1",
          "hover:bg-primary/30 transition-all duration-200",
          className
        )}>
          <Bot className="h-3 w-3 animate-pulse" />
          <span className="text-xs font-medium">IA Respondendo</span>
        </Badge>
      </motion.div>
    );
  }

  // Badge para IA com alta confiança
  if (aiConfidence && aiConfidence > 0.8) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        <Badge className={cn(
          "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 gap-1",
          "hover:from-primary/30 hover:to-accent/30 transition-all duration-200",
          className
        )}>
          <Sparkles className="h-3 w-3" />
          <span className="text-xs font-medium">IA</span>
          <span className="text-[10px] opacity-70">
            {Math.round(aiConfidence * 100)}%
          </span>
        </Badge>
      </motion.div>
    );
  }

  // Badge para conversa resolvida
  if (conversationStatus === 'resolved') {
    return (
      <Badge className={cn(
        "bg-green-500/20 text-green-500 border-green-500/30 gap-1",
        className
      )}>
        <CheckCheck className="h-3 w-3" />
        <span className="text-xs font-medium">Resolvido</span>
      </Badge>
    );
  }

  // Badge para conversa arquivada
  if (conversationStatus === 'archived') {
    return (
      <Badge className={cn(
        "bg-gray-500/20 text-gray-500 border-gray-500/30 gap-1",
        className
      )}>
        <Clock className="h-3 w-3" />
        <span className="text-xs font-medium">Arquivado</span>
      </Badge>
    );
  }

  // Badge para modo humano
  if (aiStatus === 'idle') {
    return (
      <Badge className={cn(
        "bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1",
        className
      )}>
        <User2 className="h-3 w-3" />
        <span className="text-xs font-medium">Humano</span>
      </Badge>
    );
  }

  return null;
}
