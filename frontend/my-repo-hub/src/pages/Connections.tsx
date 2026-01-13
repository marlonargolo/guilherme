import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { Link2 } from "lucide-react";
import { FirstTimeSetupModal } from "@/components/connections/FirstTimeSetupModal";

export default function Connections() {
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);

  useEffect(() => {
    // Check if user has connected any integrations before
    const hasSeenSetup = localStorage.getItem("hasSeenConnectionSetup");
    if (!hasSeenSetup) {
      setShowFirstTimeSetup(true);
    }
  }, []);

  const handleSetupComplete = () => {
    localStorage.setItem("hasSeenConnectionSetup", "true");
    setShowFirstTimeSetup(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.15)]">
          <Link2 className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Conexões
          </h1>
          <p className="text-muted-foreground mt-1">
            Conecte suas redes sociais para começar a usar o SocialFlow
          </p>
        </div>
      </div>

      <IntegrationsTab appType="omnichannel" />

      <FirstTimeSetupModal 
        open={showFirstTimeSetup}
        onComplete={handleSetupComplete}
      />
    </div>
  );
}
