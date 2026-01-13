import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkSuperAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (!user) {
          setIsSuperAdmin(false);
          setIsLoading(false);
          return;
        }

        // Check cache first - use simpler key
        const cacheKey = 'is_superadmin';
        const cacheTime = 'superadmin_check_time';
        const cached = sessionStorage.getItem(cacheKey);
        const timestamp = sessionStorage.getItem(cacheTime);
        
        // Use cache for 10 minutes to reduce DB calls
        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < 10 * 60 * 1000) { // 10 minutes
            setIsSuperAdmin(cached === 'true');
            setIsLoading(false);
            return;
          }
        }

        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'superadmin')
          .maybeSingle();

        if (!mounted) return;

        const isAdmin = !!roles;
        sessionStorage.setItem(cacheKey, String(isAdmin));
        sessionStorage.setItem(cacheTime, String(Date.now()));
        setIsSuperAdmin(isAdmin);
      } catch (error) {
        console.error('Error checking super admin status:', error);
        if (mounted) setIsSuperAdmin(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkSuperAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/inbox" replace />;
  }

  return <>{children}</>;
}
