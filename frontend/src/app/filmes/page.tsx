"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AuthService from "../../lib/auth";
import { MediaSearchSection } from "../../components/MediaSearchSection";
import { MediaResultsSection } from "../../components/MediaResultsSection";
import { MovieCard } from "../../components/MovieCard";
import { MovieDialog } from "../../components/MovieDialog";
import { TmdbMovie } from "../../lib/types";
import { moviesApi, favoriteMoviesApi } from "../../lib/api";
import { useMediaListing } from "../../lib/useMediaListing";
import {
  Film,
  TrendingUp,
  Clock,
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
  const [selectedMovie, setSelectedMovie] = useState<TmdbMovie | null>(null);
  const [movieDetails, setMovieDetails] = useState<TmdbMovie | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadByCategory = useCallback(
    async (category: MovieCategory, page: number) => {
      switch (category) {
        case "popular":
          return moviesApi.getPopularMovies(page);
        case "now-playing":
          return moviesApi.getNowPlayingMovies(page);
        case "top-rated":
          return moviesApi.getTopRatedMovies(page);
        case "upcoming":
          return moviesApi.getUpcomingMovies(page);
        default:
          return moviesApi.getPopularMovies(page);
      }
    },
    [],
  );

  const listingMessages = useMemo(
    () => ({
      loadTitle: "Erro ao carregar filmes",
      loadDescription: "Não foi possível carregar a lista de filmes",
      searchTitle: "Erro na busca",
      searchDescription: "Não foi possível realizar a busca. Tente novamente.",
      toggleAddSuccess: "Filme adicionado aos favoritos!",
      toggleRemoveSuccess: "Filme removido dos favoritos!",
      toggleError: "Erro ao alterar favorito",
    }),
    [],
  );

  const {
    items: movies,
    loading,
    loadingMore,
    favoriteStatus,
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    isSearchMode,
    categoryFilter,
    initialize,
    loadMoreItems,
    handleSearch,
    clearSearch,
    handleCategoryChange,
    handleToggleFavorite,
  } = useMediaListing<TmdbMovie, MovieCategory>({
    mediaType: "movie",
    initialCategory: "popular",
    loadByCategory,
    searchMedia: moviesApi.searchMovies,
    getFavoriteStatus: favoriteMoviesApi.getFavoriteStatus,
    toggleFavorite: favoriteMoviesApi.toggleFavorite,
    messages: listingMessages,
  });

  useEffect(() => {
    const authenticated = AuthService.isAuthenticated();
    setIsLoggedIn(authenticated);

    initialize();
  }, [initialize]);

  const loadMoreMovies = () => {
    loadMoreItems();
  };

  const handleMovieClick = async (movie: TmdbMovie) => {
    setSelectedMovie(movie);
    setDialogOpen(true);

    try {
      const movieDetails = await moviesApi.getMovieDetails(String(movie.id));
      setMovieDetails(movieDetails);
    } catch (error: any) {
      console.error("Erro ao carregar detalhes do filme:", error);
      toast.error("Erro ao carregar detalhes", {
        description: "Não foi possível carregar os detalhes do filme",
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMovie(null);
    setMovieDetails(null);
  };

  const MovieGridLoader = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-900/20 rounded-2xl border border-slate-800/50 mt-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-slate-400 font-medium">
        Buscando os melhores filmes...
      </p>
    </div>
  );

  return (
    // Adicionado bg-slate-950 aqui para manter o fundo da página escuro
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Cabeçalho Opcional da Página */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Film className="w-8 h-8 mr-3 text-blue-500" />
            Catálogo de Filmes
          </h2>
          <p className="text-slate-400 mt-2">
            Explore os maiores sucessos de bilheteria e encontre a sua próxima
            sessão pipoca.
          </p>
        </div>

        <MediaSearchSection
          title="Buscar"
          titleIconColorClassName="text-blue-400 hidden" // Ocultamos o título interno para usar o externo acima
          searchButtonClassName="bg-blue-600 hover:bg-blue-700 text-white"
          searchPlaceholder="Digite o nome de um filme (ex: Clube da Luta)..."
          resultLabel="filmes encontrados"
          cardClassName="mb-10 bg-slate-900 border-slate-800 shadow-xl"
          searchQuery={searchQuery}
          isSearching={isSearching}
          isSearchMode={isSearchMode}
          currentCount={isSearchMode ? searchResults.length : movies.length}
          categoryFilter={categoryFilter}
          categories={movieCategories}
          onSearch={handleSearch}
          onClearSearch={clearSearch}
          onSearchQueryChange={setSearchQuery}
          onCategoryChange={handleCategoryChange}
        />

        {loading ? (
          <MovieGridLoader />
        ) : (
          <MediaResultsSection
            items={isSearchMode ? searchResults : movies}
            isSearchMode={isSearchMode}
            searchResultsLength={searchResults.length}
            isSearching={isSearching}
            searchQuery={searchQuery}
            loadingMore={loadingMore}
            onLoadMore={loadMoreMovies}
            onClearSearch={clearSearch}
            emptyTitle="Nenhum filme na fita"
            emptyDescriptionPrefix="Não encontramos nenhum resultado para"
            emptyBackButtonLabel="Voltar aos Populares"
            emptyIcon={Film}
            renderCard={(movie) => (
              <MovieCard
                key={`movie-${movie.id}`}
                movie={movie}
                onClick={() => handleMovieClick(movie)}
                showFavoriteButton={isLoggedIn}
                isFavorite={favoriteStatus[movie.id] || false}
                onFavoriteToggle={() => handleToggleFavorite(movie.id)}
              />
            )}
          />
        )}
      </main>

      {/* Dialog de detalhes do filme (Quick View) */}
      {selectedMovie && (
        <MovieDialog
          movie={selectedMovie}
          movieDetails={movieDetails}
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}
