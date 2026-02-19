"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AuthService from "../lib/auth";
import { Navigation } from "./Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Middleware já cuida da autenticação, apenas verificamos state para UI
  const isAuthenticated = isClient && AuthService.isAuthenticated();

  useEffect(() => {
    // Marca componente como montado no cliente
    setIsClient(true);
  }, []);

  const getPageTitle = (pathname: string): string => {
    const pageTitles: Record<string, string> = {
      "/dashboard": "LMS Films",
      "/movies": "Avaliar Filmes",
      "/series": "Avaliar Séries",
      "/ratings": "Minhas Avaliações",
      "/favorites": "Meus Favoritos",
      "/login": "Login",
    };

    return pageTitles[pathname] || "LMS Films";
  };
  const shouldShowNavigation = () => {
    const publicRoutes = ["/", "/login", "/reset-password"];
    return isAuthenticated && !publicRoutes.includes(pathname);
  };

  const shouldShowBackButton = () => {
    return pathname !== "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {shouldShowNavigation() && (
        <Navigation
          title={getPageTitle(pathname)}
          showBackButton={shouldShowBackButton()}
        />
      )}
      <main className={shouldShowNavigation() ? "" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
}
