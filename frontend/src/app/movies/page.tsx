"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthService from "../../lib/auth";
import { MovieCard } from "../../components/MovieCard";
import { MovieDialog } from "../../components/MovieDialog";
import { TmdbMovie } from "../../lib/types";
import { moviesApi, favoriteMoviesApi } from "../../lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Film,
  Search,
  TrendingUp,
  Clock,
  X,
  Star,
  Calendar,
  LucideIcon,
} from "lucide-react";

type MovieCategory = "popular" | "now-playing" | "top-rated" | "upcoming";

const movieCategories: {
  id: MovieCategory;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "popular", label: "Populares", Icon: TrendingUp },
  { id: "now-playing", label: "Em Cartaz", Icon: Clock },
  { id: "top-rated", label: "Mais Avaliados", Icon: Star },
  { id: "upcoming", label: "Em Breve", Icon: Calendar },
];

export default function MoviesPage() {
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
  const [movieDetails, setMovieDetails] = useState<TmdbMovie | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TmdbMovie[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<
    "popular" | "now-playing" | "top-rated" | "upcoming"
  >("popular");
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticação
    if (!AuthService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    setFavoriteStatus({});
    loadPopularMovies(1);
  }, [router]);

  const loadMoviesByCategory = async (
    category: "popular" | "now-playing" | "top-rated" | "upcoming",
    page: number
  ) => {
    try {
      console.log(
        `Carregando filmes por categoria: ${category} - página:`,
        page
      );
      let movies;

      switch (category) {
        case "popular":
          movies = await moviesApi.getPopularMovies(page);
          break;
        case "now-playing":
          movies = await moviesApi.getNowPlayingMovies(page);
          break;
        case "top-rated":
          movies = await moviesApi.getTopRatedMovies(page);
          break;
        case "upcoming":
          movies = await moviesApi.getUpcomingMovies(page);
          break;
        default:
          movies = await moviesApi.getPopularMovies(page);
      }

      console.log("Filmes recebidos:", movies);

      if (page === 1) {
        setMovies(movies);
      } else {
        setMovies((prev) => [...prev, ...movies]);
      }

      await loadFavoriteStatus(movies);

      setCurrentPage(page);
    } catch (error: any) {
      console.error("Erro ao carregar filmes:", error);
      toast.error("Erro ao carregar filmes", {
        description: "Não foi possível carregar a lista de filmes",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadPopularMovies = async (page: number) => {
    await loadMoviesByCategory("popular", page);
  };

  const loadMoreMovies = () => {
    if (!loadingMore) {
      setLoadingMore(true);
      if (isSearchMode) {
        loadMoreSearchResults();
      } else {
        loadMoviesByCategory(categoryFilter, currentPage + 1);
      }
    }
  };

  const loadMoreSearchResults = async () => {
    try {
      const searchData = await moviesApi.searchMovies(
        searchQuery,
        currentPage + 1
      );
      const newResults = Array.isArray(searchData) ? searchData : [];

      setSearchResults((prev) => [...prev, ...newResults]);
      setCurrentPage(currentPage + 1);

      await loadFavoriteStatus(newResults);
    } catch (error: any) {
      console.error("Erro ao carregar mais resultados:", error);
      toast.error("Erro ao carregar mais resultados");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMovieClick = async (movie: TmdbMovie) => {
    setSelectedMovie(movie);
    setDialogOpen(true);

    try {
      console.log("Carregando detalhes do filme:", movie.id);
      const movieDetails = await moviesApi.getMovieDetails(movie.id);
      console.log("Detalhes do filme recebidos:", movieDetails);
      setMovieDetails(movieDetails);
    } catch (error: any) {
      console.error("Erro ao carregar detalhes do filme:", error);
      toast.error("Erro ao carregar detalhes", {
        description: "Não foi possível carregar os detalhes do filme",
      });
    }
  };

  const loadFavoriteStatus = async (moviesList: TmdbMovie[]) => {
    try {
      const statusPromises = moviesList.map(async (movie) => {
        try {
          const isFavorite = await favoriteMoviesApi.getFavoriteStatus(
            movie.id.toString()
          );
          return { movieId: movie.id, isFavorite };
        } catch (error) {
          console.error(
            `Erro ao verificar favorito para filme ${movie.id}:`,
            error
          );
          return { movieId: movie.id, isFavorite: false };
        }
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap: Record<number, boolean> = {};
      statuses.forEach(({ movieId, isFavorite }) => {
        statusMap[movieId] = isFavorite;
      });

      setFavoriteStatus((prev) => ({ ...prev, ...statusMap }));
    } catch (error) {
      console.error("Erro ao carregar status de favoritos:", error);
    }
  };

  const handleToggleFavorite = async (movieId: number) => {
    try {
      console.log("Tentando alterar favorito para filme:", movieId);
      await favoriteMoviesApi.toggleFavorite(movieId.toString());

      // Buscar o status atualizado diretamente do servidor para garantir consistência
      const updatedStatus = await favoriteMoviesApi.getFavoriteStatus(
        movieId.toString()
      );
      setFavoriteStatus((prev) => ({ ...prev, [movieId]: updatedStatus }));

      console.log("Status alterado com sucesso:", updatedStatus);
      toast.success(
        updatedStatus
          ? "Filme adicionado aos favoritos!"
          : "Filme removido dos favoritos!"
      );
    } catch (error) {
      console.error("Erro ao alterar favorito:", error);
      toast.error("Erro ao alterar favorito");
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMovie(null);
    setMovieDetails(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsSearchMode(true);

    try {
      console.log("Buscar filmes:", searchQuery);
      const searchData = await moviesApi.searchMovies(searchQuery, 1);
      console.log("Resultados da busca completos:", searchData);
      console.log("Tipo de searchData:", typeof searchData);
      console.log("É array?", Array.isArray(searchData));

      const results = Array.isArray(searchData) ? searchData : [];
      setSearchResults(results);
      setCurrentPage(1);

      await loadFavoriteStatus(results);

      console.log("Estado após setSearchResults:", results);
      toast.success(
        `Encontrados ${results.length} resultados para "${searchQuery}"`
      );
    } catch (error: any) {
      console.error("Erro ao buscar filmes:", error);
      toast.error("Erro na busca", {
        description: "Não foi possível realizar a busca. Tente novamente.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchMode(false);
    setCurrentPage(1);
    setLoading(true);
    loadMoviesByCategory(categoryFilter, 1);
  };

  const handleCategoryChange = (category: MovieCategory) => {
    if (category === categoryFilter) return;
    setCategoryFilter(category);
    setIsSearchMode(false);
    setSearchQuery("");
    setLoading(true);
    loadMoviesByCategory(category, 1);
  };

  const currentCategoryInfo =
    movieCategories.find((c) => c.id === categoryFilter) || movieCategories[0];

  const MovieGridLoader = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-slate-400 font-medium">Carregando filmes...</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Search Section */}
        <Card className="mb-6 sm:mb-8 bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-white flex items-center space-x-2 text-lg sm:text-xl">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span>Buscar Filmes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="Digite o nome do filme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Category Filter Buttons */}
            {!isSearchMode && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-slate-400 font-medium hidden sm:inline">
                  Categoria:
                </span>
                <div className="flex flex-wrap gap-2">
                  {movieCategories.map(({ id, label, Icon }) => (
                    <Button
                      key={id}
                      variant={categoryFilter === id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleCategoryChange(id)}
                      className={
                        categoryFilter === id
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      }
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge
                  variant="secondary"
                  className={
                    isSearchMode
                      ? "bg-green-500/10 text-green-400 border-0"
                      : "bg-blue-500/10 text-blue-400 border-0"
                  }
                >
                  {isSearchMode ? (
                    <Search className="w-3 h-3 mr-1" />
                  ) : (
                    <currentCategoryInfo.Icon className="w-3 h-3 mr-1" />
                  )}
                  {isSearchMode
                    ? "Resultados da Busca"
                    : currentCategoryInfo.label}
                </Badge>
                <span className="text-slate-400 text-sm">
                  {isSearchMode ? searchResults.length : movies.length} filmes
                </span>
                {isSearchMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="text-slate-400 hover:text-slate-300 px-2 py-1 h-6"
                  >
                    <X className="w-3 h-3 mr-1" /> Limpar busca
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de filmes */}
        {loading ? (
          <MovieGridLoader />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              {(isSearchMode ? searchResults : movies).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => handleMovieClick(movie)}
                  isFavorite={favoriteStatus[movie.id] || false}
                  onFavoriteToggle={() => handleToggleFavorite(movie.id)}
                  showFavoriteButton={true}
                />
              ))}
            </div>

            {isSearchMode && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
                  <Film className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-slate-300 text-lg font-medium mb-2">
                    Nenhum filme encontrado
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Não encontramos filmes para "{searchQuery}".
                  </p>
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Voltar aos populares
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <Button
                onClick={loadMoreMovies}
                disabled={loadingMore}
                size="lg"
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 mr-2"></div>
                    <span>Carregando...</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Carregar Mais</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Dialog de detalhes do filme */}
      {selectedMovie && (
        <MovieDialog
          movie={selectedMovie}
          movieDetails={movieDetails}
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}
