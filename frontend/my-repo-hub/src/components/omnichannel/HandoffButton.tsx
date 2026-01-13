/**
 * HandoffButton - Botão para assumir controle da conversa
 * Visual destacado para transição IA → Humano
 */

import { motion } from "framer-motion";
import { UserCheck, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HandoffButtonProps {
  onTakeover: () => void;
  aiStatus?: string;
  aiConfidence?: number;
  isLoading?: boolean;
  className?: string;
}

export function HandoffButton({ 
  onTakeover, 
  aiStatus, 
  aiConfidence,
  isLoading = false,
  className 
}: HandoffButtonProps) {
  
  // Só mostrar se IA estiver ativa ou aguardando revisão
  if (aiStatus !== 'responding' && aiStatus !== 'waiting_review') {
    return null;
  }

  const isLowConfidence = aiConfidence && aiConfidence < 0.7;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400 }}
      className={cn("w-full", className)}
    >
      <Button
        onClick={onTakeover}
        disabled={isLoading}
        className={cn(
          "w-full h-12 rounded-xl font-semibold text-sm relative overflow-hidden group",
          "transition-all duration-300",
          isLowConfidence 
            ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0" 
            : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0",
          "shadow-lg hover:shadow-xl",
          isLowConfidence && "animate-pulse-glow"
        )}
      >
        {/* Background animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        
        {/* Conteúdo */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {isLowConfidence ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>IA Precisa de Ajuda</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4" />
              <span>Assumir Conversa</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </div>

        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 blur-xl opacity-50 group-hover:opacity-70 transition-opacity",
          isLowConfidence 
            ? "bg-gradient-to-r from-yellow-500 to-orange-500" 
            : "bg-gradient-to-r from-primary to-accent"
        )} />
      </Button>

      {/* Explicação */}
      {isLowConfidence && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center text-muted-foreground mt-2"
        >
          Confiança baixa ({Math.round((aiConfidence || 0) * 100)}%) - Revisão recomendada
        </motion.p>
      )}
    </motion.div>
  );
}
