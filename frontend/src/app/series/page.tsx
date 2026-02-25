"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AuthService from "../../lib/auth";
import { MediaSearchSection } from "../../components/MediaSearchSection";
import { MediaResultsSection } from "../../components/MediaResultsSection";
import { SerieCard } from "../../components/SerieCard";
import { SerieDialog } from "../../components/SerieDialog";
import { TmdbSerie } from "../../lib/types";
import { seriesApi, favoriteSeriesApi } from "../../lib/api";
import { useMediaListing } from "../../lib/useMediaListing";
import { Tv, TrendingUp, Clock, Star, Radio, LucideIcon } from "lucide-react";

type SerieCategory = "popular" | "airing-today" | "on-the-air" | "top-rated";

const serieCategories: {
  id: SerieCategory;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "popular", label: "Em Alta", Icon: TrendingUp },
  { id: "airing-today", label: "Exibidos Hoje", Icon: Clock },
  { id: "top-rated", label: "Melhor Avaliados", Icon: Star },
  { id: "on-the-air", label: "Em Exibição", Icon: Radio },
];

export default function SeriesPage() {
  const [selectedSerie, setSelectedSerie] = useState<TmdbSerie | null>(null);
  const [serieDetails, setSerieDetails] = useState<TmdbSerie | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ESTADO DE LOGIN
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadByCategory = useCallback(
    async (category: SerieCategory, page: number) => {
      switch (category) {
        case "popular":
          return seriesApi.getPopularSeries(page);
        case "airing-today":
          return seriesApi.getAiringTodaySeries(page);
        case "on-the-air":
          return seriesApi.getOnTheAirSeries(page);
        case "top-rated":
          return seriesApi.getTopRatedSeries(page);
        default:
          return seriesApi.getPopularSeries(page);
      }
    },
    [],
  );

  const listingMessages = useMemo(
    () => ({
      loadTitle: "Erro ao carregar séries",
      loadDescription: "Não foi possível carregar a lista de séries",
      searchTitle: "Erro na busca",
      searchDescription: "Não foi possível realizar a busca. Tente novamente.",
      toggleAddSuccess: "Série adicionada aos favoritos!",
      toggleRemoveSuccess: "Série removida dos favoritos!",
      toggleError: "Erro ao alterar favorito",
    }),
    [],
  );

  const {
    items: series,
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
  } = useMediaListing<TmdbSerie, SerieCategory>({
    mediaType: "serie",
    initialCategory: "popular",
    loadByCategory,
    searchMedia: seriesApi.searchSeries,
    getFavoriteStatus: favoriteSeriesApi.getFavoriteStatus,
    toggleFavorite: favoriteSeriesApi.toggleFavorite,
    messages: listingMessages,
  });

  useEffect(() => {
    // 1. Checa se está logado
    setIsLoggedIn(AuthService.isAuthenticated());
    // 2. Sempre carrega as séries (mesmo visitante)
    initialize();
  }, [initialize]);

  const loadMoreSeries = () => {
    loadMoreItems();
  };

  const handleSerieClick = async (serie: TmdbSerie) => {
    setSelectedSerie(serie);
    setDialogOpen(true);

    try {
      const serieDetails = await seriesApi.getSerieDetails(String(serie.id));
      setSerieDetails(serieDetails);
    } catch (error: any) {
      console.error("Erro ao carregar detalhes da série:", error);
      toast.error("Erro ao carregar detalhes", {
        description: "Não foi possível carregar os detalhes da série",
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedSerie(null);
    setSerieDetails(null);
  };

  const SerieGridLoader = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-900/20 rounded-2xl border border-slate-800/50 mt-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
      <p className="text-slate-400 font-medium">
        Buscando as melhores séries...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center">
            <Tv className="w-8 h-8 mr-3 text-green-500" />
            Catálogo de Séries
          </h2>
          <p className="text-slate-400 mt-2">
            Descubra novas histórias, maratone temporadas inteiras e acompanhe
            os episódios mais recentes.
          </p>
        </div>

        <MediaSearchSection
          title="Buscar"
          titleIconColorClassName="text-green-400 hidden"
          searchButtonClassName="bg-green-600 hover:bg-green-700 text-white"
          searchPlaceholder="Digite o nome de uma série (ex: The Boys)..."
          resultLabel="séries encontradas"
          cardClassName="mb-10 bg-slate-900 border-slate-800 shadow-xl"
          searchQuery={searchQuery}
          isSearching={isSearching}
          isSearchMode={isSearchMode}
          currentCount={isSearchMode ? searchResults.length : series.length}
          categoryFilter={categoryFilter}
          categories={serieCategories}
          onSearch={handleSearch}
          onClearSearch={clearSearch}
          onSearchQueryChange={setSearchQuery}
          onCategoryChange={handleCategoryChange}
        />

        {loading ? (
          <SerieGridLoader />
        ) : (
          <MediaResultsSection
            items={isSearchMode ? searchResults : series}
            isSearchMode={isSearchMode}
            searchResultsLength={searchResults.length}
            isSearching={isSearching}
            searchQuery={searchQuery}
            loadingMore={loadingMore}
            onLoadMore={loadMoreSeries}
            onClearSearch={clearSearch}
            emptyTitle="Nenhuma série na antena"
            emptyDescriptionPrefix="Não encontramos nenhum resultado para"
            emptyBackButtonLabel="Voltar aos Populares"
            emptyIcon={Tv}
            renderCard={(serie) => (
              <SerieCard
                key={`serie-${serie.id}`}
                serie={serie}
                onClick={() => handleSerieClick(serie)}
                showFavoriteButton={isLoggedIn} // <-- CONTROLE AQUI
                isFavorite={favoriteStatus[serie.id] || false}
                onFavoriteToggle={() => handleToggleFavorite(serie.id)}
              />
            )}
          />
        )}
      </main>

      {selectedSerie && (
        <SerieDialog
          serie={selectedSerie}
          serieDetails={serieDetails}
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
          isLoggedIn={isLoggedIn} // <-- REPASSA PARA O DIALOG
        />
      )}
    </div>
  );
}
