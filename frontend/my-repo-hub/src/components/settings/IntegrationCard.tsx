import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { Integration } from "./IntegrationsTab";

interface Channel {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  fields: { name: string; label: string; type: string; placeholder?: string }[];
  onConnect?: () => void;
}

interface IntegrationCardProps {
  channel: Channel;
  integration: Integration | null;
  onConnect: (channel: string, credentials: any) => void;
  onDisconnect: (channel: string) => void;
}

export function IntegrationCard({
  channel,
  integration,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleConnect = () => {
    if (channel.onConnect) {
      channel.onConnect();
    } else {
      onConnect(channel.id, credentials);
      setIsExpanded(false);
      setCredentials({});
    }
  };

  const isConnected = integration?.status === "connected";
  const Icon = channel.icon;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-muted ${channel.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-semibold">{channel.name}</h4>
            <p className="text-sm text-muted-foreground">
              {channel.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {isConnected ? (
          <>
            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
              ✓ Conectado
            </Badge>
            {integration.phone_number && (
              <p className="text-sm text-muted-foreground">
                {integration.phone_number}
              </p>
            )}
            {integration.last_sync && (
              <p className="text-xs text-muted-foreground">
                Última sincronização:{" "}
                {new Date(integration.last_sync).toLocaleString("pt-BR")}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDisconnect(channel.id)}
              className="w-full"
            >
              Desconectar
            </Button>
          </>
        ) : (
          <>
            {!isExpanded ? (
              <Button
                onClick={() => setIsExpanded(true)}
                className="w-full"
                variant="outline"
              >
                Conectar {channel.name}
              </Button>
            ) : (
              <div className="space-y-3">
                {channel.fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={credentials[field.name] || ""}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          [field.name]: e.target.value,
                        })
                      }
                      className="bg-muted/30"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    onClick={handleConnect}
                    className="flex-1"
                    size="sm"
                  >
                    Conectar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsExpanded(false);
                      setCredentials({});
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
