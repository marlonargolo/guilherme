import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/aitonomy-logo.png";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Send,
  Zap,
  Settings,
  LogOut,
  Menu,
  MessageSquare,
  BarChart3,
  Bot,
  FileImage,
  Layers,
  Shield,
  Crown,
  BotMessageSquare,
  Brain,
  FileText,
  Bell,
  Activity,
  Boxes,
  ChevronDown,
  Briefcase,
  Rocket,
  FileType,
  Workflow,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NotificationCenter } from "@/components/super-admin/NotificationCenter";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(["visao-geral", "aplicativos"]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("Logout realizado com sucesso");
  };

  const menuSections = [
    {
      id: "visao-geral",
      label: "Visão Geral",
      icon: Rocket,
      items: [
        { path: "/super-admin", label: "Dashboard Aitonomy", icon: LayoutDashboard },
      ]
    },
    {
      id: "aplicativos",
      label: "Aplicativos",
      icon: Layers,
      items: [
        { path: "/super-admin/apps/social-flow", label: "Social Flow", icon: Zap },
        { path: "/super-admin/apps/intelligent-agent", label: "Intelligent Agent", icon: Brain },
      ]
    },
    {
      id: "gestao",
      label: "Gestão Consolidada",
      icon: Briefcase,
      items: [
        { path: "/super-admin/usuarios", label: "Usuários (Todos Apps)", icon: Users },
      ]
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: DollarSign,
      items: [
        { path: "/super-admin/financeiro", label: "Comparativo", icon: DollarSign },
      ]
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      items: [
        { path: "/super-admin/analytics", label: "Analytics Geral", icon: BarChart3 },
      ]
    },
    {
      id: "automacao",
      label: "Automação",
      icon: Zap,
      items: [
        { path: "/super-admin/automacoes/social-flow", label: "Social Flow", icon: Zap },
        { path: "/super-admin/automacoes/intelligent-agent", label: "Intelligent Agent", icon: Brain },
      ]
    },
    {
      id: "suporte",
      label: "Suporte",
      icon: MessageSquare,
      items: [
        { path: "/super-admin/suporte", label: "Tickets Consolidados", icon: MessageSquare },
      ]
    },
    {
      id: "ia",
      label: "IA",
      icon: Brain,
      items: [
        { path: "/super-admin/ia", label: "Configuração IA", icon: Brain },
      ]
    },
    {
      id: "integracoes",
      label: "Integrações",
      icon: Workflow,
      items: [
        { path: "/super-admin/integracoes", label: "Integrações (Todos Apps)", icon: Boxes },
      ]
    },
    {
      id: "sistema",
      label: "Sistema",
      icon: Settings,
      items: [
        { path: "/super-admin/configuracoes", label: "Configurações", icon: Settings },
        { path: "/super-admin/logs", label: "Logs do Sistema", icon: Activity },
        { path: "/super-admin/conformidade", label: "Conformidade", icon: Shield },
      ]
    },
  ];

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const SidebarContent = () => (
    <>
      <div className="mb-8 px-3 pt-2 flex items-center justify-between">
        <img src={logo} alt="Aitonomy Logo" className="h-10 w-auto object-contain" />
        <NotificationCenter />
      </div>

      <nav className="space-y-1.5 px-2 pb-20">
        {menuSections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen = openSections.includes(section.id);
          const hasActiveItem = section.items.some(item => location.pathname === item.path);
          
          return (
            <Collapsible
              key={section.id}
              open={isOpen}
              onOpenChange={() => toggleSection(section.id)}
              className="space-y-0.5"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-between h-10 text-xs font-medium transition-all rounded-lg ${
                    hasActiveItem 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SectionIcon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </div>
                  <ChevronDown 
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-0.5 mt-1 ml-3 pl-3 border-l-2 border-border/30">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className={`w-full justify-start h-9 text-xs font-normal transition-all rounded-md ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="mr-2.5 h-3.5 w-3.5" />
                      {item.label}
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 px-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start h-10 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 flex items-center justify-between z-50">
        <img src={logo} alt="Aitonomy Logo" className="h-8 w-auto object-contain" />
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-background/95 backdrop-blur-md border-border/30 w-56 p-3">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-screen w-60 bg-background/40 backdrop-blur-xl border-r border-border/20 p-4">
        <SidebarContent />
      </div>

      <div className="md:ml-60 pt-14 md:pt-0 p-4 md:p-6 min-h-screen bg-background">
        {children}
      </div>
    </div>
  );
}
