"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  const getPageTitle = (path: string): string => {
    if (path.startsWith("/filmes/")) return "Detalhes do Filme";
    if (path.startsWith("/series/")) return "Detalhes da Série";

    const pageTitles: Record<string, string> = {
      "/dashboard": "LMS Films",
      "/filmes": "Catálogo de Filmes",
      "/series": "Catálogo de Séries",
      "/avaliacoes": "Minhas Avaliações",
      "/favoritos": "Meus Favoritos",
      "/login": "Login",
    };

    return pageTitles[path] || "LMS Films";
  };

  const shouldShowNavigation = () => {
    const noNavRoutes = ["/", "/login", "/reset-password", "/register"];

    return !noNavRoutes.includes(pathname);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {shouldShowNavigation() && <Navigation title={getPageTitle(pathname)} />}
      <main className={shouldShowNavigation() ? "" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
}
