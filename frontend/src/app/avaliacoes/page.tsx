"use client";

import { useState } from "react";
import { toast } from "sonner";
import AuthService from "../../lib/auth";
import { ratingMoviesApi, ratingSeriesApi, moviesApi, seriesApi } from "../../lib/api";
import { Movie, Serie, TmdbMovie, TmdbSerie } from "../../lib/types";
import { MovieCard } from "../../components/MovieCard";
import { SerieCard } from "../../components/SerieCard";
import { MovieDialog } from "../../components/MovieDialog";
import { SerieDialog } from "../../components/SerieDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, Film, Tv, Search, Filter, TrendingUp, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";

interface RatedMovie extends Movie { tmdbData?: TmdbMovie; }
interface RatedSerie extends Serie { tmdbData?: TmdbSerie; }

const MAX_CONCURRENT_DETAILS = 6;
const DETAIL_RETRY_COUNT = 2;
const DETAIL_RETRY_DELAY_MS = 500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async <T,>(fetcher: () => Promise<T>, retries: number): Promise<T> => {
  try { return await fetcher(); }
  catch (error) {
    if (retries <= 0) throw error;
    await sleep(DETAIL_RETRY_DELAY_MS);
    return fetchWithRetry(fetcher, retries - 1);
  }
};

const mapWithConcurrency = async <T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let index = 0;
  const runWorker = async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runWorker));
  return results;
};

const buildFallbackMovie = (movie: Movie): TmdbMovie => ({
  id: Number.isFinite(Number(movie.movieId)) ? Number(movie.movieId) : 0,
  title: movie.title || "Filme desconhecido",
  original_title: movie.title || "Filme desconhecido",
  poster_path: movie.poster_path || undefined,
  release_date: undefined,
  vote_average: Number(movie.rating) || undefined,
});

const buildFallbackSerie = (serie: Serie): TmdbSerie => ({
  id: Number.isFinite(Number(serie.serieId)) ? Number(serie.serieId) : 0,
  name: serie.title || "Serie desconhecida",
  original_name: serie.title || "Serie desconhecida",
  poster_path: serie.poster_path || undefined,
  first_air_date: undefined,
  vote_average: Number(serie.rating) || undefined,
});

export default function RatingsPage() {
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<TmdbSerie | null>(null);
  const [movieDetails, setMovieDetails] = useState<TmdbMovie | null>(null);
  const [serieDetails, setSerieDetails] = useState<TmdbSerie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [isSerieDialogOpen, setIsSerieDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "serie">("all");
  const isAuth = AuthService.isAuthenticated();

  const getRatingRange = () => {
    if (filterRating === "9-10") return { min: 9.0, max: 10.0 };
    if (filterRating === "7-8") return { min: 7.0, max: 8.9 };
    if (filterRating === "5-6") return { min: 5.0, max: 6.9 };
    if (filterRating === "0-4") return { min: 0.0, max: 4.9 };
    return { min: undefined, max: undefined };
  };

  const { data: moviesData, fetchNextPage: fetchNextMovies, hasNextPage: hasNextMovies, isFetchingNextPage: isFetchingNextMovies, isLoading: isLoadingMovies } = useInfiniteQuery({
    queryKey: ["ratings", "movies", filterRating],
    queryFn: async ({ pageParam = 0 }) => {
      const { min, max } = getRatingRange();
      const response = await ratingMoviesApi.getRatedMoviesPaged(pageParam, 20, min, max);
      const enriched = await mapWithConcurrency(response.content || [], MAX_CONCURRENT_DETAILS, async (m: Movie) => {
        if (!m.movieId) return { ...m, tmdbData: buildFallbackMovie(m) };
        try { return { ...m, tmdbData: await fetchWithRetry(() => moviesApi.getMovieDetails(m.movieId), DETAIL_RETRY_COUNT) }; }
        catch { return { ...m, tmdbData: buildFallbackMovie(m) }; }
      });
      return { content: enriched, last: response.last, page: pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.page + 1,
    enabled: isAuth,
  });

  const { data: seriesData, fetchNextPage: fetchNextSeries, hasNextPage: hasNextSeries, isFetchingNextPage: isFetchingNextSeries, isLoading: isLoadingSeries } = useInfiniteQuery({
    queryKey: ["ratings", "series", filterRating],
    queryFn: async ({ pageParam = 0 }) => {
      const { min, max } = getRatingRange();
      const response = await ratingSeriesApi.getRatedSeriesPaged(pageParam, 20, min, max);
      const enriched = await mapWithConcurrency(response.content || [], MAX_CONCURRENT_DETAILS, async (s: Serie) => {
        if (!s.serieId) return { ...s, tmdbData: buildFallbackSerie(s) };
        try { return { ...s, tmdbData: await fetchWithRetry(() => seriesApi.getSerieDetails(s.serieId), DETAIL_RETRY_COUNT) }; }
        catch { return { ...s, tmdbData: buildFallbackSerie(s) }; }
      });
      return { content: enriched, last: response.last, page: pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.page + 1,
    enabled: isAuth,
  });

  const ratedMovies = moviesData?.pages.flatMap((p) => p.content) || [];
  const ratedSeries = seriesData?.pages.flatMap((p) => p.content) || [];
  const isLoading = isLoadingMovies || isLoadingSeries;
  const isFetchingMore = isFetchingNextMovies || isFetchingNextSeries;
  const hasMore = hasNextMovies || hasNextSeries;

  const handleLoadMore = () => { if (hasNextMovies) fetchNextMovies(); if (hasNextSeries) fetchNextSeries(); };

  const handleMovieClick = async (movie: RatedMovie) => {
    if (movie.tmdbData) {
      setSelectedMovie(movie.tmdbData);
      try { setMovieDetails(await moviesApi.getMovieDetails(String(movie.tmdbData.id))); } catch { setMovieDetails(null); }
      setIsMovieDialogOpen(true);
    }
  };

  const handleSerieClick = async (serie: RatedSerie) => {
    if (serie.tmdbData) {
      setSelectedSerie(serie.tmdbData);
      try { setSerieDetails(await seriesApi.getSerieDetails(String(serie.tmdbData.id))); } catch { setSerieDetails(null); }
      setIsSerieDialogOpen(true);
    }
  };

  const clearSearch = () => { setSearchQuery(""); setFilterRating("all"); setTypeFilter("all"); };

  const filterItemsLocally = (items: any[], searchTerm: string, itemType: "movie" | "serie") =>
    items.filter((item) => {
      const matchesSearch = !searchTerm || item.tmdbData?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || item.tmdbData?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch && (typeFilter === "all" || typeFilter === itemType);
    });

  const getAverageRating = (items: (RatedMovie | RatedSerie)[]) => {
    const valid = items.filter((i) => i.rating !== undefined && i.rating !== null && !isNaN(Number(i.rating)));
    if (valid.length === 0) return "0.0";
    return (valid.reduce((acc, i) => acc + Number(i.rating), 0) / valid.length).toFixed(1);
  };

  const stats = {
    totalMovies: ratedMovies.length,
    totalSeries: ratedSeries.length,
    totalItems: ratedMovies.length + ratedSeries.length,
    avgMovieRating: getAverageRating(ratedMovies),
    avgSerieRating: getAverageRating(ratedSeries),
    avgOverall: getAverageRating([...ratedMovies, ...ratedSeries]),
  };

  const filteredMovies = filterItemsLocally(ratedMovies, searchQuery, "movie");
  const filteredSeries = filterItemsLocally(ratedSeries, searchQuery, "serie");

  const tabBtn = (active: boolean, color: string, activeColor: string) =>
    cn("flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border",
      active ? `${activeColor} border-current/20` : "text-white/35 hover:text-white/60 hover:bg-white/5 border-transparent");

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        <div className="mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Star className="w-6 h-6 text-amber-400 fill-current/30" />
            Minhas Avaliações
          </h2>
          <p className="text-white/35 mt-1.5 text-sm">Todo o seu histórico de opiniões e notas sobre o que você já assistiu.</p>
        </div>

        {/* Filtros */}
        <div className="mb-8 bg-[#14141c] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <Input
                placeholder="Buscar pelo nome do filme ou série..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0f]/60 border-white/10 text-white/80 placeholder:text-white/25 pl-10 pr-10 h-11 rounded-xl focus-visible:ring-amber-500/30 focus-visible:border-amber-500/40"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative w-full sm:w-auto min-w-[180px]">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/60" />
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
                <button onClick={() => setTypeFilter("all")} className={tabBtn(typeFilter === "all", "", "bg-white/10 text-white/80")}>Todos</button>
                <button onClick={() => setTypeFilter("movie")} className={tabBtn(typeFilter === "movie", "text-purple-400", "bg-purple-500/15 text-purple-300 border-purple-500/20")}>
                  <Film className="w-3.5 h-3.5" /> Filmes
                </button>
                <button onClick={() => setTypeFilter("serie")} className={tabBtn(typeFilter === "serie", "text-violet-400", "bg-violet-500/15 text-violet-300 border-violet-500/20")}>
                  <Tv className="w-3.5 h-3.5" /> Séries
                </button>
              </div>
            </div>
          </div>

          {(searchQuery || filterRating !== "all" || typeFilter !== "all") && (
            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-white/[0.05]">
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                <Filter className="w-3 h-3 mr-1.5" /> Filtrado
              </Badge>
              <span className="text-white/30 text-sm">{filteredMovies.length + filteredSeries.length} resultados encontrados</span>
              <button onClick={clearSearch} className="ml-auto flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors">
                <X className="w-3 h-3" /> Limpar
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-[#14141c]/40 rounded-2xl border border-white/[0.06]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
            <p className="text-white/35 text-sm">Buscando o seu histórico de avaliações...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Exibindo", value: stats.totalItems, icon: Star, color: "text-white/30" },
                { label: "Média da Busca", value: stats.avgOverall, icon: TrendingUp, color: "text-amber-400", valueClass: "text-amber-400" },
                { label: "Filmes", value: `${stats.totalMovies}`, icon: Film, color: "text-purple-400", sub: `Média: ${stats.avgMovieRating}` },
                { label: "Séries", value: `${stats.totalSeries}`, icon: Tv, color: "text-violet-400", sub: `Média: ${stats.avgSerieRating}` },
              ].map(({ label, value, icon: Icon, color, valueClass, sub }) => (
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

            {filteredMovies.length === 0 && filteredSeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#14141c]/40 rounded-2xl border border-white/[0.06] border-dashed">
                <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-4">
                  <Star className="w-7 h-7 text-white/15" />
                </div>
                <h3 className="text-lg font-bold text-white/50 mb-2">
                  {searchQuery || filterRating !== "all" || typeFilter !== "all" ? "Nenhum resultado para o filtro" : "Você ainda não avaliou nada"}
                </h3>
                <p className="text-white/25 text-center max-w-md text-sm">
                  {searchQuery || filterRating !== "all" || typeFilter !== "all"
                    ? "Tente limpar a sua busca ou trocar de categoria."
                    : "Vá até a aba de Filmes ou Séries e comece a dar notas!"}
                </p>
                {(searchQuery || filterRating !== "all" || typeFilter !== "all") && (
                  <button onClick={clearSearch} className="mt-5 px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 text-sm transition-all">
                    Limpar Filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 mb-10">
                {[
                  ...filteredMovies.map((m) => ({ type: "movie" as const, item: m, key: `movie-${m.id}` })),
                  ...filteredSeries.map((s) => ({ type: "serie" as const, item: s, key: `serie-${s.id}` })),
                ].map(({ type, item, key }) => (
                  <div key={key}>
                    {type === "movie" && item.tmdbData && (
                      <MovieCard movie={item.tmdbData} onClick={() => handleMovieClick(item)} userRating={{ rating: String(item.rating), comment: item.comment }} />
                    )}
                    {type === "serie" && item.tmdbData && (
                      <SerieCard serie={item.tmdbData} onClick={() => handleSerieClick(item)} userRating={{ rating: String(item.rating), comment: item.comment }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {hasMore && !isLoading && (
              <div className="flex justify-center pb-12">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetchingMore}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-[#14141c] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-[#1a1a26] hover:border-amber-500/20 disabled:opacity-40 text-sm font-medium transition-all duration-200"
                >
                  {isFetchingMore ? (
                    <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/40"></div>Carregando...</>
                  ) : "Carregar Mais Histórico"}
                </button>
              </div>
            )}
          </>
        )}

        {selectedMovie && (
          <MovieDialog movie={selectedMovie} movieDetails={movieDetails} isOpen={isMovieDialogOpen} onClose={() => setIsMovieDialogOpen(false)} isLoggedIn={true} />
        )}
        {selectedSerie && (
          <SerieDialog isOpen={isSerieDialogOpen} onClose={() => setIsSerieDialogOpen(false)} serie={selectedSerie} serieDetails={serieDetails} isLoggedIn={true} />
        )}
      </main>
    </div>
  );
}
