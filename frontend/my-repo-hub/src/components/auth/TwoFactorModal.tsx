import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";

interface TwoFactorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TwoFactorModal({ open, onOpenChange, onSuccess }: TwoFactorModalProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Digite o código de 6 dígitos enviado para seu email.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Simulação - em produção, chamar POST /api/auth/2fa/verify
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verificar código (exemplo: sempre aceita "123456" para demo)
      if (code === "123456") {
        toast({
          title: "Código verificado!",
          description: "Autenticação de dois fatores completa.",
        });
        onSuccess();
      } else {
        toast({
          title: "Código inválido",
          description: "O código inserido está incorreto. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao verificar",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Autenticação de Dois Fatores</DialogTitle>
          <DialogDescription className="text-center">
            Digite o código de 6 dígitos enviado para seu email
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            onClick={handleVerify}
            className="w-full btn-glow"
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar"
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toast({
                title: "Código reenviado",
                description: "Um novo código foi enviado para seu email.",
              });
            }}
            disabled={isVerifying}
          >
            Reenviar código
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
