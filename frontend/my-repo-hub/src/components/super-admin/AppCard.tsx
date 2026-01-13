import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppCardProps {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  color: string;
  icon: LucideIcon;
  stats: {
    label: string;
    value: string;
    trend?: string;
  }[];
  route: string;
}

export function AppCard({ id, name, description, status, color, icon: Icon, stats, route }: AppCardProps) {
  const navigate = useNavigate();
  const isActive = status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className={`glass-card border-2 relative overflow-hidden group cursor-pointer ${
          isActive 
            ? `border-[${color}]/30 hover:border-[${color}]/50` 
            : 'border-muted/30 opacity-60'
        }`}
        onClick={() => isActive && navigate(route)}
      >
        {/* Background gradient */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)`
          }}
        />

        {/* Glow effect */}
        {isActive && (
          <div 
            className="absolute -inset-0.5 opacity-0 group-hover:opacity-30 blur-xl transition-opacity"
            style={{ background: color }}
          />
        )}

        <CardContent className="p-8 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-4 rounded-2xl relative"
                style={{
                  background: `linear-gradient(135deg, ${color}20, ${color}10)`
                }}
              >
                <Icon className="h-8 w-8" style={{ color }} />
                {isActive && (
                  <div 
                    className="absolute inset-0 rounded-2xl blur-lg opacity-50"
                    style={{ background: color }}
                  />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">{name}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <Badge 
              className={`${
                isActive 
                  ? 'bg-success/10 text-success border-success/30' 
                  : 'bg-muted/10 text-muted-foreground border-muted/30'
              }`}
            >
              {isActive ? 'Ativo' : 'Em Breve'}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="p-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50"
              >
                <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: isActive ? color : undefined }}>
                  {stat.value}
                </p>
                {stat.trend && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                )}
              </div>
            ))}
          </div>

          {/* Action Button */}
          {isActive ? (
            <Button 
              className="w-full group/btn relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                border: `1px solid ${color}30`,
                color: color
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Acessar Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </span>
              <div 
                className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                style={{ background: `${color}10` }}
              />
            </Button>
          ) : (
            <Button 
              disabled
              variant="outline"
              className="w-full"
            >
              Em Desenvolvimento
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
