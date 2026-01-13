/**
 * TokenGuard - Painel de controle de custos de IA
 * Mostra uso de tokens em tempo real com visual futurista
 * - Barra de progresso com gradiente
 * - Alertas de limite
 * - Estimativa de custo
 */

import { motion } from "framer-motion";
import { Zap, AlertTriangle, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TokenGuardProps {
  tokensUsed: number;
  tokensLimit: number;
  className?: string;
}

export function TokenGuard({ tokensUsed, tokensLimit, className }: TokenGuardProps) {
  const percentage = (tokensUsed / tokensLimit) * 100;
  const remaining = tokensLimit - tokensUsed;
  const estimatedCost = (tokensUsed / 1000) * 0.002;
  const needsRecharge = percentage >= 90;

  // Determinar cor baseado no uso
  const getStatusColor = () => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusGradient = () => {
    if (percentage >= 90) return "from-red-500/20 to-red-600/10";
    if (percentage >= 70) return "from-yellow-500/20 to-yellow-600/10";
    return "from-green-500/20 to-green-600/10";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", className)}
    >
      <Card className={cn(
        "glass-card p-4 border-border/30 relative overflow-hidden group backdrop-blur-xl bg-background/70",
        "hover:border-cyan-500/50 transition-all duration-300"
      )}>
        {/* Background gradient animado */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          getStatusGradient()
        )} />

        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Zap className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  IA Points
                </h3>
                <p className="text-xs text-muted-foreground">Controle de Uso</p>
              </div>
            </div>
            
            {/* Status badge */}
            {needsRecharge && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30"
              >
                <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-500">Recarregar</span>
              </motion.div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {tokensUsed.toLocaleString()} / {tokensLimit.toLocaleString()} tokens
              </span>
              <span className={cn("font-semibold", getStatusColor())}>
                {percentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="relative w-full h-2 rounded-full bg-muted/20 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  percentage >= 90 ? "bg-gradient-to-r from-red-500 to-red-600" :
                  percentage >= 70 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" :
                  "bg-gradient-to-r from-green-500 to-green-600"
                )}
                style={{ width: `${percentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/20">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                IA Points Restantes
              </p>
              <p className="text-sm font-semibold text-foreground">
                {remaining.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Valor Economizado</p>
              <p className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                R$ {estimatedCost.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Botão de recarga */}
          {needsRecharge && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <button className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-white text-sm font-semibold">
                🔋 Recarregar Tokens
              </button>
            </motion.div>
          )}
          
          {/* Alerta de otimização */}
          {percentage >= 70 && percentage < 90 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
            >
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                💡 <span className="font-medium">Dica:</span> Configure recarga automática ao atingir 10% dos créditos
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
