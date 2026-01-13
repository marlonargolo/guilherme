import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionStatus } from "@/lib/subscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export function SubscriptionPromptModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Avoid re-showing if user dismissed recently in this browser
        if (localStorage.getItem("sf_plan_prompt_dismissed") === "1") return;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return; // only after login

        const data = await getSubscriptionStatus();

        if (!cancelled && !data?.subscribed) {
          setOpen(true);
        }
      } catch (err) {
        // fail silent to not block UX
        console.warn("SubscriptionPromptModal check failed", err);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const goToPlans = () => {
    setOpen(false);
    navigate("/planos");
  };

  const dismiss = () => {
    localStorage.setItem("sf_plan_prompt_dismissed", "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Assinatura necessária</DialogTitle>
          <DialogDescription className="text-center">
            Para usar todos os recursos do Social Flow, escolha um plano.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          <Button className="btn-glow w-full" onClick={goToPlans}>
            Ver planos
          </Button>
          <Button variant="outline" className="w-full" onClick={dismiss}>
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
