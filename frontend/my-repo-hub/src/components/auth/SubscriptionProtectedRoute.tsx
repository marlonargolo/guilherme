import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionStatus } from "@/lib/subscription";
import { Loader2 } from "lucide-react";

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
}

export function SubscriptionProtectedRoute({ children }: SubscriptionProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkAuthAndSubscription = async () => {
      try {
        // 1. Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (!user || authError) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // 2. Check profile plan - allow free plan access
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, subscription_status')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        // Free plan users can access (with limited features)
        if (profile?.plan === 'free') {
          setHasSubscription(true); // Allow access
          setIsLoading(false);
          return;
        }

        // 3. Check cache for paid subscriptions
        const cacheKey = 'has_subscription';
        const cacheTime = 'subscription_check_time';
        const cached = sessionStorage.getItem(cacheKey);
        const timestamp = sessionStorage.getItem(cacheTime);
        
        if (cached && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < 15 * 60 * 1000) { // 15 minutes
            setHasSubscription(cached === 'true');
            setIsLoading(false);
            return;
          }
        }

        // 4. Check active paid subscription
        const status = await getSubscriptionStatus();

        if (!mounted) return;

        const hasSub = !!status?.subscribed;
        sessionStorage.setItem(cacheKey, String(hasSub));
        sessionStorage.setItem(cacheTime, String(Date.now()));
        setHasSubscription(hasSub);
      } catch (error) {
        console.error("Error checking subscription:", error);
        if (mounted) setHasSubscription(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkAuthAndSubscription();
    
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

  if (!hasSubscription) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
}
