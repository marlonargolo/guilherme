/**
 * ConversationList - Lista de conversas do omnichannel
 * Design glassmorphism com animações e filtros
 */

import React from "react";
import { motion } from "framer-motion";
import { Search, Filter, Phone, Instagram, MessageSquare, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Conversation } from "@/hooks/useOmnichannel";
import { AIStatusBadge } from "./AIStatusBadge";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  isLoading?: boolean;
  filterPlatform?: string | null;
  onFilterChange?: (platform: string | null) => void;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  isLoading = false,
  filterPlatform = null,
  onFilterChange
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);
  
  const filteredConversations = React.useMemo(() => {
    let filtered = conversations;
    
    // Filtrar por plataforma
    if (filterPlatform) {
      filtered = filtered.filter(conv => conv.platform?.toLowerCase() === filterPlatform.toLowerCase());
    }
    
    // Filtrar por busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.contact.name.toLowerCase().includes(search) ||
        conv.last_message_preview?.toLowerCase().includes(search) ||
        conv.platform?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [conversations, searchTerm, filterPlatform]);

  // Ícone da plataforma
  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "whatsapp": return <Phone className="h-3.5 w-3.5" />;
      case "instagram": return <Instagram className="h-3.5 w-3.5" />;
      case "telegram": return <MessageSquare className="h-3.5 w-3.5" />;
      case "facebook": 
      case "tiktok": return <Hash className="h-3.5 w-3.5" />;
      default: return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  // Cor da plataforma
  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "whatsapp": return "text-green-500 bg-green-500/10 border-green-500/30";
      case "instagram": return "text-pink-500 bg-pink-500/10 border-pink-500/30";
      case "telegram": return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "facebook": return "text-blue-600 bg-blue-600/10 border-blue-600/30";
      default: return "text-primary bg-primary/10 border-primary/30";
    }
  };

  // Formatar tempo
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now.getTime() - msgDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  };

  return (
    <Card className="w-full max-w-md glass-card flex flex-col h-full relative overflow-hidden group">
      {/* Background animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Header */}
      <div className="relative z-10 p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <h2 className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Conversas
            </h2>
          </div>
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter className="h-4 w-4" />
              {filterPlatform && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              )}
            </Button>
            
            {/* Filter Menu */}
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-2 w-48 glass-card border border-border/50 rounded-lg p-2 shadow-xl z-50"
              >
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onFilterChange?.(null);
                      setShowFilterMenu(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-xs transition-all",
                      !filterPlatform ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50"
                    )}
                  >
                    Todas as plataformas
                  </button>
                  {['whatsapp', 'instagram', 'telegram', 'facebook'].map(platform => (
                    <button
                      key={platform}
                      onClick={() => {
                        onFilterChange?.(platform);
                        setShowFilterMenu(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-xs transition-all flex items-center gap-2",
                        filterPlatform === platform ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/50"
                      )}
                    >
                      {getPlatformIcon(platform)}
                      <span className="capitalize">{platform}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover/search:text-primary transition-colors" />
          <Input
            placeholder="Buscar conversas..."
            className="pl-9 h-9 text-sm bg-muted/20 border-border/30 rounded-lg hover:border-primary/50 focus:border-primary transition-all backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1 relative z-10">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-primary text-sm">
              <motion.div 
                className="h-2 w-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span>Carregando...</span>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-xl rounded-full" />
              <MessageSquare className="h-12 w-12 mx-auto text-primary/50 relative z-10" />
            </div>
            <p className="text-sm font-medium text-foreground/80">
              {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa"}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
              {searchTerm ? "Tente outro termo de busca" : "As conversas aparecerão aqui quando você receber mensagens"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.slice(0, 5).map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all duration-200 group/conv relative",
                  "hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5",
                  selectedConversation?.id === conv.id 
                    ? "bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 shadow-lg shadow-primary/10" 
                    : "bg-muted/5 border border-transparent hover:border-border/50"
                )}
              >
                {/* Indicator de seleção */}
                {selectedConversation?.id === conv.id && (
                  <motion.div 
                    layoutId="conversation-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-primary to-accent rounded-r-full"
                  />
                )}

                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-border/30 group-hover/conv:border-primary/50 transition-all">
                      <AvatarImage src={conv.contact.avatar_url} />
                      <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-accent/20">
                        {conv.contact.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Platform badge */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-background",
                        getPlatformColor(conv.platform)
                      )}
                    >
                      {getPlatformIcon(conv.platform)}
                    </motion.div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {conv.contact.name}
                      </h3>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {getTimeAgo(conv.last_message_at)}
                      </span>
                    </div>

                    {/* Preview da última mensagem */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {conv.last_message_preview}
                    </p>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <AIStatusBadge 
                        aiStatus={conv.ai_status}
                        aiConfidence={conv.ai_confidence}
                        conversationStatus={conv.status}
                      />
                      
                      {/* Unread count */}
                      {conv.unread_count > 0 && (
                        <Badge className="h-5 px-1.5 bg-primary text-primary-foreground text-[10px] font-bold">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
