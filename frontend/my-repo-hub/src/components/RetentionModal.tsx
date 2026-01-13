import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionStatus } from "@/lib/subscription";
import { toast } from "sonner";

export function RetentionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    let exitIntentHandled = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentHandled && !emailSent) {
        exitIntentHandled = true;
        void evaluateRetentionOpportunity();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [emailSent]);

  const evaluateRetentionOpportunity = async () => {
    if (emailSent || isSending) return;

    setIsSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Se o usuário não tem plano ativo, oferecemos a retenção
      const subscriptionData = await getSubscriptionStatus();

      if (subscriptionData?.subscribed) {
        // Já tem plano, não exibe oferta
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .maybeSingle();

      const { error } = await supabase.functions.invoke("send-retention", {
        body: {
          userEmail: profile?.email || user.email,
          userName: profile?.name || "Cliente",
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      setIsOpen(true);
    } catch (error) {
      console.error("Error processing retention flow:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleStay = () => {
    setIsOpen(false);
    toast.success("🎉 Ótima escolha! Seu cupom já está no seu email!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md glass-card border-primary/20 p-0 overflow-hidden">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              {/* Header com gradiente */}
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-20"></div>
                
                <div className="relative z-10 flex items-center justify-between mb-3">
                  <Badge className="bg-yellow-400 text-yellow-900 border-0 px-3 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Oferta Exclusiva
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative z-10 text-center">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="inline-block mb-3"
                  >
                    <Gift className="h-16 w-16" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-2">Espera! 🎉</h2>
                  <p className="text-lg font-semibold">Você ganhou</p>
                  <div className="text-6xl font-black my-3">40% OFF</div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <DialogDescription className="text-center space-y-3">
                  <p className="text-base text-foreground font-medium">
                    Não vá embora sem aproveitar esta oferta especial!
                  </p>
                  
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                      <span className="text-xs font-semibold text-purple-400 px-2">
                        CUPOM ENVIADO
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-purple-500 via-transparent to-transparent"></div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary mb-1">VOLTE40</p>
                      <p className="text-xs text-muted-foreground">Válido por 24 horas</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-left text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Email enviado com o cupom</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>WhatsApp com instruções</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-400" />
                      <span>40% de desconto garantido</span>
                    </p>
                  </div>

                  <p className="text-xs text-orange-400 font-semibold animate-pulse">
                    ⏰ Oferta válida apenas nas próximas 24 horas!
                  </p>
                </DialogDescription>

                <div className="space-y-2">
                  <Button
                    onClick={handleStay}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 h-12 text-base font-semibold"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Aproveitar Oferta Agora!
                  </Button>
                  
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    Não, obrigado
                  </Button>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
