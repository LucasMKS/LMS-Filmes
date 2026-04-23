"use client";

import { useEffect, useMemo, useState } from "react";
import AuthService from "../../lib/auth";
import { ratingMoviesApi, ratingSeriesApi, moviesApi, seriesApi } from "../../lib/api";
import { RatedMovieResponse, RatedSerieResponse, TmdbMovie, TmdbSerie } from "../../lib/types";
import { MovieCard } from "../../components/MovieCard";
import { SerieCard } from "../../components/SerieCard";
import { MovieDialog } from "../../components/MovieDialog";
import { SerieDialog } from "../../components/SerieDialog";
import { Input } from "@/components/ui/input";
import { Star, Film, Tv, Search, Filter, TrendingUp, X, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

type EnrichedMovie = RatedMovieResponse & { tmdb: TmdbMovie | null };
type EnrichedSerie = RatedSerieResponse & { tmdb: TmdbSerie | null };

const toTmdbMovieFallback = (m: RatedMovieResponse): TmdbMovie => ({
  id: Number.isFinite(Number(m.movieId)) ? Number(m.movieId) : 0,
  title: m.title || "Filme desconhecido",
  original_title: m.title || "Filme desconhecido",
  poster_path: m.posterPath || undefined,
});

const toTmdbSerieFallback = (s: RatedSerieResponse): TmdbSerie => ({
  id: Number.isFinite(Number(s.serieId)) ? Number(s.serieId) : 0,
  name: s.title || "Série desconhecida",
  original_name: s.title || "Série desconhecida",
  poster_path: s.posterPath || undefined,
});

const ratingRange = (filter: string) => {
  if (filter === "9-10") return { min: 9.0, max: 10.0 };
  if (filter === "7-8") return { min: 7.0, max: 8.9 };
  if (filter === "5-6") return { min: 5.0, max: 6.9 };
  if (filter === "0-4") return { min: 0.0, max: 4.9 };
  return { min: undefined, max: undefined };
};

const avg = (values: number[]) => {
  if (values.length === 0) return "0.0";
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
};

export default function RatingsPage() {
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<TmdbSerie | null>(null);
  const [movieDetails, setMovieDetails] = useState<TmdbMovie | null>(null);
  const [serieDetails, setSerieDetails] = useState<TmdbSerie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [isSerieDialogOpen, setIsSerieDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "serie">("all");

  const isAuth = AuthService.isAuthenticated();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const range = useMemo(() => ratingRange(filterRating), [filterRating]);

  const moviesQuery = useInfiniteQuery({
    queryKey: ["ratings", "movies", filterRating, debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const page = await ratingMoviesApi.getRatedMoviesPaged(
        pageParam as number,
        PAGE_SIZE,
        range.min,
        range.max,
        debouncedSearch || undefined,
      );
      const ids = page.content.map((m) => m.movieId);
      const tmdbMap = await moviesApi.getMoviesBatch(ids).catch(() => ({} as Record<string, TmdbMovie>));
      const enriched: EnrichedMovie[] = page.content.map((m) => ({
        ...m,
        tmdb: tmdbMap[m.movieId] ?? null,
      }));
      return { ...page, content: enriched };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: isAuth && typeFilter !== "serie",
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const seriesQuery = useInfiniteQuery({
    queryKey: ["ratings", "series", filterRating, debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      const page = await ratingSeriesApi.getRatedSeriesPaged(
        pageParam as number,
        PAGE_SIZE,
        range.min,
        range.max,
        debouncedSearch || undefined,
      );
      const ids = page.content.map((s) => s.serieId);
      const tmdbMap = await seriesApi.getSeriesBatch(ids).catch(() => ({} as Record<string, TmdbSerie>));
      const enriched: EnrichedSerie[] = page.content.map((s) => ({
        ...s,
        tmdb: tmdbMap[s.serieId] ?? null,
      }));
      return { ...page, content: enriched };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    enabled: isAuth && typeFilter !== "movie",
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const ratedMovies = moviesQuery.data?.pages.flatMap((p) => p.content) ?? [];
  const ratedSeries = seriesQuery.data?.pages.flatMap((p) => p.content) ?? [];

  const visibleMovies = typeFilter === "serie" ? [] : ratedMovies;
  const visibleSeries = typeFilter === "movie" ? [] : ratedSeries;
  const totalShown = visibleMovies.length + visibleSeries.length;

  const isInitialLoading =
    (moviesQuery.isLoading && typeFilter !== "serie") ||
    (seriesQuery.isLoading && typeFilter !== "movie");
  const isRefetching =
    (moviesQuery.isFetching && !moviesQuery.isFetchingNextPage && typeFilter !== "serie") ||
    (seriesQuery.isFetching && !seriesQuery.isFetchingNextPage && typeFilter !== "movie");
  const isFetchingMore = moviesQuery.isFetchingNextPage || seriesQuery.isFetchingNextPage;
  const hasMore =
    (moviesQuery.hasNextPage && typeFilter !== "serie") ||
    (seriesQuery.hasNextPage && typeFilter !== "movie");

  const isSearchActive = debouncedSearch.length > 0 || filterRating !== "all" || typeFilter !== "all";

  const handleLoadMore = () => {
    if (moviesQuery.hasNextPage && typeFilter !== "serie") moviesQuery.fetchNextPage();
    if (seriesQuery.hasNextPage && typeFilter !== "movie") seriesQuery.fetchNextPage();
  };

  const handleMovieClick = async (item: EnrichedMovie) => {
    const movieForDialog = item.tmdb ?? toTmdbMovieFallback(item);
    setSelectedMovie(movieForDialog);
    setIsMovieDialogOpen(true);
    try {
      setMovieDetails(await moviesApi.getMovieDetails(item.movieId));
    } catch {
      setMovieDetails(null);
    }
  };

  const handleSerieClick = async (item: EnrichedSerie) => {
    const serieForDialog = item.tmdb ?? toTmdbSerieFallback(item);
    setSelectedSerie(serieForDialog);
    setIsSerieDialogOpen(true);
    try {
      setSerieDetails(await seriesApi.getSerieDetails(item.serieId));
    } catch {
      setSerieDetails(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterRating("all");
    setTypeFilter("all");
  };

  const stats = useMemo(() => {
    const movieRatings = visibleMovies.map((m) => Number(m.rating)).filter((r) => !isNaN(r));
    const serieRatings = visibleSeries.map((s) => Number(s.rating)).filter((r) => !isNaN(r));
    return {
      avgMovie: avg(movieRatings),
      avgSerie: avg(serieRatings),
      avgAll: avg([...movieRatings, ...serieRatings]),
    };
  }, [visibleMovies, visibleSeries]);

  const tabBtn = (active: boolean, activeColor: string) =>
    cn(
      "flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border",
      active
        ? `${activeColor} border-current/20`
        : "text-white/35 hover:text-white/60 hover:bg-white/5 border-transparent",
    );

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Star className="w-6 h-6 text-amber-400 fill-current/30" />
            Minhas Avaliações
          </h2>
          <p className="text-white/35 mt-1.5 text-sm">
            Todo o seu histórico de opiniões e notas sobre o que você já assistiu.
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8 bg-[#14141c] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
              <Input
                placeholder="Buscar pelo nome do filme ou série..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0f]/60 border-white/10 text-white/80 placeholder:text-white/25 pl-10 pr-10 h-11 rounded-xl focus-visible:ring-amber-500/30 focus-visible:border-amber-500/40"
              />
              {(isRefetching || isFetchingMore) && (
                <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400/70 animate-spin pointer-events-none" />
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative w-full sm:w-auto min-w-[180px]">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60 pointer-events-none" />
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="w-full h-11 pl-9 pr-8 bg-[#0a0a0f]/60 border border-white/10 text-white/70 text-sm rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/40 appearance-none cursor-pointer outline-none transition-all"
                >
                  <option value="all" className="bg-[#14141c]">Todas as Notas</option>
                  <option value="9-10" className="bg-[#14141c]">Obras-primas (9 - 10)</option>
                  <option value="7-8" className="bg-[#14141c]">Muito Bons (7 - 8.9)</option>
                  <option value="5-6" className="bg-[#14141c]">Medianos (5 - 6.9)</option>
                  <option value="0-4" className="bg-[#14141c]">Não Gostei (0 - 4.9)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
              </div>

              <div className="flex gap-1.5 bg-[#0a0a0f]/60 p-1.5 rounded-xl border border-white/[0.06] overflow-x-auto shrink-0">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={tabBtn(typeFilter === "all", "bg-white/10 text-white/80")}
                >
                  Todos
                </button>
                <button
                  onClick={() => setTypeFilter("movie")}
                  className={tabBtn(typeFilter === "movie", "bg-purple-500/15 text-purple-300 border-purple-500/20")}
                >
                  <Film className="w-3.5 h-3.5" /> Filmes
                </button>
                <button
                  onClick={() => setTypeFilter("serie")}
                  className={tabBtn(typeFilter === "serie", "bg-violet-500/15 text-violet-300 border-violet-500/20")}
                >
                  <Tv className="w-3.5 h-3.5" /> Séries
                </button>
              </div>
            </div>
          </div>

          {isSearchActive && (
            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-white/[0.05]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                <Filter className="w-3 h-3" /> Filtrado
              </span>
              <span className="text-white/30 text-sm">
                {totalShown} resultado{totalShown !== 1 ? "s" : ""}
              </span>
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            </div>
          )}
        </div>

        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-[#14141c]/40 rounded-2xl border border-white/[0.06]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4" />
            <p className="text-white/35 text-sm">Buscando o seu histórico de avaliações...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Exibindo", value: totalShown, Icon: Star, color: "text-white/30" },
                { label: "Média da Busca", value: stats.avgAll, Icon: TrendingUp, color: "text-amber-400", valueClass: "text-amber-400" },
                { label: "Filmes", value: visibleMovies.length, Icon: Film, color: "text-purple-400", sub: `Média: ${stats.avgMovie}` },
                { label: "Séries", value: visibleSeries.length, Icon: Tv, color: "text-violet-400", sub: `Média: ${stats.avgSerie}` },
              ].map(({ label, value, Icon, color, valueClass, sub }) => (
                <div key={label} className="bg-[#14141c] border border-white/[0.06] rounded-2xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-white/30">{label}</p>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className={cn("text-2xl font-bold text-white", valueClass)}>{value}</p>
                  {sub && <p className="text-xs text-white/25 mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>

            {totalShown === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#14141c]/40 rounded-2xl border border-white/[0.06] border-dashed">
                <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-4">
                  <Star className="w-7 h-7 text-white/15" />
                </div>
                <h3 className="text-lg font-bold text-white/50 mb-2">
                  {isSearchActive ? "Nenhum resultado" : "Você ainda não avaliou nada"}
                </h3>
                <p className="text-white/25 text-center max-w-md text-sm">
                  {isSearchActive
                    ? "Tente outro termo, mudar o filtro de nota ou trocar de categoria."
                    : "Vá até a aba de Filmes ou Séries e comece a dar notas!"}
                </p>
                {isSearchActive && (
                  <button
                    onClick={clearFilters}
                    className="mt-5 px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 text-sm transition-all"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 mb-10 transition-opacity duration-200",
                  isRefetching && "opacity-60",
                )}
              >
                {visibleMovies.map((m) => (
                  <MovieCard
                    key={`movie-${m.id}`}
                    movie={m.tmdb ?? toTmdbMovieFallback(m)}
                    onClick={() => handleMovieClick(m)}
                    userRating={{ rating: String(m.rating), comment: m.comment }}
                  />
                ))}
                {visibleSeries.map((s) => (
                  <SerieCard
                    key={`serie-${s.id}`}
                    serie={s.tmdb ?? toTmdbSerieFallback(s)}
                    onClick={() => handleSerieClick(s)}
                    userRating={{ rating: String(s.rating), comment: s.comment }}
                  />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center pb-12">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetchingMore}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-[#14141c] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-[#1a1a26] hover:border-amber-500/20 disabled:opacity-40 text-sm font-medium transition-all duration-200"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar Mais Histórico"
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {selectedMovie && (
          <MovieDialog
            movie={selectedMovie}
            movieDetails={movieDetails}
            isOpen={isMovieDialogOpen}
            onClose={() => setIsMovieDialogOpen(false)}
            isLoggedIn
          />
        )}
        {selectedSerie && (
          <SerieDialog
            isOpen={isSerieDialogOpen}
            onClose={() => setIsSerieDialogOpen(false)}
            serie={selectedSerie}
            serieDetails={serieDetails}
            isLoggedIn
          />
        )}
      </main>
    </div>
  );
}
