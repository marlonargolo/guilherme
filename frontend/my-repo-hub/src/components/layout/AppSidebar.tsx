import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home,
  MessageSquare,
  Brain,
  BarChart3,
  Settings,
  Hash,
  Sparkles,
  Zap,
  Link2,
  Wand2,
  Crown,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionStatus } from "@/lib/subscription";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home, badge: null },
  { title: "Inbox Omnichannel", url: "/inbox", icon: MessageSquare, badge: "Ao Vivo" },
  { title: "Automações DM", url: "/automations-dm", icon: Zap, badge: null },
  { title: "Chat IA", url: "/chat-ia", icon: Brain, badge: null },
  { title: "Criação e Agendamento", url: "/creator-studio", icon: Wand2, badge: null },
  { title: "Comentários", url: "/comments", icon: Hash, badge: null },
  { title: "Prompt Manager", url: "/prompt-manager", icon: Sparkles, badge: null },
  { title: "Analytics", url: "/analytics", icon: BarChart3, badge: null },
  { title: "Conexões", url: "/connections", icon: Link2, badge: null },
  { title: "Planos", url: "/planos", icon: Crown, badge: null },
  { title: "Configurações", url: "/settings", icon: Settings, badge: null },
];

function UserInfo() {
  const [userName, setUserName] = useState("Usuário");
  const [userPlan, setUserPlan] = useState("Carregando...");

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (profile?.name) {
        setUserName(profile.name);
      } else {
        setUserName(user.email?.split('@')[0] || 'Usuário');
      }

      const subscription = await getSubscriptionStatus();
      if (subscription?.plan_name) {
        setUserPlan(`Plano ${subscription.plan_name}`);
      } else if (subscription?.subscribed) {
        setUserPlan("Plano ativo");
      } else {
        setUserPlan('Plano Free');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent" />
      <div className="flex-1">
        <p className="text-sm font-medium">{userName}</p>
        <p className="text-xs text-muted-foreground">{userPlan}</p>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const location = useLocation();
  
  return (
    <Sidebar className="glass-card border-r border-border/50">
      <SidebarHeader className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="SocialFlow Logo" className="h-8 w-auto object-contain" />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-6">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className={`
                          flex items-center gap-3 px-6 py-3 transition-all
                          ${isActive 
                            ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={isActive ? "default" : "secondary"}
                            className={isActive ? "bg-primary/20 text-primary border-primary/30" : ""}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-6 border-t border-border/50">
        <UserInfo />
      </SidebarFooter>
    </Sidebar>
  );
}
