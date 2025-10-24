import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Film, Tv, Star, Home, LogOut, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import AuthService from "../lib/auth";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { User } from "../lib/types";

interface NavigationProps {
  title: string;
  showBackButton?: boolean;
}

export function Navigation({ title, showBackButton = true }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = AuthService.getCurrentUser();
    setUser(userData);
  }, []);

  const handleLogout = () => {
    toast.success("Logout realizado com sucesso!", {
      description: "Até logo!",
    });

    // Delay para mostrar a notificação antes do redirecionamento
    setTimeout(() => {
      AuthService.logout();
    }, 1000);
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard",
    },
    {
      name: "Filmes",
      href: "/movies",
      icon: Film,
      current: pathname === "/movies",
    },
    {
      name: "Séries",
      href: "/series",
      icon: Tv,
      current: pathname === "/series",
    },
    {
      name: "Minhas Avaliações",
      href: "/ratings",
      icon: Star,
      current: pathname === "/ratings",
    },
    {
      name: "Favoritos",
      href: "/favorites",
      icon: Heart,
      current: pathname === "/favorites",
    },
  ];

  const isDashboard = pathname === "/dashboard";

  return (
    <header className="bg-gray-800 !border-gray-900 border-b-2 border-0 drop-shadow-lg drop-shadow-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-50">
                {title}
              </h1>
              {isDashboard && user && (
                <p className="text-xs sm:text-sm text-slate-400">
                  Bem-vindo, {user.name} (@{user.nickname})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navegação horizontal - Hidden on mobile, shown on larger screens */}
            <nav className="hidden lg:flex space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={item.current ? "default" : "ghost"}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "flex items-center space-x-2 text-sm",
                      item.current
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-slate-400 hover:text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Button>
                );
              })}
            </nav>

            {/* Mobile Navigation - Dropdown menu for smaller screens */}
            <div className="lg:hidden">
              <select
                onChange={(e) => router.push(e.target.value)}
                value={pathname}
                className="bg-slate-700 border border-slate-600 text-slate-300 rounded-md px-3 py-1 text-sm"
              >
                {navigationItems.map((item) => (
                  <option key={item.href} value={item.href}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Badge de Admin e botão de logout */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {user?.role === "ADMIN" && (
                <span className="bg-blue-900 text-blue-200 text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded">
                  Admin
                </span>
              )}
              <Button
                variant="destructive"
                onClick={handleLogout}
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2 text-sm px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
