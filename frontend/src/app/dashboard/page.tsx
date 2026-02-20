"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthService from "../../lib/auth";
import {
  favoriteMoviesApi,
  favoriteSeriesApi,
  ratingMoviesApi,
  ratingSeriesApi,
} from "../../lib/api";
import { User } from "../../lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Tv, Heart, Star, TrendingUp, LucideIcon } from "lucide-react";

type CardColor = "blue" | "green" | "yellow" | "pink";

interface NavigationCardData {
  title: string;
  description: string;
  Icon: LucideIcon;
  color: CardColor;
  buttonText: string;
  href: string;
}

const navigationCardData: NavigationCardData[] = [
  {
    title: "Filmes",
    description: "Descobrir e avaliar",
    Icon: Film,
    color: "blue",
    buttonText: "Explorar filmes",
    href: "/movies",
  },
  {
    title: "Séries",
    description: "Maratonar e avaliar",
    Icon: Tv,
    color: "green",
    buttonText: "Explorar séries",
    href: "/series",
  },
  {
    title: "Avaliações",
    description: "Suas classificações",
    Icon: Star,
    color: "yellow",
    buttonText: "Ver avaliações",
    href: "/ratings",
  },
  {
    title: "Favoritos",
    description: "Sua lista especial",
    Icon: Heart,
    color: "pink",
    buttonText: "Ver favoritos",
    href: "/favorites",
  },
];

const colorClasses: Record<
  CardColor,
  {
    bg: string;
    hoverBg: string;
    text: string;
    border: string;
  }
> = {
  blue: {
    bg: "bg-blue-500/10",
    hoverBg: "group-hover:bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  green: {
    bg: "bg-green-500/10",
    hoverBg: "group-hover:bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/20",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    hoverBg: "group-hover:bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
  },
  pink: {
    bg: "bg-pink-500/10",
    hoverBg: "group-hover:bg-pink-500/20",
    text: "text-pink-400",
    border: "border-pink-500/20",
  },
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState({
    totalMovieRatings: 0,
    totalSerieRatings: 0,
    totalFavoriteMovies: 0,
    totalFavoriteSeries: 0,
    averageMovieRating: 0,
    averageSerieRating: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      const userData = AuthService.getUser();
      setUser(userData);
      loadStatistics();
    }
  }, []);

  const loadStatistics = async () => {
    setLoadingStats(true);
    try {
      const [favoriteMovies, favoriteSeries, movieRatings, serieRatings] =
        await Promise.all([
          favoriteMoviesApi.getFavoriteMovies().catch(() => []),
          favoriteSeriesApi.getFavoriteSeries().catch(() => []),
          ratingMoviesApi.getRatedMovies().catch(() => []),
          ratingSeriesApi.getRatedSeries().catch(() => []),
        ]);

      const avgMovieRating =
        movieRatings.length > 0
          ? movieRatings.reduce(
              (sum: number, rating: any) => sum + parseFloat(rating.myVote),
              0,
            ) / movieRatings.length
          : 0;

      const avgSerieRating =
        serieRatings.length > 0
          ? serieRatings.reduce(
              (sum: number, rating: any) => sum + parseFloat(rating.myVote),
              0,
            ) / serieRatings.length
          : 0;

      setStatistics({
        totalMovieRatings: movieRatings.length,
        totalSerieRatings: serieRatings.length,
        totalFavoriteMovies: favoriteMovies.length,
        totalFavoriteSeries: favoriteSeries.length,
        averageMovieRating: avgMovieRating,
        averageSerieRating: avgSerieRating,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen ">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 ">
          {navigationCardData.map((card) => {
            const colors = colorClasses[card.color];
            const { Icon } = card;

            return (
              <Card
                key={card.title}
                className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950"
              >
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${colors.bg} ${colors.hoverBg}`}
                    >
                      <Icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg text-white">
                        {card.title}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {card.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => router.push(card.href)}
                    className={`w-full text-sm ${colors.bg} ${colors.hoverBg} ${colors.text} ${colors.border} border-0`}
                    variant="outline"
                    size="sm"
                  >
                    {card.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Statistics Section */}
        <div className="mb-8">
          {/* Condicional: Mostrar estatísticas detalhadas ou card "Começar agora" */}
          {!loadingStats &&
          statistics.totalMovieRatings + statistics.totalSerieRatings > 0 ? (
            <Card className="lg:col-span-2 bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>Estatísticas Detalhadas</span>
                </CardTitle>
                <CardDescription>
                  Seus dados de avaliações e favoritos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Seção Filmes */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white flex items-center space-x-2">
                      <Film className="w-4 h-4 text-blue-400" />
                      <span>Filmes</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Avaliações</span>
                        <span className="text-blue-400 font-semibold">
                          {statistics.totalMovieRatings}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Favoritos</span>
                        <span className="text-pink-400 font-semibold">
                          {statistics.totalFavoriteMovies}
                        </span>
                      </div>
                      {statistics.totalMovieRatings > 0 && (
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Média</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-yellow-400 font-semibold">
                              {statistics.averageMovieRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção Séries */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-white flex items-center space-x-2">
                      <Tv className="w-4 h-4 text-green-400" />
                      <span>Séries</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Avaliações</span>
                        <span className="text-green-400 font-semibold">
                          {statistics.totalSerieRatings}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Favoritos</span>
                        <span className="text-pink-400 font-semibold">
                          {statistics.totalFavoriteSeries}
                        </span>
                      </div>
                      {statistics.totalSerieRatings > 0 && (
                        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                          <span className="text-slate-300">Média</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-yellow-400 font-semibold">
                              {statistics.averageSerieRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-2 bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950">
              <CardHeader>
                <CardTitle className="text-white">Começar agora</CardTitle>
                <CardDescription>
                  Que tal começar avaliando alguns dos seus filmes e séries
                  favoritos?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push("/movies")}
                    className="flex-1 cursor-pointer"
                    variant="default"
                  >
                    <Film className="w-4 h-4 mr-2" />
                    Avaliar filmes
                  </Button>
                  <Button
                    onClick={() => router.push("/series")}
                    className="flex-1 cursor-pointer"
                    variant="secondary"
                  >
                    <Tv className="w-4 h-4 mr-2" />
                    Avaliar séries
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
