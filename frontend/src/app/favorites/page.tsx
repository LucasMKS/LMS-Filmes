"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthService from "../../lib/auth";
import {
  favoriteMoviesApi,
  favoriteSeriesApi,
  moviesApi,
  seriesApi,
} from "../../lib/api";
import {
  FavoriteMovie,
  FavoriteSerie,
  FavoriteMovieEnriched,
  FavoriteSerieEnriched,
  TmdbMovie,
  TmdbSerie,
} from "../../lib/types";
import { MovieCard } from "../../components/MovieCard";
import { SerieCard } from "../../components/SerieCard";
import { MovieDialog } from "../../components/MovieDialog";
import { SerieDialog } from "../../components/SerieDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Film, Tv, Search, Filter, X } from "lucide-react";

export default function FavoritesPage() {
  const [favoriteMovies, setFavoriteMovies] = useState<FavoriteMovieEnriched[]>(
    [],
  );
  const [favoriteSeries, setFavoriteSeries] = useState<FavoriteSerieEnriched[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<TmdbSerie | null>(null);
  const [movieDetails, setMovieDetails] = useState<TmdbMovie | null>(null);
  const [serieDetails, setSerieDetails] = useState<TmdbSerie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [isSerieDialogOpen, setIsSerieDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "serie">(
    "all",
  );
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticação
    if (!AuthService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    loadFavorites();
  }, [router]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // Carregar filmes e séries favoritos
      const [moviesResponse, seriesResponse] = await Promise.all([
        favoriteMoviesApi.getFavoriteMovies(),
        favoriteSeriesApi.getFavoriteSeries(),
      ]);
      console.log("Filmes favoritos:", moviesResponse);
      console.log("Séries favoritas:", seriesResponse);

      // Enriquecer com dados do TMDB
      const enrichedMovies = await Promise.all(
        (moviesResponse || []).map(async (movie: FavoriteMovie) => {
          try {
            const tmdbData = await moviesApi.getMovieDetails(
              parseInt(movie.movieId),
            );
            return { ...movie, tmdbData };
          } catch (error) {
            console.error(
              `Erro ao buscar detalhes do filme ${movie.movieId}:`,
              error,
            );
            return movie;
          }
        }),
      );

      const enrichedSeries = await Promise.all(
        (seriesResponse.data || []).map(async (serie: FavoriteSerie) => {
          try {
            const tmdbData = await seriesApi.getSerieDetails(
              parseInt(serie.serieId),
            );
            return { ...serie, tmdbData };
          } catch (error) {
            console.error(
              `Erro ao buscar detalhes da série ${serie.serieId}:`,
              error,
            );
            return serie;
          }
        }),
      );

      setFavoriteMovies(enrichedMovies);
      setFavoriteSeries(enrichedSeries);
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
      toast.error("Erro ao carregar seus favoritos", {
        description: "Tente novamente mais tarde",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = async (movie: FavoriteMovieEnriched) => {
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

  const handleSerieClick = async (serie: FavoriteSerieEnriched) => {
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

  const handleRemoveFavorite = async (type: "movie" | "serie", id: string) => {
    try {
      if (type === "movie") {
        await favoriteMoviesApi.toggleFavorite(id);
        setFavoriteMovies((prev) =>
          prev.filter((movie) => movie.movieId !== id),
        );
        toast.success("Filme removido dos favoritos!");
      } else {
        await favoriteSeriesApi.toggleFavorite(id);
        setFavoriteSeries((prev) =>
          prev.filter((serie) => serie.serieId !== id),
        );
        toast.success("Série removida dos favoritos!");
      }
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
      toast.error("Erro ao remover dos favoritos");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  const filterItems = (
    items: any[],
    searchTerm: string,
    type: string = "all",
  ) => {
    return items.filter((item) => {
      // Filtro por tipo
      if (type !== "all") {
        const isMovie = item.tmdbData?.title;
        const isSerie = item.tmdbData?.name;

        if (type === "movie" && !isMovie) return false;
        if (type === "serie" && !isSerie) return false;
      }

      // Se não há termo de busca, retorna true (já passou pelo filtro de tipo)
      if (!searchTerm.trim()) {
        return true;
      }

      // Filtro por busca
      const searchLower = searchTerm.toLowerCase().trim();

      // Verifica no título do filme
      const title = item.tmdbData?.title?.toLowerCase() || "";

      // Verifica no nome da série
      const name = item.tmdbData?.name?.toLowerCase() || "";

      // Verifica no título original (se existir)
      const originalTitle = item.tmdbData?.original_title?.toLowerCase() || "";
      const originalName = item.tmdbData?.original_name?.toLowerCase() || "";

      const matchesSearch =
        title.includes(searchLower) ||
        name.includes(searchLower) ||
        originalTitle.includes(searchLower) ||
        originalName.includes(searchLower);

      console.log(
        `Filtering item: ${
          title || name
        }, search: ${searchLower}, matches: ${matchesSearch}`,
      );

      return matchesSearch;
    });
  };

  const getStatistics = () => {
    const totalMovies = favoriteMovies.length;
    const totalSeries = favoriteSeries.length;
    const totalItems = totalMovies + totalSeries;

    return {
      totalMovies,
      totalSeries,
      totalItems,
    };
  };

  const stats = getStatistics();
  const filteredMovies = filterItems(favoriteMovies, searchQuery, typeFilter);
  const filteredSeries = filterItems(favoriteSeries, searchQuery, typeFilter);

  const ContentGridLoader = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-slate-400 font-medium">Carregando...</p>
    </div>
  );

  return (
    <div className="min-h-screen ">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Section */}
        <Card className="mb-6 sm:mb-8 bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-white flex items-center space-x-2 text-lg sm:text-xl">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
              <span>Buscar nos seus favoritos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Buscar filmes ou séries favoritos..."
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
                  variant={typeFilter === "all" ? "default" : "ghost"}
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
                  variant={typeFilter === "movie" ? "default" : "ghost"}
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
                  variant={typeFilter === "serie" ? "default" : "ghost"}
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
            {(searchQuery || typeFilter !== "all") && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className="bg-pink-500/10 text-pink-400 !border-pink-500/20"
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    Filtrado
                  </Badge>
                  <span className="text-slate-400 text-sm">
                    {filteredMovies.length + filteredSeries.length} resultados
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <ContentGridLoader />
        ) : (
          <>
            {/* Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gray-900 !border-gray-800 border-2 shadow-lg shadow-zinc-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
                    <Heart className="w-4 h-4 mr-2 text-pink-400" />
                    Total de Favoritos
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
                    <Film className="w-4 h-4 mr-2 text-blue-400" />
                    Filmes Favoritos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalMovies}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? filteredMovies.length : stats.totalMovies}{" "}
                    {searchQuery ? "encontrados" : "total"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 !border-gray-800 border-2 shadow-lg shadow-zinc-950">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400 flex items-center">
                    <Tv className="w-4 h-4 mr-2 text-green-400" />
                    Séries Favoritas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalSeries}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? filteredSeries.length : stats.totalSeries}{" "}
                    {searchQuery ? "encontradas" : "total"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Seção Unificada - Filmes e Séries */}
            {filteredMovies.length === 0 && filteredSeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Heart className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  {searchQuery
                    ? "Nenhum favorito encontrado"
                    : "Nenhum favorito adicionado"}
                </h3>
                <p className="text-slate-500 text-center">
                  {searchQuery
                    ? "Tente ajustar os filtros de busca."
                    : "Quando você adicionar filmes e séries aos favoritos, eles aparecerão aqui."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                {/* Misturar filmes e séries em uma única lista */}
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
                          showFavoriteButton={true}
                          isFavorite={true}
                          onFavoriteToggle={() =>
                            handleRemoveFavorite("movie", item.movieId)
                          }
                        />
                      </>
                    )}
                    {type === "serie" && item.tmdbData && (
                      <>
                        <SerieCard
                          serie={item.tmdbData}
                          onClick={() => handleSerieClick(item)}
                          showFavoriteButton={true}
                          isFavorite={true}
                          onFavoriteToggle={() =>
                            handleRemoveFavorite("serie", item.serieId)
                          }
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
