import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SuperAdminLayout } from "./SuperAdminLayout";
import { SocialFlowLayout } from "./SocialFlowLayout";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const location = useLocation();
  
  // Check if we're inside Social Flow app routes
  const isSocialFlowApp = location.pathname.startsWith("/super-admin/apps/social-flow");
  
  // Use appropriate layout
  if (isSocialFlowApp) {
    return <SocialFlowLayout>{children}</SocialFlowLayout>;
  }
  
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
