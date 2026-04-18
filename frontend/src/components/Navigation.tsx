"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Film,
  Tv,
  Star,
  Heart,
  LogOut,
  LogIn,
  ListPlus,
  Play,
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkAuth = () => {
      const authenticated = AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setUser(authenticated ? AuthService.getUser() : null);
    };

    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    toast.success("Até logo!", {
      description: "Logout realizado com sucesso.",
    });
    setTimeout(() => AuthService.logout(), 1000);
  };

  const handleLogin = () => {
    router.push(isAuthenticated ? "/filmes" : "/login");
  };

  const allNavigationItems = [
    {
      name: "Filmes",
      href: "/filmes",
      icon: Film,
      color: "text-purple-400",
      activeBg: "bg-purple-500/10 border-purple-500/20 text-purple-300",
      current: pathname === "/filmes" || pathname.startsWith("/filmes/"),
      requiresAuth: false,
    },
    {
      name: "Séries",
      href: "/series",
      icon: Tv,
      color: "text-violet-400",
      activeBg: "bg-violet-500/10 border-violet-500/20 text-violet-300",
      current: pathname === "/series" || pathname.startsWith("/series/"),
      requiresAuth: false,
    },
    {
      name: "Avaliações",
      href: "/avaliacoes",
      icon: Star,
      color: "text-amber-400",
      activeBg: "bg-amber-500/10 border-amber-500/20 text-amber-300",
      current: pathname === "/avaliacoes",
      requiresAuth: true,
    },
    {
      name: "Favoritos",
      href: "/favoritos",
      icon: Heart,
      color: "text-pink-400",
      activeBg: "bg-pink-500/10 border-pink-500/20 text-pink-300",
      current: pathname === "/favoritos",
      requiresAuth: true,
    },
    {
      name: "Watchlist",
      href: "/watchlist",
      icon: ListPlus,
      color: "text-emerald-400",
      activeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
      current: pathname === "/watchlist",
      requiresAuth: true,
    },
  ];

  const navigationItems = allNavigationItems.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  );

  if (!isMounted) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-[#09090b]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(168,85,247,0.08)]"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3.5">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => router.push(isAuthenticated ? "/filmes" : "/filmes")}
          >
            <div className="bg-gradient-to-br from-purple-500 to-violet-700 p-1.5 rounded-xl shadow-lg shadow-purple-500/20">
              <Play className="w-4 h-4 text-white fill-current" />
            </div>
            <span className="text-base font-black text-white tracking-tight">
              LMS{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">
                Filmes
              </span>
            </span>
            {isAuthenticated && user && (
              <span className="hidden sm:block text-xs text-white/30 font-medium pl-1 border-l border-white/10 ml-0.5">
                {user.nickname ? `@${user.nickname}` : user.name}
              </span>
            )}
          </div>

          {/* Navegação + Ações */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nav Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200",
                      item.current
                        ? cn("border", item.activeBg)
                        : "text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        item.current ? "" : item.color,
                      )}
                    />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            {/* Mobile select */}
            <div className="lg:hidden">
              <select
                onChange={(e) => router.push(e.target.value)}
                value={
                  pathname.startsWith("/filmes/")
                    ? "/filmes"
                    : pathname.startsWith("/series/")
                      ? "/series"
                      : pathname
                }
                className="appearance-none bg-[#14141c] border border-white/10 text-white/70 rounded-xl pl-3 pr-7 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all cursor-pointer"
              >
                {navigationItems.map((item) => (
                  <option
                    key={item.href}
                    value={item.href}
                    className="bg-[#14141c]"
                  >
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Divisor */}
            <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Ações */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.role === "ADMIN" && (
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold hidden sm:flex">
                    Admin
                  </Badge>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 transition-all duration-200 hover:scale-[1.02]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
