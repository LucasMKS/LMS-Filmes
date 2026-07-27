"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MovieDialog } from "@/components/MovieDialog";
import { SerieDialog } from "@/components/SerieDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Star,
  Film,
  Tv,
  ListVideo,
  FolderHeart,
  Sparkles,
  Award,
  MessageSquare,
  Clock,
  PieChart as PieChartIcon,
  User as UserIcon,
  Flame,
} from "lucide-react";
import {
  ratingMoviesApi,
  ratingSeriesApi,
  watchlistMoviesApi,
  watchlistSeriesApi,
  moviesApi,
  seriesApi,
} from "@/lib/api";
import { getUserLists } from "@/lib/userLists";
import AuthService from "@/lib/auth";
import {
  RatedMovieResponse,
  RatedSerieResponse,
  TmdbMovie,
  TmdbSerie,
  User,
} from "@/lib/types";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  tmdbId: string;
  type: "movie" | "serie";
  title: string;
  rating: number;
  comment?: string;
  posterPath: string | null;
  createdAt: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Raw Stats Data
  const [ratedMovies, setRatedMovies] = useState<RatedMovieResponse[]>([]);
  const [ratedSeries, setRatedSeries] = useState<RatedSerieResponse[]>([]);
  const [tmdbMoviesMap, setTmdbMoviesMap] = useState<Record<string, TmdbMovie>>({});
  const [tmdbSeriesMap, setTmdbSeriesMap] = useState<Record<string, TmdbSerie>>({});
  const [watchlistMoviesCount, setWatchlistMoviesCount] = useState(0);
  const [watchlistSeriesCount, setWatchlistSeriesCount] = useState(0);
  const [customListsCount, setCustomListsCount] = useState(0);
  const [customListItemsCount, setCustomListItemsCount] = useState(0);

  // Selected Item Dialogs
  const [selectedMovie, setSelectedMovie] = useState<{ tmdb: TmdbMovie; details: TmdbMovie | null } | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<{ tmdb: TmdbSerie; details: TmdbSerie | null } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const currentUser = AuthService.getUser();
    setUser(currentUser);

    if (!currentUser) {
      setLoading(false);
      return;
    }

    loadStatistics(currentUser.email);
  }, []);

  const loadStatistics = async (email: string) => {
    setLoading(true);
    try {
      // 1. Buscar filmes e séries avaliados via endpoints paginados do backend de avaliação
      const [moviesRes, seriesRes, watchlistMovies, watchlistSeries] = await Promise.all([
        ratingMoviesApi.getRatedMoviesPaged(0, 100).catch(() => ({ content: [] })),
        ratingSeriesApi.getRatedSeriesPaged(0, 100).catch(() => ({ content: [] })),
        watchlistMoviesApi.getWatchlistMovies().catch(() => []),
        watchlistSeriesApi.getWatchlistSeries().catch(() => []),
      ]);

      const moviesList = moviesRes?.content || [];
      const seriesList = seriesRes?.content || [];

      // 2. Buscar lote TMDB para obter os gêneros e posters corretos
      const movieIds = moviesList.map((m) => String(m.movieId));
      const serieIds = seriesList.map((s) => String(s.serieId));

      const [movieDetailsMap, serieDetailsMap] = await Promise.all([
        moviesApi.getMoviesBatch(movieIds).catch(() => ({} as Record<string, TmdbMovie>)),
        seriesApi.getSeriesBatch(serieIds).catch(() => ({} as Record<string, TmdbSerie>)),
      ]);

      setRatedMovies(moviesList);
      setRatedSeries(seriesList);
      setTmdbMoviesMap(movieDetailsMap);
      setTmdbSeriesMap(serieDetailsMap);

      setWatchlistMoviesCount(watchlistMovies?.length || 0);
      setWatchlistSeriesCount(watchlistSeries?.length || 0);

      const userLists = getUserLists(email);
      setCustomListsCount(userLists.length);
      const totalItems = userLists.reduce((sum, list) => sum + list.items.length, 0);
      setCustomListItemsCount(totalItems);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  // Calculados
  const totalRatedMovies = ratedMovies.length;
  const totalRatedSeries = ratedSeries.length;
  const totalRatings = totalRatedMovies + totalRatedSeries;

  const sumMovieRatings = ratedMovies.reduce((acc, m) => acc + (m.rating || 0), 0);
  const sumSeriesRatings = ratedSeries.reduce((acc, s) => acc + (s.rating || 0), 0);
  const avgMovieRating = totalRatedMovies > 0 ? (sumMovieRatings / totalRatedMovies).toFixed(1) : "0.0";
  const avgSeriesRating = totalRatedSeries > 0 ? (sumSeriesRatings / totalRatedSeries).toFixed(1) : "0.0";

  const totalSumRatings = sumMovieRatings + sumSeriesRatings;
  const overallAvgRating = totalRatings > 0 ? (totalSumRatings / totalRatings).toFixed(1) : "0.0";

  // Top Gêneros Preferidos
  const genreCounts: Record<string, number> = {};
  ratedMovies.forEach((m) => {
    const tmdb = tmdbMoviesMap[m.movieId];
    tmdb?.genres?.forEach((g) => {
      genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
    });
  });
  ratedSeries.forEach((s) => {
    const tmdb = tmdbSeriesMap[s.serieId];
    tmdb?.genres?.forEach((g) => {
      genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
    });
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxGenreCount = topGenres[0]?.[1] || 1;

  // Fila combinada dos últimos avaliados
  const recentRatings: MediaItem[] = [
    ...ratedMovies.map((m) => {
      const tmdb = tmdbMoviesMap[m.movieId];
      return {
        id: `m_${m.id}`,
        tmdbId: String(m.movieId),
        type: "movie" as const,
        title: m.title || tmdb?.title || "Filme",
        rating: m.rating,
        comment: m.comment,
        posterPath: m.posterPath || tmdb?.poster_path || null,
        createdAt: m.createdAt || new Date().toISOString(),
      };
    }),
    ...ratedSeries.map((s) => {
      const tmdb = tmdbSeriesMap[s.serieId];
      return {
        id: `s_${s.id}`,
        tmdbId: String(s.serieId),
        type: "serie" as const,
        title: s.title || tmdb?.name || "Série",
        rating: s.rating,
        comment: s.comment,
        posterPath: s.posterPath || tmdb?.poster_path || null,
        createdAt: s.createdAt || new Date().toISOString(),
      };
    }),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // Histograma de Votos (1 a 10)
  const ratingCounts: Record<number, number> = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  [...ratedMovies, ...ratedSeries].forEach((item) => {
    const rounded = Math.round(item.rating);
    if (rounded >= 1 && rounded <= 10) {
      ratingCounts[rounded] = (ratingCounts[rounded] || 0) + 1;
    }
  });

  // Nota mais frequente
  let maxCount = 0;
  let mostFrequentRating = 0;
  Object.entries(ratingCounts).forEach(([ratingStr, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentRating = Number(ratingStr);
    }
  });

  // Perfil Cineasta Persona
  const getPersona = () => {
    if (totalRatings === 0) return { title: "Iniciante", desc: "Comece a avaliar títulos para desbloquear seu perfil!" };
    const avgVal = parseFloat(overallAvgRating);
    if (avgVal >= 8.5) return { title: "Espectador Entusiasta 🌟", desc: "Você vê o melhor em quase tudo que assiste e adora se emocionar." };
    if (avgVal >= 7.0) return { title: "Cinéfilo Equilibrado 🎬", desc: "Você sabe apreciar boas produções com critério e bom gosto." };
    if (avgVal >= 5.0) return { title: "Crítico Exigente 🧐", desc: "Suas avaliações são criteriosas. Poucas obras alcançam seu 10." };
    return { title: "O Espectador Implacável ⚡", desc: "Muito difícil de agradar! Apenas verdadeiras obras-primas passam de ano." };
  };

  const persona = getPersona();

  const handleOpenItemDetails = async (item: MediaItem) => {
    try {
      if (item.type === "movie") {
        const details = await moviesApi.getMovieDetails(item.tmdbId).catch(() => null);
        const tmdbData = details || {
          id: Number(item.tmdbId),
          title: item.title,
          original_title: item.title,
          poster_path: item.posterPath,
        };
        setSelectedMovie({ tmdb: tmdbData as TmdbMovie, details });
      } else {
        const details = await seriesApi.getSerieDetails(item.tmdbId).catch(() => null);
        const tmdbData = details || {
          id: Number(item.tmdbId),
          name: item.title,
          original_name: item.title,
          poster_path: item.posterPath,
        };
        setSelectedSerie({ tmdb: tmdbData as TmdbSerie, details });
      }
    } catch (e) {
      console.error("Erro ao carregar item:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-emerald-500/30">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Painel de Estatísticas
              </h1>
              <p className="text-sm text-white/50 font-medium mt-0.5">
                Resumo analítico sobre seus hábitos de cinema, séries e notas.
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3 bg-[#14141c] border border-white/10 px-4 py-2 rounded-2xl">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                <p className="text-[11px] text-emerald-400 font-semibold">{persona.title}</p>
              </div>
            </div>
          )}
        </div>

        {!user ? (
          <div className="mt-12 text-center py-20 bg-[#14141c]/50 border border-dashed border-white/10 rounded-3xl max-w-lg mx-auto space-y-4">
            <UserIcon className="w-12 h-12 text-white/20 mx-auto" />
            <h3 className="text-xl font-bold text-white">Faça login para ver suas estatísticas</h3>
            <p className="text-xs text-white/40 px-6">
              Acompanhe sua média de notas, gêneros preferidos, contagem de filmes assistidos e muito mais.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-900/20"
            >
              Fazer Login
            </button>
          </div>
        ) : loading ? (
          <div className="mt-8 space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-3xl bg-[#14141c]" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-3xl bg-[#14141c]" />
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {/* KPI Cards (Visão Geral de Métricas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card 1: Total Avaliados */}
              <div className="bg-[#14141c] border border-white/[0.08] p-5 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/50">Total Avaliados</span>
                  <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{totalRatings}</span>
                  <span className="text-xs text-white/40 font-medium">títulos</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-white/40">
                  <span className="flex items-center gap-1 text-purple-300">
                    <Film className="w-3 h-3" /> {totalRatedMovies} Filmes
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-violet-300">
                    <Tv className="w-3 h-3" /> {totalRatedSeries} Séries
                  </span>
                </div>
              </div>

              {/* Card 2: Média Geral */}
              <div className="bg-[#14141c] border border-white/[0.08] p-5 rounded-3xl relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/50">Média de Notas</span>
                  <div className="bg-yellow-500/10 p-2 rounded-xl text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{overallAvgRating}</span>
                  <span className="text-xs text-yellow-400/80 font-bold">/ 10 ★</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-white/40">
                  <span>Filmes: <strong className="text-white">{avgMovieRating}</strong></span>
                  <span>•</span>
                  <span>Séries: <strong className="text-white">{avgSeriesRating}</strong></span>
                </div>
              </div>

              {/* Card 3: Watchlist e Séries Acompanhadas */}
              <div className="bg-[#14141c] border border-white/[0.08] p-5 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/50">Em Fila / Acompanhando</span>
                  <div className="bg-blue-500/10 p-2 rounded-xl text-blue-400">
                    <ListVideo className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {watchlistMoviesCount + watchlistSeriesCount}
                  </span>
                  <span className="text-xs text-white/40 font-medium">salvos</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-white/40">
                  <span>Watchlist: <strong className="text-white">{watchlistMoviesCount}</strong></span>
                  <span>•</span>
                  <span>Séries: <strong className="text-white">{watchlistSeriesCount}</strong></span>
                </div>
              </div>

              {/* Card 4: Listas Personalizadas */}
              <div className="bg-[#14141c] border border-white/[0.08] p-5 rounded-3xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/50">Listas Criadas</span>
                  <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400">
                    <FolderHeart className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{customListsCount}</span>
                  <span className="text-xs text-white/40 font-medium">listas</span>
                </div>
                <div className="mt-2 text-[11px] text-white/40">
                  Com <strong className="text-purple-300">{customListItemsCount}</strong> itens organizados
                </div>
              </div>
            </div>

            {/* Banner Perfil de Cineasta */}
            <div className="bg-gradient-to-r from-purple-950/40 via-[#14141c] to-emerald-950/30 border border-purple-500/20 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    Seu Perfil no LMS Filmes
                  </span>
                  <h3 className="text-lg font-bold text-white">{persona.title}</h3>
                  <p className="text-xs text-white/50 font-medium mt-0.5">{persona.desc}</p>
                </div>
              </div>

              {mostFrequentRating > 0 && (
                <div className="bg-black/30 border border-white/10 px-4 py-2.5 rounded-2xl shrink-0 self-stretch sm:self-auto flex items-center justify-between sm:justify-start gap-3">
                  <span className="text-xs text-white/50 font-medium">Nota preferida:</span>
                  <span className="text-sm font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                    ★ {mostFrequentRating}/10 ({maxCount}x)
                  </span>
                </div>
              )}
            </div>

            {/* Grid 3 Seções: Histograma + Gêneros + Últimas Avaliações */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Histograma de Distribuição de Notas */}
              <div className="bg-[#14141c] border border-white/[0.08] p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-emerald-400" />
                    Distribuição de Notas
                  </h2>
                  <span className="text-xs text-white/40 font-medium">1 a 10 ★</span>
                </div>

                <div className="space-y-2.5">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((ratingNum) => {
                    const count = ratingCounts[ratingNum] || 0;
                    const percent = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                    return (
                      <div key={ratingNum} className="flex items-center gap-3 text-xs">
                        <span className="w-8 font-bold text-white/60 text-right">
                          {ratingNum} ★
                        </span>

                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              ratingNum >= 8
                                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                : ratingNum >= 6
                                ? "bg-gradient-to-r from-purple-500 to-violet-400"
                                : "bg-gradient-to-r from-amber-500 to-orange-400"
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <span className="w-10 text-right text-white/40 font-semibold text-[11px]">
                          {count} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gêneros Preferidos */}
              <div className="bg-[#14141c] border border-white/[0.08] p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    Gêneros Mais Avaliados
                  </h2>
                  <span className="text-xs text-white/40 font-medium">Top Gêneros</span>
                </div>

                {topGenres.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs border border-dashed border-white/10 rounded-2xl">
                    Sem dados de gêneros disponíveis ainda.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topGenres.map(([genreName, count], idx) => {
                      const pct = Math.round((count / maxGenreCount) * 100);
                      return (
                        <div key={genreName} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-white flex items-center gap-2">
                              <span className="text-[10px] text-white/40 font-bold w-4">
                                #{idx + 1}
                              </span>
                              {genreName}
                            </span>
                            <span className="text-white/40 text-[11px] font-bold">
                              {count} {count === 1 ? "título" : "títulos"}
                            </span>
                          </div>
                          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-violet-500 to-emerald-400 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fila dos Últimos Votados */}
              <div className="bg-[#14141c] border border-white/[0.08] p-6 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Últimas Avaliações
                  </h2>
                </div>

                {recentRatings.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs border border-dashed border-white/10 rounded-2xl">
                    Você ainda não fez nenhuma avaliação.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentRatings.slice(0, 5).map((item) => {
                      const posterUrl = item.posterPath
                        ? item.posterPath.startsWith("http")
                          ? item.posterPath
                          : `https://image.tmdb.org/t/p/w200${item.posterPath}`
                        : "/placeholder-movie.jpg";

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenItemDetails(item)}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.06] transition-all cursor-pointer group"
                        >
                          <div className="relative w-10 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                            <Image
                              src={posterUrl}
                              alt={item.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded font-semibold border",
                                  item.type === "movie"
                                    ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                                    : "bg-violet-500/10 text-violet-300 border-violet-500/20"
                                )}
                              >
                                {item.type === "movie" ? "Filme" : "Série"}
                              </span>

                              <span className="flex items-center text-[11px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                                <Star className="w-2.5 h-2.5 fill-current mr-1" />
                                {item.rating}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1 mt-1">
                              {item.title}
                            </h4>

                            {item.comment ? (
                              <p className="text-[10px] text-white/40 italic line-clamp-1 mt-0.5 flex items-center gap-1">
                                <MessageSquare className="w-2.5 h-2.5 shrink-0 text-white/30" />
                                "{item.comment}"
                              </p>
                            ) : (
                              <p className="text-[9px] text-white/30 font-medium mt-0.5">
                                {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dialogs de Detalhes de Mídia */}
      {selectedMovie && (
        <MovieDialog
          movie={selectedMovie.tmdb}
          movieDetails={selectedMovie.details}
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          isLoggedIn={!!user}
        />
      )}

      {selectedSerie && (
        <SerieDialog
          serie={selectedSerie.tmdb}
          serieDetails={selectedSerie.details}
          isOpen={!!selectedSerie}
          onClose={() => setSelectedSerie(null)}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
}
