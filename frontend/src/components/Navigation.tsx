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
  BarChart3,
  ChevronDown,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthService, { getUserSlug } from "../lib/auth";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const userSlug = getUserSlug(user);

  const allNavigationItems = [
    {
      name: "Filmes",
      href: "/filmes",
      icon: Film,
      color: "text-purple-400",
      activeBg: "bg-purple-500/10 border-purple-500/20 text-purple-300",
      current: pathname === "/filmes" || (pathname.startsWith("/filmes/") && !pathname.includes("/watchlist") && !pathname.includes("/assistidos") && !pathname.includes("/favoritos")),
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
      name: "Watchlist",
      href: `/filmes/${userSlug}/watchlist`,
      icon: Eye,
      color: "text-blue-400",
      activeBg: "bg-blue-500/10 border-blue-500/20 text-blue-300",
      current: pathname.includes("/watchlist"),
      requiresAuth: true,
    },
    {
      name: "Assistidos",
      href: `/filmes/${userSlug}/assistidos`,
      icon: Star,
      color: "text-amber-400",
      activeBg: "bg-amber-500/10 border-amber-500/20 text-amber-300",
      current: pathname.includes("/assistidos") || pathname === "/avaliacoes",
      requiresAuth: true,
    },
    {
      name: "Favoritos",
      href: `/filmes/${userSlug}/favoritos`,
      icon: Heart,
      color: "text-pink-400",
      activeBg: "bg-pink-500/10 border-pink-500/20 text-pink-300",
      current: pathname.includes("/favoritos"),
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

            {/* Ações Desktop / Dropdown do Usuário */}
            <div className="hidden sm:flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all duration-200"
                  >
                    <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="text-xs font-semibold text-white/90 line-clamp-1 max-w-[100px]">
                      {user.nickname ? `@${user.nickname}` : user.name}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform duration-200", isUserMenuOpen && "rotate-180")} />
                  </button>

                  {/* Dropdown Popover */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#0f0f17]/95 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-2.5 pb-3 border-b border-white/5 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white line-clamp-1">{user.name}</p>
                          {user.role === "ADMIN" && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-semibold border border-purple-500/30">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 line-clamp-1 font-medium">{user.email}</p>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <button
                          onClick={() => {
                            router.push("/estatisticas");
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <BarChart3 className="w-4 h-4 text-emerald-400" />
                          <span>Estatísticas</span>
                        </button>

                        <button
                          onClick={() => {
                            router.push(`/${userSlug}/listas`);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left"
                        >
                          <FolderHeart className="w-4 h-4 text-purple-400" />
                          <span>Minhas Listas</span>
                        </button>

                        <button
                          disabled
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/30 cursor-not-allowed opacity-60 text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Settings className="w-4 h-4" />
                            <span>Configurações</span>
                          </div>
                          <span className="text-[9px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded">Em breve</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-white/5">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sair da conta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
