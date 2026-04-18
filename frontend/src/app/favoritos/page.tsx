"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Heart, Film, Tv, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function FavoritesPage() {
  const queryClient = useQueryClient();

  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<TmdbSerie | null>(null);
  const [movieDetails, setMovieDetails] = useState<TmdbMovie | null>(null);
  const [serieDetails, setSerieDetails] = useState<TmdbSerie | null>(null);
  const [isMovieDialogOpen, setIsMovieDialogOpen] = useState(false);
  const [isSerieDialogOpen, setIsSerieDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "serie">("all");

  const isAuth = AuthService.isAuthenticated();

  const { data: favoriteMovies = [], isLoading: isLoadingMovies } = useQuery({
    queryKey: ["favorites", "movies"],
    queryFn: async () => {
      const response = await favoriteMoviesApi.getFavoriteMovies();
      const enriched = await Promise.all(
        (response || []).map(async (movie: FavoriteMovie) => {
          try {
            const tmdbData = await moviesApi.getMovieDetails(parseInt(movie.movieId));
            return { ...movie, tmdbData };
          } catch {
            return movie;
          }
        }),
      );
      return enriched as FavoriteMovieEnriched[];
    },
    enabled: isAuth,
  });

  const { data: favoriteSeries = [], isLoading: isLoadingSeries } = useQuery({
    queryKey: ["favorites", "series"],
    queryFn: async () => {
      const response = await favoriteSeriesApi.getFavoriteSeries();
      const enriched = await Promise.all(
        (response || []).map(async (serie: FavoriteSerie) => {
          try {
            const tmdbData = await seriesApi.getSerieDetails(parseInt(serie.serieId));
            return { ...serie, tmdbData };
          } catch {
            return serie;
          }
        }),
      );
      return enriched as FavoriteSerieEnriched[];
    },
    enabled: isAuth,
  });

  const isLoading = isLoadingMovies || isLoadingSeries;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: "movie" | "serie"; id: string }) => {
      if (type === "movie") return favoriteMoviesApi.toggleFavorite(id);
      return favoriteSeriesApi.toggleFavorite(id);
    },
    onMutate: async ({ type, id }) => {
      const queryKey = ["favorites", type === "movie" ? "movies" : "series"];
      await queryClient.cancelQueries({ queryKey });
      const previousFavorites = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any[]) => {
        if (!old) return [];
        return old.filter((item) =>
          type === "movie" ? item.movieId !== id : item.serieId !== id,
        );
      });
      return { previousFavorites, queryKey };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(context.queryKey, context.previousFavorites);
      }
      toast.error("Erro ao remover dos favoritos");
    },
    onSuccess: (_, { type }) => {
      toast.success(
        type === "movie" ? "Filme removido dos favoritos!" : "Série removida dos favoritos!",
      );
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const handleMovieClick = async (movie: FavoriteMovieEnriched) => {
    if (movie.tmdbData) {
      setSelectedMovie(movie.tmdbData);
      try {
        const details = await moviesApi.getMovieDetails(String(movie.tmdbData.id));
        setMovieDetails(details);
      } catch {
        setMovieDetails(null);
      }
      setIsMovieDialogOpen(true);
    }
  };

  const handleSerieClick = async (serie: FavoriteSerieEnriched) => {
    if (serie.tmdbData) {
      setSelectedSerie(serie.tmdbData);
      try {
        const details = await seriesApi.getSerieDetails(String(serie.tmdbData.id));
        setSerieDetails(details);
      } catch {
        setSerieDetails(null);
      }
      setIsSerieDialogOpen(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  const filterItems = (items: any[], searchTerm: string, type: string = "all") => {
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

  const filteredMovies = filterItems(favoriteMovies, searchQuery, typeFilter);
  const filteredSeries = filterItems(favoriteSeries, searchQuery, typeFilter);
  const totalItems = favoriteMovies.length + favoriteSeries.length;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400/20" />
            Favoritos
          </h2>
          <p className="text-white/35 mt-2">
            A sua coleção definitiva. Os filmes e séries que marcaram a sua vida estão guardados aqui.
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-8 bg-[#14141c] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <Input
                placeholder="Buscar na sua coleção..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0f]/60 border-white/10 text-white/90 placeholder:text-white/25 focus:border-pink-500/50 rounded-xl h-11 pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 bg-[#0a0a0f]/60 p-1 rounded-xl border border-white/[0.06] shrink-0">
              {[
                { value: "all", label: "Todos" },
                { value: "movie", label: "Filmes", icon: Film },
                { value: "serie", label: "Séries", icon: Tv },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    typeFilter === value
                      ? value === "movie"
                        ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                        : value === "serie"
                          ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                          : "bg-white/10 text-white border border-white/10"
                      : "text-white/40 hover:text-white/70 border border-transparent",
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {(searchQuery || typeFilter !== "all") && (
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/[0.04]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xs font-semibold">
                  <Filter className="w-3 h-3" /> Filtrado
                </span>
                <span className="text-white/40 text-sm">
                  {filteredMovies.length + filteredSeries.length} favoritos encontrados
                </span>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-[#14141c]/40 rounded-2xl border border-white/[0.06] mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mb-4" />
            <p className="text-white/35 font-medium">Carregando a sua estante especial...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total na Coleção", value: totalItems, icon: Heart, color: "text-pink-400" },
                { label: "Filmes Favoritos", value: favoriteMovies.length, icon: Film, color: "text-purple-400" },
                { label: "Séries Favoritas", value: favoriteSeries.length, icon: Tv, color: "text-violet-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-[#14141c] border border-white/[0.06] rounded-2xl p-4 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white/40">{label}</p>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            {filteredMovies.length === 0 && filteredSeries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#14141c]/40 rounded-2xl border border-white/[0.06] border-dashed">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white/70 mb-2">
                  {searchQuery || typeFilter !== "all"
                    ? "Nenhum resultado para o filtro"
                    : "Sua coleção está vazia"}
                </h3>
                <p className="text-white/35 text-center max-w-md text-sm">
                  {searchQuery || typeFilter !== "all"
                    ? "Tente limpar a sua busca ou trocar de categoria para ver outros favoritos."
                    : "Você ainda não salvou nenhum título. Clique no coração ao navegar pelas páginas para guardar as obras que você ama!"}
                </p>
                {(searchQuery || typeFilter !== "all") && (
                  <button
                    onClick={clearSearch}
                    className="mt-6 px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm transition-all"
                  >
                    Limpar Filtros
                  </button>
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
                          toggleFavoriteMutation.mutate({ type: "movie", id: item.movieId })
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
                          toggleFavoriteMutation.mutate({ type: "serie", id: item.serieId })
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
