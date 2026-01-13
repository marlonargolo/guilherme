import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, ArrowLeft, Mail } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
});

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validação
    const validation = emailSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Não foi possível processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e título */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-background" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              {emailSent ? "Email Enviado" : "Recuperar Senha"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {emailSent
                ? "Verifique sua caixa de entrada"
                : "Digite seu email para receber instruções"}
            </p>
          </div>
        </div>

        {/* Card */}
        <Card className="glass-card p-8 space-y-6">
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-muted/30 ${error ? "border-destructive" : ""}`}
                  disabled={isLoading}
                  aria-invalid={!!error}
                  aria-describedby={error ? "email-error" : undefined}
                />
                {error && (
                  <p id="email-error" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full btn-glow"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Instruções
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/login")}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para login
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <p className="text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
              </p>
              <div className="space-y-2 pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                >
                  Enviar novamente
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para login
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Rodapé */}
        <p className="text-center text-xs text-muted-foreground">
          Precisa de ajuda?{" "}
          <a
            href="mailto:suporte@socialflow.ai"
            className="text-primary hover:underline"
          >
            suporte@socialflow.ai
          </a>
        </p>
      </div>
    </div>
  );
}
