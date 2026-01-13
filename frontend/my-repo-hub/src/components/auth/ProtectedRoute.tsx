import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem('is_authenticated');
        const cacheTime = sessionStorage.getItem('auth_check_time');
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 10 * 60 * 1000) { // 10 minutos
            setIsAuthenticated(cached === 'true');
            setIsLoading(false);
            return;
          }
        }

        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          // Sessão inválida/expirada: limpar e redirecionar rapidamente
          await supabase.auth.signOut();
          sessionStorage.removeItem('is_authenticated');
          sessionStorage.removeItem('auth_check_time');
          if (!mounted) return;
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        if (!mounted) return;
        
        const isAuth = !!user;
        sessionStorage.setItem('is_authenticated', String(isAuth));
        sessionStorage.setItem('auth_check_time', String(Date.now()));
        setIsAuthenticated(isAuth);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
