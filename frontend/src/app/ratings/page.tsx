"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    "all"
  );
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticação
    if (!AuthService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadRatings();
  }, [router]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      // Carregar filmes e séries avaliados
      const [moviesResponse, seriesResponse] = await Promise.all([
        ratingMoviesApi.getRatedMovies(),
        ratingSeriesApi.getRatedSeries(),
      ]);

      // Enriquecer com dados do TMDB
      const enrichedMovies = await Promise.all(
        (moviesResponse || []).map(async (movie: Movie) => {
          try {
            const tmdbData = await moviesApi.getMovieDetails(
              parseInt(movie.movieId)
            );
            return { ...movie, tmdbData };
          } catch (error) {
            console.error(
              `Erro ao buscar detalhes do filme ${movie.movieId}:`,
              error
            );
            return movie;
          }
        })
      );

      const enrichedSeries = await Promise.all(
        (seriesResponse || []).map(async (serie: Serie) => {
          try {
            const tmdbData = await seriesApi.getSerieDetails(
              parseInt(serie.serieId)
            );
            return { ...serie, tmdbData };
          } catch (error) {
            console.error(
              `Erro ao buscar detalhes da série ${serie.serieId}:`,
              error
            );
            return serie;
          }
        })
      );

      setRatedMovies(enrichedMovies);
      setRatedSeries(enrichedSeries);
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
      toast.error("Erro ao carregar suas avaliações", {
        description: "Tente novamente mais tarde",
      });
    } finally {
      setLoading(false);
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
    itemType: "movie" | "serie"
  ) => {
    return items.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.tmdbData?.title
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.tmdbData?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating =
        ratingFilter === null || item.myVote === ratingFilter;

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "movie" && itemType === "movie") ||
        (typeFilter === "serie" && itemType === "serie");

      return matchesSearch && matchesRating && matchesType;
    });
  };

  const getAverageRating = (items: (RatedMovie | RatedSerie)[]) => {
    if (items.length === 0) return 0;
    const sum = items.reduce(
      (acc, item) => acc + parseFloat(item.myVote || "0"),
      0
    );
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
      (m) => m.comment && m.comment.trim()
    ).length;
    const seriesWithComments = ratedSeries.filter(
      (s) => s.comment && s.comment.trim()
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
    "movie"
  );
  const filteredSeries = filterItems(
    ratedSeries,
    searchQuery,
    filterRating,
    "serie"
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
                            myVote: item.myVote,
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
                            myVote: item.myVote,
                            comment: item.comment,
                          }}
                        />
                      </>
                    )}
                  </div>
                ))}
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
