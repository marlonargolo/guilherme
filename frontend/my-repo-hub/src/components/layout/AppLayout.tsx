import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VoiceAgent } from "@/components/voice/VoiceAgent";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SubscriptionPromptModal } from "@/components/auth/SubscriptionPromptModal";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });

    navigate("/login");
  };

  const handleVoiceTranscript = (text: string, isUser: boolean) => {
    console.log('Voice transcript:', { text, isUser });
    // Aqui você pode adicionar lógica global para processar transcrições
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="glass-card h-14 md:h-16 px-3 md:px-6 flex items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-2 md:gap-4 flex-1">
              <SidebarTrigger className="md:hidden" />
              <div className="relative max-w-md flex-1 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <ThemeToggle />
              <LanguageSelector />
              
              <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10 rounded-xl">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-accent rounded-full animate-pulse-glow" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Subscription Prompt */}
      <SubscriptionPromptModal />
      {/* Global Voice Agent - Hidden but active in background */}
      <div className="hidden">
        <VoiceAgent onTranscript={handleVoiceTranscript} />
      </div>
    </SidebarProvider>
  );
}