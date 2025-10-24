"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AuthService from "../lib/auth";
import { Navigation } from "./Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setLoading(false);

      // Redirecionar para login se não autenticado e não estiver em uma rota pública
      const publicRoutes = ["/", "/login", "/reset-password"];
      if (!authenticated && !publicRoutes.includes(pathname)) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [pathname, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

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
