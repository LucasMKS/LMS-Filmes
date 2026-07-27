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
  Menu,
  User as UserIcon,
  Eye,
  FolderHeart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthService from "../lib/auth";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { User } from "../lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navigateTo = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
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
      name: "Minhas Listas",
      href: "/listas",
      icon: FolderHeart,
      color: "text-purple-400",
      activeBg: "bg-purple-500/10 border-purple-500/20 text-purple-300",
      current: pathname === "/listas" || pathname.startsWith("/listas/"),
      requiresAuth: false,
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

            {/* Mobile Menu (Sheet) */}
            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/5 rounded-xl">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px] bg-[#0a0a0f] border-white/10 p-0">
                  <SheetHeader className="p-6 text-left border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-gradient-to-br from-purple-500 to-violet-700 p-1.5 rounded-xl shadow-lg shadow-purple-500/20">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </div>
                      <SheetTitle className="text-base font-black text-white tracking-tight">
                        LMS <span className="text-purple-400">Filmes</span>
                      </SheetTitle>
                    </div>
                  </SheetHeader>
                  
                  <div className="flex flex-col h-[calc(100%-80px)] justify-between">
                    <nav className="flex flex-col gap-1 p-4">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => navigateTo(item.href)}
                            className={cn(
                              "flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left",
                              item.current
                                ? cn("bg-white/5 border border-white/10 text-white", item.activeBg)
                                : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent",
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-4.5 h-4.5 transition-colors",
                                item.current ? "" : item.color,
                              )}
                            />
                            {item.name}
                          </button>
                        );
                      })}
                    </nav>

                    <div className="p-4 mt-auto border-t border-white/5 bg-[#14141c]/30">
                      {isAuthenticated && user ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 px-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 to-violet-600 flex items-center justify-center text-white font-bold border border-white/10 shadow-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white leading-none">
                                {user.name}
                              </span>
                              <span className="text-xs text-white/40 font-medium mt-1">
                                {user.nickname ? `@${user.nickname}` : user.email}
                              </span>
                            </div>
                          </div>
                          <Separator className="bg-white/5" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors"
                          >
                            <LogOut className="w-4.5 h-4.5" />
                            Sair da conta
                          </button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleLogin}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl h-12 shadow-lg shadow-purple-900/20"
                        >
                          <LogIn className="w-4.5 h-4.5 mr-2" />
                          Fazer Login
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Botão Discreto de Listas (Quick Access) */}
            <button
              onClick={() => router.push("/listas")}
              title="Minhas Listas Personalizadas"
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 group border",
                pathname.startsWith("/listas")
                  ? "bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                  : "bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.08] border-white/10"
              )}
            >
              <FolderHeart className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Listas</span>
            </button>

            {/* Divisor */}
            <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

            {/* Ações Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {user?.role === "ADMIN" && (
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      Admin
                    </Badge>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 transition-all duration-200 hover:scale-[1.02]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </button>
              )}
            </div>

            {/* Mobile User Icon (if not in menu) - Optional but good for UX */}
            {!isAuthenticated && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogin}
                className="sm:hidden text-white/70 hover:text-white hover:bg-white/5 rounded-xl"
              >
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
