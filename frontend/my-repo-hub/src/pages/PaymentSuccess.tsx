import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timeout = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">
          Pagamento Confirmado! 🎉
        </h1>

        <p className="text-muted-foreground mb-6">
          Sua assinatura foi ativada com sucesso. Agora você tem acesso a todos os recursos da plataforma SocialFlow.
        </p>

        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate("/")}
          >
            Ir para Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-sm text-muted-foreground">
            Você será redirecionado automaticamente em alguns segundos...
          </p>
        </div>
      </Card>
    </div>
  );
}
