import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  DollarSign,
  TrendingUp,
  Zap,
  Brain,
  MessageSquare,
  Sparkles,
  FileText,
  Send,
  Plug,
  Palette,
  Settings,
  Shield,
  Bell,
  LifeBuoy,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SocialFlowLayoutProps {
  children: React.ReactNode;
}

export function SocialFlowLayout({ children }: SocialFlowLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
      toast.success("Logout realizado com sucesso");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const menuSections = [
    {
      title: "Gestão",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/super-admin/apps/social-flow/dashboard" },
        { icon: Users, label: "Usuários", path: "/super-admin/apps/social-flow/usuarios" },
        { icon: UsersRound, label: "Equipe", path: "/super-admin/apps/social-flow/equipe" },
      ],
    },
    {
      title: "Financeiro",
      items: [
        { icon: DollarSign, label: "Financeiro Geral", path: "/super-admin/apps/social-flow/financeiro" },
        { icon: TrendingUp, label: "Financeiro Analítica", path: "/super-admin/apps/social-flow/analytics" },
      ],
    },
    {
      title: "Automação & IA",
      items: [
        { icon: Zap, label: "Automação", path: "/super-admin/apps/social-flow/automacoes" },
        { icon: Brain, label: "Master", path: "/super-admin/apps/social-flow/master-agent" },
        { icon: MessageSquare, label: "Agente", path: "/super-admin/apps/social-flow/suporte" },
        { icon: Sparkles, label: "IA", path: "/super-admin/apps/social-flow/ia" },
      ],
    },
    {
      title: "Conteúdo",
      items: [
        { icon: FileText, label: "Templates", path: "/super-admin/apps/social-flow/templates" },
        { icon: Send, label: "Comunicação", path: "/super-admin/apps/social-flow/comunicacao" },
      ],
    },
    {
      title: "Integrações",
      items: [
        { icon: Plug, label: "Integrações", path: "/super-admin/apps/social-flow/integracoes" },
        { icon: Palette, label: "White Label", path: "/super-admin/apps/social-flow/white-label" },
      ],
    },
    {
      title: "Sistema",
      items: [
        { icon: Settings, label: "Configurações", path: "/super-admin/apps/social-flow/configuracoes" },
        { icon: FileText, label: "Logs", path: "/super-admin/apps/social-flow/logs" },
        { icon: Shield, label: "Permissões", path: "/super-admin/apps/social-flow/conformidade" },
      ],
    },
    {
      title: "Outros",
      items: [
        { icon: Bell, label: "Notificações", path: "/super-admin/apps/social-flow/notificacoes" },
      ],
    },
  ];

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header com Logo */}
      <div className="p-6 border-b border-border/50">
        <Button
          variant="ghost"
          onClick={() => navigate("/super-admin")}
          className="w-full justify-start gap-2 mb-4 hover:bg-green-500/10"
        >
          <ArrowLeft className="h-4 w-4 text-green-400" />
          <span className="text-sm text-muted-foreground">Voltar ao Aitonomy</span>
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
            <Sparkles className="h-6 w-6 text-green-400" />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
            Social Flow
          </h2>
        </div>
      </div>

      {/* Menu */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-4">
          {menuSections.map((section) => (
            <Collapsible
              key={section.title}
              open={openSections.includes(section.title)}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
                {section.title}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    openSections.includes(section.title) ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? "bg-green-500/10 text-green-400 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border/50 bg-card/50 backdrop-blur-sm">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              Social Flow
            </h2>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
