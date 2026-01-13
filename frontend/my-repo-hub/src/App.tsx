import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { RetentionModal } from "@/components/RetentionModal";
import { Suspense, lazy } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SubscriptionProtectedRoute } from "./components/auth/SubscriptionProtectedRoute";
import { SuperAdminRoute } from "./components/auth/SuperAdminRoute";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Comments from "./pages/Comments";
import PromptManager from "./pages/PromptManager";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AutomationsDM from "./pages/AutomationsDM";
import ChatIA from "./pages/ChatIA";
import Connections from "./pages/Connections";
import Suporte from "./pages/Suporte";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import CreatorStudio from "./pages/CreatorStudio";
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const SocialFlowDashboard = lazy(() => import("./pages/super-admin/apps/SocialFlowDashboard"));
const IntelligentAgentDashboard = lazy(() => import("./pages/super-admin/apps/IntelligentAgentDashboard"));
const Usuarios = lazy(() => import("./pages/super-admin/Usuarios"));
const SuporteAdmin = lazy(() => import("./pages/super-admin/SuporteNovo"));
const Integracoes = lazy(() => import("./pages/super-admin/Integracoes"));
const SuperAdminAnalytics = lazy(() => import("./pages/super-admin/Analytics"));
const IA = lazy(() => import("./pages/super-admin/IA"));
const Configuracoes = lazy(() => import("./pages/super-admin/Configuracoes"));
const Conformidade = lazy(() => import("./pages/super-admin/Conformidade"));
const MasterAgent = lazy(() => import("./pages/super-admin/MasterAgent"));
const Financeiro = lazy(() => import("./pages/super-admin/Financeiro"));
const Equipe = lazy(() => import("./pages/super-admin/Equipe"));
const Notificacoes = lazy(() => import("./pages/super-admin/Notificacoes"));
const Templates = lazy(() => import("./pages/super-admin/Templates"));
const Comunicacao = lazy(() => import("./pages/super-admin/Comunicacao"));
const LogsAdmin = lazy(() => import("./pages/super-admin/Logs"));
const WhiteLabel = lazy(() => import("./pages/super-admin/WhiteLabel"));
const Automacoes = lazy(() => import("./pages/super-admin/Automacoes"));
const SuperAdminDashboard = lazy(() => import("./pages/super-admin/Dashboard"));
import NotFound from "./pages/NotFound";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import OAuthCallback from './pages/OAuthCallback';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import { IntegrationsProvider } from '@/contexts/IntegrationsContext';
import Planos from "./pages/Planos";
const Tickets = lazy(() => import("./pages/super-admin/Tickets"));
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import DataDeletion from "./pages/legal/DataDeletion";
import TermsOfUse from "./pages/legal/TermsOfUse";

const App = () => (
  <IntegrationsProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RetentionModal />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/auth/callback" element={<GoogleAuthCallback />} />
          
          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <SuperAdminRoute>
                <SuperAdmin />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow"
            element={
              <SuperAdminRoute>
                <SocialFlowDashboard />
              </SuperAdminRoute>
            }
          />
          {/* Social Flow Internal Routes with dedicated layout */}
          <Route
            path="/super-admin/apps/social-flow/dashboard"
            element={
              <SuperAdminRoute>
                <SocialFlowDashboard />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/usuarios"
            element={
              <SuperAdminRoute>
                <Usuarios />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/equipe"
            element={
              <SuperAdminRoute>
                <Equipe />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/financeiro"
            element={
              <SuperAdminRoute>
                <Financeiro />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/analytics"
            element={
              <SuperAdminRoute>
                <SuperAdminAnalytics />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/automacoes"
            element={
              <SuperAdminRoute>
                <Automacoes />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/master-agent"
            element={
              <SuperAdminRoute>
                <MasterAgent />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/suporte"
            element={
              <SuperAdminRoute>
                <SuporteAdmin />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/ia"
            element={
              <SuperAdminRoute>
                <IA />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/templates"
            element={
              <SuperAdminRoute>
                <Templates />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/comunicacao"
            element={
              <SuperAdminRoute>
                <Comunicacao />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/integracoes"
            element={
              <SuperAdminRoute>
                <Integracoes />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/white-label"
            element={
              <SuperAdminRoute>
                <WhiteLabel />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/configuracoes"
            element={
              <SuperAdminRoute>
                <Configuracoes />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/logs"
            element={
              <SuperAdminRoute>
                <LogsAdmin />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/conformidade"
            element={
              <SuperAdminRoute>
                <Conformidade />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/social-flow/notificacoes"
            element={
              <SuperAdminRoute>
                <Notificacoes />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/apps/intelligent-agent"
            element={
              <SuperAdminRoute>
                <IntelligentAgentDashboard />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/usuarios"
            element={
              <SuperAdminRoute>
                <Usuarios />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/suporte"
            element={
              <SuperAdminRoute>
                <SuporteAdmin />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/integracoes"
            element={
              <SuperAdminRoute>
                <Integracoes />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/analytics"
            element={
              <SuperAdminRoute>
                <SuperAdminAnalytics />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/ia"
            element={
              <SuperAdminRoute>
                <IA />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/master-agent"
            element={
              <SuperAdminRoute>
                <MasterAgent />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/configuracoes"
            element={
              <SuperAdminRoute>
                <Configuracoes />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/conformidade"
            element={
              <SuperAdminRoute>
                <Conformidade />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/financeiro"
            element={
              <SuperAdminRoute>
                <Financeiro />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/equipe"
            element={
              <SuperAdminRoute>
                <Equipe />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/notificacoes"
            element={
              <SuperAdminRoute>
                <Notificacoes />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/templates"
            element={
              <SuperAdminRoute>
                <Templates />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/comunicacao"
            element={
              <SuperAdminRoute>
                <Comunicacao />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/logs"
            element={
              <SuperAdminRoute>
                <LogsAdmin />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/white-label"
            element={
              <SuperAdminRoute>
                <WhiteLabel />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/dashboard"
            element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/automacoes"
            element={
              <SuperAdminRoute>
                <Automacoes />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/super-admin/tickets"
            element={
              <SuperAdminRoute>
                <Tickets />
              </SuperAdminRoute>
            }
          />
          
          {/* Protected Routes with Subscription Required */}
          <Route
            path="/"
            element={
              <SubscriptionProtectedRoute>
                <AppLayout />
              </SubscriptionProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="automations-dm" element={<AutomationsDM />} />
            <Route path="chat-ia" element={<ChatIA />} />
            <Route path="creator-studio" element={<CreatorStudio />} />
            <Route path="comments" element={<Comments />} />
            <Route path="prompt-manager" element={<PromptManager />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="connections" element={<Connections />} />
            <Route path="suporte" element={<Suporte />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Auth-only Routes (no subscription required) */}
          <Route
            path="/planos"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Planos />} />
          </Route>
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
          <Route path="/politica-de-privacidade/exclusao" element={<DataDeletion />} />
          <Route path="/politica-de-privacidade/termos" element={<TermsOfUse />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  </IntegrationsProvider>
);

export default App;