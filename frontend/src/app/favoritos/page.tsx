"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Film, Tv, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      loadFavorites();
    }
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const [moviesResponse, seriesResponse] = await Promise.all([
        favoriteMoviesApi.getFavoriteMovies(),
        favoriteSeriesApi.getFavoriteSeries(),
      ]);

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
        (seriesResponse || []).map(async (serie: FavoriteSerie) => {
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

  const handleSerieClick = async (serie: FavoriteSerieEnriched) => {
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
      if (type !== "all") {
        const isMovie = item.tmdbData?.title;
        const isSerie = item.tmdbData?.name;
        if (type === "movie" && !isMovie) return false;
        if (type === "serie" && !isSerie) return false;
      }

      if (!searchTerm.trim()) return true;

      const searchLower = searchTerm.toLowerCase().trim();
      const title = item.tmdbData?.title?.toLowerCase() || "";
      const name = item.tmdbData?.name?.toLowerCase() || "";
      const originalTitle = item.tmdbData?.original_title?.toLowerCase() || "";
      const originalName = item.tmdbData?.original_name?.toLowerCase() || "";

      return (
        title.includes(searchLower) ||
        name.includes(searchLower) ||
        originalTitle.includes(searchLower) ||
        originalName.includes(searchLower)
      );
    });
  };

  const getStatistics = () => {
    return {
      totalMovies: favoriteMovies.length,
      totalSeries: favoriteSeries.length,
      totalItems: favoriteMovies.length + favoriteSeries.length,
    };
  };

  const stats = getStatistics();
  const filteredMovies = filterItems(favoriteMovies, searchQuery, typeFilter);
  const filteredSeries = filterItems(favoriteSeries, searchQuery, typeFilter);

  const ContentGridLoader = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-900/20 rounded-2xl border border-slate-800/50 mt-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
      <p className="text-slate-400 font-medium">
        Carregando a sua estante especial...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Cabeçalho da Página */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Heart className="w-8 h-8 mr-3 text-pink-500 fill-current/20" />
            Favoritos
          </h2>
          <p className="text-slate-400 mt-2">
            A sua coleção definitiva. Os filmes e séries que marcaram a sua vida
            estão guardados aqui.
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
                  placeholder="Buscar na sua coleção..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 pl-10 pr-10 h-11 rounded-xl focus-visible:ring-pink-500/30 focus-visible:border-pink-500"
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

            {(searchQuery || typeFilter !== "all") && (
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-800/60">
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className="bg-pink-500/10 text-pink-400 border border-pink-500/20"
                  >
                    <Filter className="w-3 h-3 mr-1.5" />
                    Filtrado
                  </Badge>
                  <span className="text-slate-400 text-sm font-medium">
                    {filteredMovies.length + filteredSeries.length} favoritos
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
            {/* Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card className="bg-slate-900 border-slate-800 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-400">
                      Total na Coleção
                    </p>
                    <Heart className="w-4 h-4 text-slate-500" />
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
                      Filmes Favoritos
                    </p>
                    <Film className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalMovies}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-400">
                      Séries Favoritas
                    </p>
                    <Tv className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalSeries}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Grid de Resultados */}
            {filteredMovies.length === 0 && filteredSeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">
                  {searchQuery || typeFilter !== "all"
                    ? "Nenhum resultado para o filtro"
                    : "Sua coleção está vazia"}
                </h3>
                <p className="text-slate-500 text-center max-w-md">
                  {searchQuery || typeFilter !== "all"
                    ? "Tente limpar a sua busca ou trocar de categoria para ver outros favoritos."
                    : "Você ainda não salvou nenhum título. Clique no coração ao navegar pelas páginas para guardar as obras que você ama!"}
                </p>
                {(searchQuery || typeFilter !== "all") && (
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
                    key: `movie-${movie.movieId}`,
                  })),
                  ...filteredSeries.map((serie) => ({
                    type: "serie" as const,
                    item: serie,
                    key: `serie-${serie.serieId}`,
                  })),
                ].map(({ type, item, key }) => (
                  <div key={key}>
                    {type === "movie" && item.tmdbData && (
                      <MovieCard
                        movie={item.tmdbData}
                        onClick={() => handleMovieClick(item)}
                        showFavoriteButton={true}
                        isFavorite={true}
                        onFavoriteToggle={() =>
                          handleRemoveFavorite("movie", item.movieId)
                        }
                      />
                    )}
                    {type === "serie" && item.tmdbData && (
                      <SerieCard
                        serie={item.tmdbData}
                        onClick={() => handleSerieClick(item)}
                        showFavoriteButton={true}
                        isFavorite={true}
                        onFavoriteToggle={() =>
                          handleRemoveFavorite("serie", item.serieId)
                        }
                      />
                    )}
                  </div>
                ))}
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
