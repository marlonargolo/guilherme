import { Badge } from "@/components/ui/badge";
import { Zap, Brain } from "lucide-react";

interface AppBadgeProps {
  appTypes: string[] | null;
  size?: "sm" | "md" | "lg";
}

export function AppBadge({ appTypes, size = "sm" }: AppBadgeProps) {
  if (!appTypes || appTypes.length === 0) {
    return (
      <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-muted-foreground/20 text-xs">
        Sem App
      </Badge>
    );
  }

  const fontSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base";
  const iconSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex flex-wrap gap-1">
      {appTypes.includes("social_flow") && (
        <Badge className={`bg-primary/10 text-primary border-primary/20 ${fontSize} flex items-center gap-1`}>
          <Zap className={iconSize} />
          Social Flow
        </Badge>
      )}
      {appTypes.includes("intelligent_agent") && (
        <Badge className={`bg-accent/10 text-accent border-accent/20 ${fontSize} flex items-center gap-1`}>
          <Brain className={iconSize} />
          Intelligent Agent
        </Badge>
      )}
    </div>
  );
}
