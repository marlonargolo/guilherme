// components/PlatformSelector.tsx
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIntegrations } from '@/contexts/IntegrationsContext';
import { 
  Instagram, 
  MessageCircle, 
  Music, 
  Briefcase,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformToggle: (platformId: string) => void;
  className?: string;
  showOnlyConnected?: boolean;
}

const PLATFORM_CONFIG = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: MessageCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-600/30',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'text-black dark:text-white',
    bgColor: 'bg-gray-900/10 dark:bg-white/10',
    borderColor: 'border-gray-900/30 dark:border-white/30',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Briefcase,
    color: 'text-blue-700',
    bgColor: 'bg-blue-700/10',
    borderColor: 'border-blue-700/30',
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
};

export function PlatformSelector({
  selectedPlatforms,
  onPlatformToggle,
  className,
  showOnlyConnected = true,
}: PlatformSelectorProps) {
  const { integrations, isConnected, loading } = useIntegrations();

  // Filtrar plataformas conectadas
  const availablePlatforms = showOnlyConnected
    ? Object.values(PLATFORM_CONFIG).filter(platform => 
        isConnected(platform.id)
      )
    : Object.values(PLATFORM_CONFIG);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (availablePlatforms.length === 0) {
    return (
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="ml-2">
          <p className="font-medium mb-2">Nenhuma plataforma conectada</p>
          <p className="text-sm text-muted-foreground mb-3">
            Você precisa conectar pelo menos uma plataforma para publicar conteúdo.
          </p>
          <Link to="/settings">
            <Button size="sm" variant="outline" className="gap-2">
              <ExternalLink className="h-3 w-3" />
              Conectar Plataformas
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Plataformas Conectadas ({availablePlatforms.length})
        </p>
        {selectedPlatforms.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedPlatforms.length} selecionada(s)
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {availablePlatforms.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selectedPlatforms.includes(platform.id);
          const integration = integrations.find(i => i.channel === platform.id);

          return (
            <button
              key={platform.id}
              onClick={() => onPlatformToggle(platform.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200",
                "hover:shadow-lg hover:scale-105",
                isSelected
                  ? `${platform.borderColor} ${platform.bgColor} shadow-md`
                  : "border-border/50 hover:border-primary/50 bg-background/50"
              )}
            >
              {/* Badge de seleção */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg 
                    className="w-4 h-4 text-primary-foreground" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  platform.bgColor
                )}>
                  <Icon className={cn("h-6 w-6", platform.color)} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{platform.name}</p>
                  {integration?.credentials?.username && (
                    <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                      @{integration.credentials.username}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Informação adicional */}
      {selectedPlatforms.length === 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          Selecione uma ou mais plataformas para publicar
        </p>
      )}
    </div>
  );
}

// Variante compacta para uso em modais ou espaços reduzidos
export function CompactPlatformSelector({
  selectedPlatforms,
  onPlatformToggle,
  className,
}: PlatformSelectorProps) {
  const { integrations, isConnected } = useIntegrations();

  const connectedPlatforms = Object.values(PLATFORM_CONFIG).filter(platform => 
    isConnected(platform.id)
  );

  if (connectedPlatforms.length === 0) {
    return (
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="ml-2 text-sm">
          Conecte plataformas nas configurações
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {connectedPlatforms.map((platform) => {
        const Icon = platform.icon;
        const isSelected = selectedPlatforms.includes(platform.id);

        return (
          <button
            key={platform.id}
            onClick={() => onPlatformToggle(platform.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all",
              isSelected
                ? `${platform.borderColor} ${platform.bgColor}`
                : "border-border/50 hover:border-primary/50"
            )}
          >
            <Icon className={cn("h-4 w-4", platform.color)} />
            <span className="text-sm font-medium">{platform.name}</span>
          </button>
        );
      })}
    </div>
  );
}