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
  { id: "popular", label: "Populares", Icon: TrendingUp },
  { id: "airing-today", label: "Em Cartaz", Icon: Clock },
  { id: "top-rated", label: "Mais Avaliados", Icon: Star },
  { id: "on-the-air", label: "No Ar", Icon: Radio },
];

export default function SeriesPage() {
  const [selectedSerie, setSelectedSerie] = useState<TmdbSerie | null>(null);
  const [serieDetails, setSerieDetails] = useState<TmdbSerie | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    initialCategory: "popular",
    loadByCategory,
    searchMedia: seriesApi.searchSeries,
    getFavoriteStatus: favoriteSeriesApi.getFavoriteStatus,
    toggleFavorite: favoriteSeriesApi.toggleFavorite,
    messages: listingMessages,
  });

  useEffect(() => {
    // Aguarda token estar disponível antes de inicializar
    if (AuthService.isAuthenticated()) {
      initialize();
    }
  }, [initialize]);

  const loadMoreSeries = () => {
    loadMoreItems();
  };

  const handleSerieClick = async (serie: TmdbSerie) => {
    setSelectedSerie(serie);
    setDialogOpen(true);

    try {
      const serieDetails = await seriesApi.getSerieDetails(serie.id);
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-slate-400 font-medium">Carregando series...</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <MediaSearchSection
          title="Buscar Séries"
          titleIconColorClassName="text-green-400"
          searchButtonClassName="bg-green-600 hover:bg-green-700"
          searchPlaceholder="Digite o nome da série..."
          resultLabel="séries"
          cardClassName="mb-8 sm:mb-8"
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
            emptyTitle="Nenhuma série encontrada"
            emptyDescriptionPrefix="Não encontramos séries para"
            emptyBackButtonLabel="Voltar aos populares"
            emptyIcon={Tv}
            renderCard={(serie) => (
              <SerieCard
                key={serie.id}
                serie={serie}
                onClick={() => handleSerieClick(serie)}
                showFavoriteButton={true}
                isFavorite={favoriteStatus[serie.id] || false}
                onFavoriteToggle={() => handleToggleFavorite(serie.id)}
              />
            )}
          />
        )}
      </main>

      {/* Dialog de detalhes da série */}
      {selectedSerie && (
        <SerieDialog
          serie={selectedSerie}
          serieDetails={serieDetails}
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}
