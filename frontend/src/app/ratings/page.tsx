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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Star, Film, Tv, Search, Filter, TrendingUp, X } from "lucide-react";

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
      vote_average: movie.rating || undefined,
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
      vote_average: serie.rating || undefined,
    };
  };

  useEffect(() => {
    // Aguarda token estar disponível antes de carregar
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
              console.error(`Erro ao enriquecer filme ID ${m.movieId}:`, error);
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
              console.error(`Erro ao enriquecer série ID ${s.serieId}:`, error);
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
        const details = await moviesApi.getMovieDetails(movie.tmdbData.id);
        setMovieDetails(details);
      } catch (error) {
        console.error("Erro ao carregar detalhes do filme:", error);
        setMovieDetails(null);
      }
      setIsMovieDialogOpen(true);
    }
  };

  const handleSerieClick = async (serie: RatedSerie) => {
    if (serie.tmdbData) {
      setSelectedSerie(serie.tmdbData);
      try {
        const details = await seriesApi.getSerieDetails(serie.tmdbData.id);
        setSerieDetails(details);
      } catch (error) {
        console.error("Erro ao carregar detalhes da série:", error);
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

      // REATORADO: usa 'item.rating' (number)
      const matchesRating =
        ratingFilter === null || item.rating === ratingFilter;

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "movie" && itemType === "movie") ||
        (typeFilter === "serie" && itemType === "serie");

      return matchesSearch && matchesRating && matchesType;
    });
  };

  const getAverageRating = (items: (RatedMovie | RatedSerie)[]) => {
    if (items.length === 0) return 0;
    // REATORADO: usa 'item.rating' (number) diretamente
    const sum = items.reduce((acc, item) => acc + (item.rating || 0), 0);
    return (sum / items.length).toFixed(1);
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-slate-400 font-medium">Carregando...</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Section */}
        <Card className="mb-6 sm:mb-8 bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-white flex items-center space-x-2 text-lg sm:text-xl">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span>Buscar nas suas avaliações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Buscar filmes ou séries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-700/30 !border-slate-600 placeholder:text-slate-400 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtros de Tipo */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-400 self-center mr-2">
                  Tipo:
                </span>
                <Button
                  variant={typeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter("all")}
                  className={`${
                    typeFilter === "all"
                      ? "bg-slate-600 text-white"
                      : "!border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Todos
                </Button>
                <Button
                  variant={typeFilter === "movie" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter("movie")}
                  className={`${
                    typeFilter === "movie"
                      ? "bg-blue-600 text-white"
                      : "!border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Film className="w-3 h-3 mr-1" />
                  Filmes
                </Button>
                <Button
                  variant={typeFilter === "serie" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter("serie")}
                  className={`${
                    typeFilter === "serie"
                      ? "bg-green-600 text-white"
                      : "!border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <Tv className="w-3 h-3 mr-1" />
                  Séries
                </Button>
              </div>
            </div>
            {(searchQuery || filterRating || typeFilter !== "all") && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500/10 text-yellow-400 !border-yellow-500/20"
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    Filtrado
                  </Badge>
                  <span className="text-slate-400 text-sm">
                    {filteredMovies.length + filteredSeries.length} resultados
                  </span>
                </div>
                {(searchQuery || filterRating || typeFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <ContentGridLoader />
        ) : (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-900 !border-gray-800 border-2 shadow-lg shadow-zinc-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
                    <Star className="w-4 h-4 mr-2 text-yellow-400" />
                    Total de Itens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalItems}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats.totalMovies} filmes, {stats.totalSeries} séries
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 !border-gray-800 border-2 shadow-lg shadow-zinc-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-400" />
                    Média Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white flex items-center">
                    {stats.avgOverall}
                    <Star className="w-5 h-5 text-yellow-400 ml-1" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Filmes: {stats.avgMovieRating}★ | Séries:{" "}
                    {stats.avgSerieRating}★
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 !border-gray-800 border-2 shadow-lg shadow-zinc-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
                    <Film className="w-4 h-4 mr-2 text-blue-400" />
                    Filmes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalMovies}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats.moviesWithComments} com comentários
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 !border-gray-800 border-2 shadow-lg shadow-zinc-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
                    <Tv className="w-4 h-4 mr-2 text-green-400" />
                    Séries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalSeries}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats.seriesWithComments} com comentários
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Seção Unificada - Filmes e Séries */}
            {filteredMovies.length === 0 && filteredSeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Star className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  {searchQuery || filterRating
                    ? "Nenhum item encontrado"
                    : "Nenhuma avaliação encontrada"}
                </h3>
                <p className="text-slate-500 text-center">
                  {searchQuery || filterRating
                    ? "Tente ajustar os filtros de busca."
                    : "Quando você avaliar filmes e séries, eles aparecerão aqui."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
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
                  <div
                    key={key}
                    className="group transition-all duration-300 hover:scale-[1.02] relative"
                  >
                    {type === "movie" && item.tmdbData && (
                      <>
                        <MovieCard
                          movie={item.tmdbData}
                          onClick={() => handleMovieClick(item)}
                          userRating={{
                            rating: item.rating,
                            comment: item.comment,
                          }}
                        />
                      </>
                    )}
                    {type === "serie" && item.tmdbData && (
                      <>
                        <SerieCard
                          serie={item.tmdbData}
                          onClick={() => handleSerieClick(item)}
                          userRating={{
                            rating: item.rating,
                            comment: item.comment,
                          }}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {(hasMoreMovies || hasMoreSeries) && !loading && (
              <div className="flex justify-center mt-8 mb-12">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                  className="bg-gray-900 border-gray-700 text-slate-300 hover:bg-gray-800 hover:text-white min-w-[200px]"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Carregando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2 text-yellow-400" />
                      Carregar Mais Avaliações
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
        {/* Dialogs */}
        {selectedMovie && (
          <MovieDialog
            movie={selectedMovie}
            movieDetails={movieDetails}
            isOpen={isMovieDialogOpen}
            onClose={() => setIsMovieDialogOpen(false)}
          />
        )}

        {selectedSerie && (
          <SerieDialog
            isOpen={isSerieDialogOpen}
            onClose={() => setIsSerieDialogOpen(false)}
            serie={selectedSerie}
            serieDetails={serieDetails}
          />
        )}
      </main>
    </div>
  );
}
