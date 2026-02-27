"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import AuthService from "../../lib/auth";
import {
  ratingMoviesApi,
  ratingSeriesApi,
  moviesApi,
  seriesApi,
} from "../../lib/api";
import { Movie, Serie, TmdbMovie, TmdbSerie } from "../../lib/types";
import { MovieCard } from "../../components/MovieCard";
import { SerieCard } from "../../components/SerieCard";
import { MovieDialog } from "../../components/MovieDialog";
import { SerieDialog } from "../../components/SerieDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, Film, Tv, Search, Filter, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatedMovie extends Movie {
  tmdbData?: TmdbMovie;
}

interface RatedSerie extends Serie {
  tmdbData?: TmdbSerie;
}

export default function RatingsPage() {
  const [moviePage, setMoviePage] = useState(0);
  const [hasMoreMovies, setHasMoreMovies] = useState(true);
  const [seriePage, setSeriePage] = useState(0);
  const [hasMoreSeries, setHasMoreSeries] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ratedMovies, setRatedMovies] = useState<RatedMovie[]>([]);
  const [ratedSeries, setRatedSeries] = useState<RatedSerie[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<TmdbSerie | null>(null);
  const [movieDetails, setMovieDetails] = useState<TmdbMovie | null>(null);
  const [serieDetails, setSerieDetails] = useState<TmdbSerie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [isSerieDialogOpen, setIsSerieDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "serie">(
    "all",
  );

  const MAX_CONCURRENT_DETAILS = 6;
  const DETAIL_RETRY_COUNT = 2;
  const DETAIL_RETRY_DELAY_MS = 500;

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const mapWithConcurrency = async <T, R>(
    items: T[],
    limit: number,
    mapper: (item: T) => Promise<R>,
  ): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let index = 0;

    const runWorker = async () => {
      while (index < items.length) {
        const currentIndex = index++;
        results[currentIndex] = await mapper(items[currentIndex]);
      }
    };

    const workers = Array.from(
      { length: Math.min(limit, items.length) },
      runWorker,
    );
    await Promise.all(workers);
    return results;
  };

  const fetchWithRetry = async <T,>(
    fetcher: () => Promise<T>,
    retries: number,
  ): Promise<T> => {
    try {
      return await fetcher();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      await sleep(DETAIL_RETRY_DELAY_MS);
      return fetchWithRetry(fetcher, retries - 1);
    }
  };

  const buildFallbackMovie = (movie: Movie): TmdbMovie => {
    const id = Number(movie.movieId);
    return {
      id: Number.isFinite(id) ? id : 0,
      title: movie.title || "Filme desconhecido",
      original_title: movie.title || "Filme desconhecido",
      poster_path: movie.poster_path || undefined,
      release_date: undefined,
      vote_average: Number(movie.rating) || undefined,
    };
  };

  const buildFallbackSerie = (serie: Serie): TmdbSerie => {
    const id = Number(serie.serieId);
    return {
      id: Number.isFinite(id) ? id : 0,
      name: serie.title || "Serie desconhecida",
      original_name: serie.title || "Serie desconhecida",
      poster_path: serie.poster_path || undefined,
      first_air_date: undefined,
      vote_average: Number(serie.rating) || undefined,
    };
  };

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      loadRatings(0, true);
    }
  }, []);

  const loadRatings = async (page: number, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const moviePromise =
        isInitial || hasMoreMovies
          ? ratingMoviesApi.getRatedMoviesPaged(page, 20)
          : Promise.resolve({ content: [], last: true });

      const seriePromise =
        isInitial || hasMoreSeries
          ? ratingSeriesApi.getRatedSeriesPaged(page, 20)
          : Promise.resolve({ content: [], last: true });

      const [moviesRes, seriesRes] = await Promise.all([
        moviePromise,
        seriePromise,
      ]);

      const newMoviesRaw = moviesRes.content || [];
      const newSeriesRaw = seriesRes.content || [];

      const [enrichedMovies, enrichedSeries] = await Promise.all([
        mapWithConcurrency(
          newMoviesRaw,
          MAX_CONCURRENT_DETAILS,
          async (m: Movie) => {
            if (!m.movieId) return { ...m, tmdbData: buildFallbackMovie(m) };
            try {
              const tmdbData = await fetchWithRetry(
                () => moviesApi.getMovieDetails(m.movieId),
                DETAIL_RETRY_COUNT,
              );
              return { ...m, tmdbData };
            } catch (error) {
              return { ...m, tmdbData: buildFallbackMovie(m) };
            }
          },
        ),
        mapWithConcurrency(
          newSeriesRaw,
          MAX_CONCURRENT_DETAILS,
          async (s: Serie) => {
            if (!s.serieId) return { ...s, tmdbData: buildFallbackSerie(s) };
            try {
              const tmdbData = await fetchWithRetry(
                () => seriesApi.getSerieDetails(s.serieId),
                DETAIL_RETRY_COUNT,
              );
              return { ...s, tmdbData };
            } catch (error) {
              return { ...s, tmdbData: buildFallbackSerie(s) };
            }
          },
        ),
      ]);

      if (isInitial) {
        setRatedMovies(enrichedMovies);
        setRatedSeries(enrichedSeries);
      } else {
        setRatedMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = enrichedMovies.filter(
            (m) => !existingIds.has(m.id),
          );
          return [...prev, ...uniqueNew];
        });
        setRatedSeries((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const uniqueNew = enrichedSeries.filter(
            (s) => !existingIds.has(s.id),
          );
          return [...prev, ...uniqueNew];
        });
      }

      setMoviePage(page);
      setSeriePage(page);

      if (isInitial || hasMoreMovies) setHasMoreMovies(!moviesRes.last);
      if (isInitial || hasMoreSeries) setHasMoreSeries(!seriesRes.last);
    } catch (error) {
      console.error("Falha crítica no carregamento:", error);
      toast.error("Erro ao carregar dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore) return;
    const nextPage = Math.max(moviePage, seriePage) + 1;
    if (hasMoreMovies || hasMoreSeries) {
      loadRatings(nextPage);
    }
  };

  const handleMovieClick = async (movie: RatedMovie) => {
    if (movie.tmdbData) {
      setSelectedMovie(movie.tmdbData);
      try {
        const details = await moviesApi.getMovieDetails(
          String(movie.tmdbData.id),
        );
        setMovieDetails(details);
      } catch (error) {
        setMovieDetails(null);
      }
      setIsMovieDialogOpen(true);
    }
  };

  const handleSerieClick = async (serie: RatedSerie) => {
    if (serie.tmdbData) {
      setSelectedSerie(serie.tmdbData);
      try {
        const details = await seriesApi.getSerieDetails(
          String(serie.tmdbData.id),
        );
        setSerieDetails(details);
      } catch (error) {
        setSerieDetails(null);
      }
      setIsSerieDialogOpen(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilterRating(null);
    setTypeFilter("all");
  };

  const filterItems = (
    items: any[],
    searchTerm: string,
    ratingFilter: number | null,
    itemType: "movie" | "serie",
  ) => {
    return items.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.tmdbData?.title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.tmdbData?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const itemRating =
        item.rating !== undefined && item.rating !== null
          ? Number(item.rating)
          : null;
      const matchesRating =
        ratingFilter === null || itemRating === ratingFilter;

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "movie" && itemType === "movie") ||
        (typeFilter === "serie" && itemType === "serie");

      return matchesSearch && matchesRating && matchesType;
    });
  };

  const getAverageRating = (items: (RatedMovie | RatedSerie)[]) => {
    const validItems = items.filter(
      (item) =>
        item.rating !== undefined &&
        item.rating !== null &&
        !isNaN(Number(item.rating)),
    );
    if (validItems.length === 0) return "0.0";
    const sum = validItems.reduce((acc, item) => acc + Number(item.rating), 0);
    return (sum / validItems.length).toFixed(1);
  };

  const getStatistics = () => {
    const totalMovies = ratedMovies.length;
    const totalSeries = ratedSeries.length;
    const totalItems = totalMovies + totalSeries;
    const avgMovieRating = getAverageRating(ratedMovies);
    const avgSerieRating = getAverageRating(ratedSeries);
    const avgOverall = getAverageRating([...ratedMovies, ...ratedSeries]);

    const moviesWithComments = ratedMovies.filter(
      (m) => m.comment && m.comment.trim(),
    ).length;
    const seriesWithComments = ratedSeries.filter(
      (s) => s.comment && s.comment.trim(),
    ).length;

    return {
      totalMovies,
      totalSeries,
      totalItems,
      avgMovieRating,
      avgSerieRating,
      avgOverall,
      moviesWithComments,
      seriesWithComments,
    };
  };

  const stats = getStatistics();
  const filteredMovies = filterItems(
    ratedMovies,
    searchQuery,
    filterRating,
    "movie",
  );
  const filteredSeries = filterItems(
    ratedSeries,
    searchQuery,
    filterRating,
    "serie",
  );

  const ContentGridLoader = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-900/20 rounded-2xl border border-slate-800/50 mt-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
      <p className="text-slate-400 font-medium">
        Buscando o seu histórico de avaliações...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Cabeçalho da Página */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Star className="w-8 h-8 mr-3 text-yellow-500 fill-current/20" />
            Minhas Avaliações
          </h2>
          <p className="text-slate-400 mt-2">
            Todo o seu histórico de opiniões e notas sobre o que você já
            assistiu.
          </p>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-10 bg-slate-900 border-slate-800 shadow-xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-500" />
                </div>
                <Input
                  placeholder="Buscar pelo nome do filme ou série..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 pl-10 pr-10 h-11 rounded-xl focus-visible:ring-yellow-500/30 focus-visible:border-yellow-500"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Filtros de Tipo */}
              <div className="flex gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto shrink-0 hide-scrollbar">
                <Button
                  variant={typeFilter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter("all")}
                  className={cn(
                    "rounded-lg px-4 font-medium transition-all",
                    typeFilter === "all"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  Todos
                </Button>
                <Button
                  variant={typeFilter === "movie" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter("movie")}
                  className={cn(
                    "rounded-lg px-4 font-medium transition-all flex items-center",
                    typeFilter === "movie"
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  <Film className="w-4 h-4 mr-2" />
                  Filmes
                </Button>
                <Button
                  variant={typeFilter === "serie" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTypeFilter("serie")}
                  className={cn(
                    "rounded-lg px-4 font-medium transition-all flex items-center",
                    typeFilter === "serie"
                      ? "bg-green-600/20 text-green-400 border border-green-500/20"
                      : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  <Tv className="w-4 h-4 mr-2" />
                  Séries
                </Button>
              </div>
            </div>

            {(searchQuery || filterRating || typeFilter !== "all") && (
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-800/60">
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  >
                    <Filter className="w-3 h-3 mr-1.5" />
                    Filtrado
                  </Badge>
                  <span className="text-slate-400 text-sm font-medium">
                    {filteredMovies.length + filteredSeries.length} resultados
                    encontrados
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <ContentGridLoader />
        ) : (
          <>
            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-900 border-slate-800 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-400">
                      Total Avaliado
                    </p>
                    <Star className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalItems}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-400">
                      Média Geral
                    </p>
                    <TrendingUp className="w-4 h-4 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {stats.avgOverall}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-400">Filmes</p>
                    <Film className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-white">
                      {stats.totalMovies}
                    </p>
                    <span className="text-xs text-slate-500">
                      Média: {stats.avgMovieRating}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-400">Séries</p>
                    <Tv className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold text-white">
                      {stats.totalSeries}
                    </p>
                    <span className="text-xs text-slate-500">
                      Média: {stats.avgSerieRating}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grid de Resultados */}
            {filteredMovies.length === 0 && filteredSeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">
                  {searchQuery || filterRating || typeFilter !== "all"
                    ? "Nenhum resultado para o filtro"
                    : "Você ainda não avaliou nada"}
                </h3>
                <p className="text-slate-500 text-center max-w-md">
                  {searchQuery || filterRating || typeFilter !== "all"
                    ? "Tente limpar a sua busca ou trocar de categoria para ver outras avaliações."
                    : "Sua prateleira está vazia. Vá até a aba de Filmes ou Séries e comece a dar notas!"}
                </p>
                {(searchQuery || filterRating || typeFilter !== "all") && (
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                    className="mt-6 border-slate-700 text-slate-300"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mb-10">
                {[
                  ...filteredMovies.map((movie) => ({
                    type: "movie" as const,
                    item: movie,
                    key: `movie-${movie.id}`,
                  })),
                  ...filteredSeries.map((serie) => ({
                    type: "serie" as const,
                    item: serie,
                    key: `serie-${serie.id}`,
                  })),
                ].map(({ type, item, key }) => (
                  <div key={key}>
                    {type === "movie" && item.tmdbData && (
                      <MovieCard
                        movie={item.tmdbData}
                        onClick={() => handleMovieClick(item)}
                        userRating={{
                          rating: String(item.rating),
                          comment: item.comment,
                        }}
                      />
                    )}
                    {type === "serie" && item.tmdbData && (
                      <SerieCard
                        serie={item.tmdbData}
                        onClick={() => handleSerieClick(item)}
                        userRating={{
                          rating: String(item.rating),
                          comment: item.comment,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {(hasMoreMovies || hasMoreSeries) && !loading && (
              <div className="flex justify-center pb-12">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full px-8 h-12 shadow-lg"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-300 mr-3"></div>
                      Carregando mais dados...
                    </>
                  ) : (
                    "Carregar Mais Histórico"
                  )}
                </Button>
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
            isLoggedIn={true}
          />
        )}

        {selectedSerie && (
          <SerieDialog
            isOpen={isSerieDialogOpen}
            onClose={() => setIsSerieDialogOpen(false)}
            serie={selectedSerie}
            serieDetails={serieDetails}
            isLoggedIn={true}
          />
        )}
      </main>
    </div>
  );
}
