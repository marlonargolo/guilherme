import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Sparkles, Eye, EyeOff, Loader2, Mail, CheckCircle, Zap, TrendingUp } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.png";
import loginHero from "@/assets/login-hero.png";
import { useToast } from "@/hooks/use-toast";
import { TwoFactorModal } from "@/components/auth/TwoFactorModal";
import { loginViaBackend } from "@/lib/backendAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .max(72, "Senha deve ter no máximo 72 caracteres"),
});

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [show2FA, setShow2FA] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user is superadmin
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'superadmin')
          .maybeSingle();

        if (roles) {
          navigate("/super-admin");
        } else {
          navigate("/inbox");
        }
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validação com zod
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await loginViaBackend({ email, password });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sessão não iniciada");
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'superadmin')
        .maybeSingle();

      toast({
        title: "Login realizado!",
        description: "Bem-vindo ao SocialFlow",
      });

      if (roles) {
        navigate("/super-admin");
      } else {
        navigate("/inbox");
      }
    } catch (error: any) {
      setLoginAttempts((prev) => prev + 1);
      toast({
        title: "Erro ao fazer login",
        description: error?.message || "Verifique suas credenciais.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    try {
      // SEMPRE usar o domínio de produção para Google OAuth
      const redirectTo = 'https://app.socialflow.aitonomy.ai/auth/callback';
      
      console.log('Iniciando login com Google...');
      console.log('Redirect URL forçada:', redirectTo);
  
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Forçar a URL do site
          skipBrowserRedirect: false,
        },
      });
  
      if (error) {
        console.error('Erro no login com Google:', error);
        throw error;
      }
  
      console.log('Login com Google iniciado:', data);
      
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast({
        title: "Erro ao fazer login com Google",
        description: error?.message || "Não foi possível conectar com o Google.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FA(false);
    toast({
      title: "Autenticação completa!",
      description: "Bem-vindo ao SocialFlow",
    });
    navigate("/inbox");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Theme Toggle - Fixed position */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={loginHero} 
            alt="SocialFlow Dashboard" 
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/20 dark:from-purple-950/90 dark:to-purple-900/80" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-foreground dark:text-white">
          <div className="max-w-lg space-y-8">
            <div>
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                Transforme suas<br />
                <span className="text-gradient">Redes Sociais</span><br />
                em Resultados
              </h1>
              <p className="text-xl text-muted-foreground">
                Gerencie todas as suas redes sociais em um só lugar com o poder da IA
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-5 bg-card/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-border/50 dark:border-white/20">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Automação Inteligente</h3>
                  <p className="text-sm text-muted-foreground">Responda automaticamente comentários e DMs com IA</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-card/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-border/50 dark:border-white/20">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Analytics Poderoso</h3>
                  <p className="text-sm text-muted-foreground">Métricas detalhadas para tomar decisões estratégicas</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-card/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl border border-border/50 dark:border-white/20">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Integração Total</h3>
                  <p className="text-sm text-muted-foreground">Instagram, Facebook, WhatsApp e muito mais</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-border/50 dark:border-white/20">
              <p className="text-sm text-muted-foreground mb-3">Empresas que confiam no SocialFlow:</p>
              <div className="flex items-center gap-8">
                <div className="text-2xl font-bold text-foreground/80">1000+</div>
                <div className="text-sm text-muted-foreground">Empresas Ativas</div>
                <div className="text-2xl font-bold text-foreground/80">98%</div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo e título */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="SocialFlow Logo" className="h-12 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Bem-vindo de volta!</h1>
              <p className="text-muted-foreground mt-2">
                Entre para continuar gerenciando suas redes
              </p>
            </div>
          </div>

          {/* Card de login */}
          <Card className="bg-card/80 backdrop-blur-xl border-border p-8 space-y-6 shadow-2xl rounded-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-input border-border text-foreground placeholder:text-muted-foreground rounded-xl ${errors.email ? "border-destructive" : ""}`}
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 rounded-xl ${errors.password ? "border-destructive" : ""}`}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground rounded-xl"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Lembrar-me e Esqueceu senha */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Lembrar-me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm p-0 h-auto"
                  onClick={() => navigate("/recuperar-senha")}
                  disabled={isLoading}
                >
                  Esqueceu a senha?
                </Button>
              </div>

              {/* Botão de login */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold rounded-xl py-3"
                disabled={isLoading || loginAttempts >= 5}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            {/* Login social */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-border bg-transparent hover:bg-muted text-foreground rounded-xl"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Entrar com Google
                  </>
                )}
              </Button>
            </div>

            {/* Link de cadastro */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Não tem uma conta? </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80"
                onClick={() => navigate("/cadastro")}
              >
                Criar conta grátis
              </Button>
            </div>
          </Card>

          {/* Rodapé */}
          <p className="text-center text-xs text-muted-foreground">
            Precisa de ajuda?{" "}
            <a
              href="mailto:suporte@socialflow.ai"
              className="text-primary hover:text-primary/80 hover:underline"
            >
              suporte@socialflow.ai
            </a>
          </p>
          <div className="text-center text-xs text-muted-foreground space-x-4">
            <Link to="/politica-de-privacidade" className="hover:text-primary hover:underline">
              Política de Privacidade
            </Link>
            <Link to="/politica-de-privacidade/exclusao" className="hover:text-primary hover:underline">
              Exclusão de Dados
            </Link>
            <Link to="/politica-de-privacidade/termos" className="hover:text-primary hover:underline">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>

      {/* Modal 2FA */}
      <TwoFactorModal
        open={show2FA}
        onOpenChange={setShow2FA}
        onSuccess={handle2FASuccess}
      />
    </div>
  );
}