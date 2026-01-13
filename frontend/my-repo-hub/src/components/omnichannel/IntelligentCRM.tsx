/**
 * IntelligentCRM - CRM Inteligente e Futurista para Omnichannel
 * Design compacto com insights poderosos em tempo real
 */

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Conversation } from "@/hooks/useOmnichannel";

interface IntelligentCRMProps {
  selectedConversation: Conversation | null;
  conversations: Conversation[];
}

export function IntelligentCRM({ selectedConversation, conversations }: IntelligentCRMProps) {
  // Calcular insights inteligentes
  const totalConversations = conversations.length;
  const aiHandledCount = conversations.filter(c => c.ai_status === 'active').length;
  const needsAttentionCount = conversations.filter(c => 
    c.ai_status === 'waiting_review' || c.ai_confidence < 0.6
  ).length;
  
  const avgConfidence = conversations.length > 0
    ? Math.round((conversations.reduce((sum, c) => sum + (c.ai_confidence || 0), 0) / conversations.length) * 100)
    : 0;

  const automationRate = totalConversations > 0 
    ? Math.round((aiHandledCount / totalConversations) * 100) 
    : 0;

  // Insights do contato selecionado
  const getContactInsight = () => {
    if (!selectedConversation) return null;
    
    const confidence = selectedConversation.ai_confidence || 0;
    const isHighValue = confidence > 0.8;
    const needsAttention = confidence < 0.6;
    
    return {
      confidence: Math.round(confidence * 100),
      isHighValue,
      needsAttention,
      sentiment: confidence > 0.7 ? 'positivo' : confidence > 0.4 ? 'neutro' : 'negativo',
      urgency: needsAttention ? 'alta' : isHighValue ? 'baixa' : 'média'
    };
  };

  const contactInsight = getContactInsight();

  return (
    <Card className="glass-card border border-border/30 overflow-hidden relative group">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative z-10 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 border-b border-border/20">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
          >
            <Brain className="h-4 w-4 text-primary" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CRM Inteligente
            </h3>
            <p className="text-[10px] text-muted-foreground">Insights em tempo real</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-all"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-[10px] text-muted-foreground">Automação</span>
            </div>
            <div className="text-lg font-bold text-green-500">{automationRate}%</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] text-muted-foreground">Confiança</span>
            </div>
            <div className="text-lg font-bold text-blue-500">{avgConfidence}%</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span className="text-[10px] text-muted-foreground">Atenção</span>
            </div>
            <div className="text-lg font-bold text-yellow-500">{needsAttentionCount}</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3 w-3 text-purple-500" />
              <span className="text-[10px] text-muted-foreground">IA Ativa</span>
            </div>
            <div className="text-lg font-bold text-purple-500">{aiHandledCount}</div>
          </motion.div>
        </div>

        {/* Contact Insight (se houver conversa selecionada) */}
        {selectedConversation && contactInsight && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {selectedConversation.contact.name}
              </span>
              <Badge 
                variant="outline" 
                className={`text-[10px] h-5 ${
                  contactInsight.urgency === 'alta' 
                    ? 'border-red-500/30 bg-red-500/10 text-red-500' 
                    : contactInsight.urgency === 'média'
                    ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500'
                    : 'border-green-500/30 bg-green-500/10 text-green-500'
                }`}
              >
                {contactInsight.urgency === 'alta' ? '🔥' : contactInsight.urgency === 'média' ? '⚡' : '✓'} 
                {contactInsight.urgency}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Confiança:</span>
                <span className="font-semibold">{contactInsight.confidence}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">Sentimento:</span>
                <span className="font-semibold capitalize">{contactInsight.sentiment}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        <div className="pt-2 border-t border-border/20">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold text-muted-foreground">Recomendações</span>
          </div>
          <div className="space-y-1.5">
            {needsAttentionCount > 0 && (
              <div className="flex items-start gap-2 text-[10px]">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground leading-relaxed">
                  {needsAttentionCount} conversa{needsAttentionCount > 1 ? 's' : ''} precisa{needsAttentionCount === 1 ? '' : 'm'} de atenção humana
                </span>
              </div>
            )}
            {automationRate > 80 && (
              <div className="flex items-start gap-2 text-[10px]">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground leading-relaxed">
                  IA está performando muito bem! Continue monitorando.
                </span>
              </div>
            )}
            {automationRate < 50 && (
              <div className="flex items-start gap-2 text-[10px]">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                <span className="text-muted-foreground leading-relaxed">
                  Considere ajustar os prompts da IA para melhor automação
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
