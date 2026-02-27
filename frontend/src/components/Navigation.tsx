"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Film,
  Tv,
  Star,
  Home,
  LogOut,
  Heart,
  ArrowLeft,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthService from "../lib/auth";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { User } from "../lib/types";
import { Badge } from "@/components/ui/badge";

interface NavigationProps {
  title: string;
  showBackButton?: boolean;
}

export function Navigation({ title, showBackButton = true }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (AuthService.isAuthenticated()) {
      const userData = AuthService.getUser();
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    toast.success("Até logo!", {
      description: "Logout realizado com sucesso.",
    });

    setTimeout(async () => {
      AuthService.logout();
    }, 1000);
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const allNavigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard",
      requiresAuth: true,
    },
    {
      name: "Filmes",
      href: "/filmes",
      icon: Film,
      current: pathname === "/filmes" || pathname.startsWith("/filmes/"),
      requiresAuth: false,
    },
    {
      name: "Séries",
      href: "/series",
      icon: Tv,
      current: pathname === "/series" || pathname.startsWith("/series/"),
      requiresAuth: false,
    },
    {
      name: "Minhas Avaliações",
      href: "/avaliacoes",
      icon: Star,
      current: pathname === "/avaliacoes",
      requiresAuth: true,
    },
    {
      name: "Favoritos",
      href: "/favoritos",
      icon: Heart,
      current: pathname === "/favoritos",
      requiresAuth: true,
    },
  ];

  const navigationItems = allNavigationItems.filter(
    (item) => !item.requiresAuth || user,
  );

  const isDashboard = pathname === "/dashboard";

  const isPublicHome = pathname === "/filmes" || pathname === "/series";
  const shouldShowBack = showBackButton && !isDashboard && !isPublicHome;

  if (!isMounted) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Lado Esquerdo: Botão Voltar + Título + Usuário */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {shouldShowBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="hidden sm:flex w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex flex-col justify-center">
              <h1
                className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-none mb-1 cursor-pointer"
                onClick={() => router.push(user ? "/dashboard" : "/")}
              >
                {title}
              </h1>
              <div className="text-xs sm:text-sm font-medium min-h-[16px] sm:min-h-[20px] flex items-center">
                {user ? (
                  <p className="text-slate-400">
                    Bem-vindo,{" "}
                    <span className="text-slate-300">{user.name}</span> (@
                    {user.nickname})
                  </p>
                ) : (
                  <p className="text-slate-500 italic">Visitante</p>
                )}
              </div>
            </div>
          </div>

          {/* Lado Direito: Navegação + Admin + Logout/Login */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Navegação Desktop */}
            <nav className="hidden lg:flex space-x-1.5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={item.current ? "secondary" : "ghost"}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "flex items-center space-x-2 text-sm rounded-lg transition-all duration-200",
                      item.current
                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Button>
                );
              })}
            </nav>

            {/* Navegação Mobile */}
            <div className="lg:hidden">
              <div className="relative">
                <select
                  onChange={(e) => router.push(e.target.value)}
                  value={
                    pathname.startsWith("/filmes/")
                      ? "/filmes"
                      : pathname.startsWith("/series/")
                        ? "/series"
                        : pathname
                  }
                  className="appearance-none bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
                >
                  {navigationItems.map((item) => (
                    <option
                      key={item.href}
                      value={item.href}
                      className="bg-slate-900 text-slate-200"
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Ações do Usuário (Logado x Visitante) */}
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-3 sm:pl-5">
              {user ? (
                <>
                  {user.role === "ADMIN" && (
                    <Badge
                      variant="outline"
                      className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold hidden sm:flex"
                    >
                      Admin
                    </Badge>
                  )}
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    size="sm"
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all rounded-lg h-8 px-3"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline font-medium">Sair</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleLogin}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-all rounded-lg h-8 px-4 font-semibold shadow-lg shadow-blue-900/20"
                >
                  <LogIn className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
