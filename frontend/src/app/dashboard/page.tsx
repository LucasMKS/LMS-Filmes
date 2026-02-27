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
import {
  Film,
  Tv,
  Heart,
  Star,
  TrendingUp,
  Compass,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    const authenticated = AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (!authenticated) {
      router.replace("/login");
      return;
    }

    const userData = AuthService.getUser();
    setUser(userData);
    loadStatistics();
  }, [router]);

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

      const calculateAverage = (items: any[]) => {
        if (!items || !Array.isArray(items) || items.length === 0) return 0;

        let sum = 0;
        let count = 0;

        items.forEach((item) => {
          if (item.rating !== undefined && item.rating !== null) {
            const nota = Number(item.rating);

            if (!isNaN(nota) && nota > 0) {
              sum += nota;
              count++;
            }
          }
        });

        return count > 0 ? sum / count : 0;
      };

      setStatistics({
        totalMovieRatings: movieRatings.length || 0,
        totalSerieRatings: serieRatings.length || 0,
        totalFavoriteMovies: favoriteMovies.length || 0,
        totalFavoriteSeries: favoriteSeries.length || 0,
        averageMovieRating: calculateAverage(movieRatings),
        averageSerieRating: calculateAverage(serieRatings),
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const totalAvaliacoes =
    statistics.totalMovieRatings + statistics.totalSerieRatings;
  const totalFavoritos =
    statistics.totalFavoriteMovies + statistics.totalFavoriteSeries;

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* Header Falso para dar respiro, já que a Navigation é Sticky */}
      <div className="h-6 sm:h-10"></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Seu Resumo
          </h2>
          <p className="text-slate-400 mt-1">
            Acompanhe a sua jornada cinematográfica.
          </p>
        </div>

        {/* =========================================
            CARDS DE MÉTRICAS RÁPIDAS (Top)
            ========================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          <Card
            className="bg-slate-900 border-slate-800 shadow-lg hover:border-blue-500/30 transition-all cursor-pointer group"
            onClick={() => router.push("/filmes")}
          >
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
              <div className="p-3 bg-blue-500/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Film className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">
                {statistics.totalMovieRatings}
              </h3>
              <p className="text-slate-400 text-sm font-medium">
                Filmes Avaliados
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-slate-900 border-slate-800 shadow-lg hover:border-green-500/30 transition-all cursor-pointer group"
            onClick={() => router.push("/series")}
          >
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
              <div className="p-3 bg-green-500/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">
                {statistics.totalSerieRatings}
              </h3>
              <p className="text-slate-400 text-sm font-medium">
                Séries Avaliadas
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-slate-900 border-slate-800 shadow-lg hover:border-pink-500/30 transition-all cursor-pointer group"
            onClick={() => router.push("/favoritos")}
          >
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
              <div className="p-3 bg-pink-500/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-pink-400 fill-current/20" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">
                {totalFavoritos}
              </h3>
              <p className="text-slate-400 text-sm font-medium">
                Títulos Favoritos
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-slate-900 border-slate-800 shadow-lg hover:border-yellow-500/30 transition-all cursor-pointer group"
            onClick={() => router.push("/avaliacoes")}
          >
            <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
              <div className="p-3 bg-yellow-500/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-yellow-400 fill-current/20" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">
                {totalAvaliacoes > 0
                  ? (
                      (statistics.averageMovieRating *
                        statistics.totalMovieRatings +
                        statistics.averageSerieRating *
                          statistics.totalSerieRatings) /
                      totalAvaliacoes
                    ).toFixed(1)
                  : "0.0"}
              </h3>
              <p className="text-slate-400 text-sm font-medium">Média Geral</p>
            </CardContent>
          </Card>
        </div>

        {/* =========================================
            SEÇÃO DE ESTATÍSTICAS DETALHADAS
            ========================================= */}
        <div className="mb-8">
          {loadingStats ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : totalAvaliacoes > 0 || totalFavoritos > 0 ? (
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-800/60 bg-slate-900/50 pb-4">
                <CardTitle className="text-white flex items-center space-x-2 text-xl">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <span>Raio-X do seu Perfil</span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm">
                  Um comparativo direto do seu gosto entre o cinema e a
                  televisão.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                  {/* Lado A: Filmes */}
                  <div className="p-6 sm:p-8 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-blue-500/10 rounded-md">
                        <Film className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Filmes</h3>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-400">
                            Total de Avaliações
                          </span>
                          <span className="text-slate-200 font-semibold">
                            {statistics.totalMovieRatings}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${totalAvaliacoes > 0 ? (statistics.totalMovieRatings / totalAvaliacoes) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-400">
                            Guardados nos Favoritos
                          </span>
                          <span className="text-slate-200 font-semibold">
                            {statistics.totalFavoriteMovies}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className="bg-pink-500 h-2 rounded-full"
                            style={{
                              width: `${totalFavoritos > 0 ? (statistics.totalFavoriteMovies / totalFavoritos) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400 text-sm">
                          Média de Notas
                        </span>
                        <div className="flex items-center space-x-1.5 bg-yellow-500/10 px-3 py-1 rounded-md border border-yellow-500/20">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-yellow-400 font-bold">
                            {statistics.averageMovieRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lado B: Séries */}
                  <div className="p-6 sm:p-8 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-green-500/10 rounded-md">
                        <Tv className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Séries</h3>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-400">
                            Total de Avaliações
                          </span>
                          <span className="text-slate-200 font-semibold">
                            {statistics.totalSerieRatings}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${totalAvaliacoes > 0 ? (statistics.totalSerieRatings / totalAvaliacoes) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-400">
                            Guardados nos Favoritos
                          </span>
                          <span className="text-slate-200 font-semibold">
                            {statistics.totalFavoriteSeries}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className="bg-pink-500 h-2 rounded-full"
                            style={{
                              width: `${totalFavoritos > 0 ? (statistics.totalFavoriteSeries / totalFavoritos) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-slate-400 text-sm">
                          Média de Notas
                        </span>
                        <div className="flex items-center space-x-1.5 bg-yellow-500/10 px-3 py-1 rounded-md border border-yellow-500/20">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-yellow-400 font-bold">
                            {statistics.averageSerieRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-900 to-slate-900 border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-bl-full -mr-10 -mt-10 blur-3xl pointer-events-none" />

              <CardContent className="p-10 flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
                  <Compass className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Sua prateleira está vazia
                </h3>
                <p className="text-slate-400 max-w-md mx-auto mb-8 text-base">
                  O seu perfil ganha vida quando você começa a explorar e dar
                  notas para as suas obras favoritas. Que tal encontrar algo
                  para assistir agora?
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button
                    onClick={() => router.push("/filmes")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12 rounded-xl shadow-lg shadow-blue-900/20"
                  >
                    <Film className="w-5 h-5 mr-2" />
                    Explorar Filmes
                  </Button>
                  <Button
                    onClick={() => router.push("/series")}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 h-12 rounded-xl border border-slate-700 shadow-lg"
                  >
                    <Tv className="w-5 h-5 mr-2 text-green-400" />
                    Explorar Séries
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
