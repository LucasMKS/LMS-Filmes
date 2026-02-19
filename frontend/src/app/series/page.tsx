"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthService from "../../lib/auth";
import { SerieCard } from "../../components/SerieCard";
import { SerieDialog } from "../../components/SerieDialog";
import { TmdbSerie, TmdbPage } from "../../lib/types";
import { seriesApi, favoriteSeriesApi } from "../../lib/api";
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
  Tv,
  Search,
  TrendingUp,
  Clock,
  Play,
  X,
  Star,
  Calendar,
  Radio,
  LucideIcon,
} from "lucide-react";

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
  const [series, setSeries] = useState<TmdbSerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSerie, setSelectedSerie] = useState<TmdbSerie | null>(null);
  const [serieDetails, setSerieDetails] = useState<TmdbSerie | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TmdbSerie[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<
    "popular" | "airing-today" | "on-the-air" | "top-rated"
  >("popular");
  const router = useRouter();

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    setFavoriteStatus({});

    loadPopularSeries(1);
  }, [router]);

  const loadSeriesByCategory = async (
    category: SerieCategory,
    page: number,
  ) => {
    try {
      let response: TmdbPage<TmdbSerie>;

      switch (category) {
        case "popular":
          response = await seriesApi.getPopularSeries(page);
          break;
        case "airing-today":
          response = await seriesApi.getAiringTodaySeries(page);
          break;
        case "on-the-air":
          response = await seriesApi.getOnTheAirSeries(page);
          break;
        case "top-rated":
          response = await seriesApi.getTopRatedSeries(page);
          break;
        default:
          response = await seriesApi.getPopularSeries(page);
      }

      console.log("Séries recebidas (objeto Page):", response);

      if (page === 1) {
        setSeries(response.results);
      } else {
        setSeries((prev) => [...prev, ...response.results]);
      }

      await loadFavoriteStatus(response.results);

      setCurrentPage(page);
    } catch (error: any) {
      console.error("Erro ao carregar séries:", error);
      toast.error("Erro ao carregar séries", {
        description: "Não foi possível carregar a lista de séries",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadPopularSeries = async (page: number) => {
    await loadSeriesByCategory("popular", page);
  };

  const loadMoreSeries = () => {
    if (!loadingMore) {
      setLoadingMore(true);
      if (isSearchMode) {
        loadMoreSearchResults();
      } else {
        loadSeriesByCategory(categoryFilter, currentPage + 1);
      }
    }
  };

  const loadMoreSearchResults = async () => {
    try {
      const response = await seriesApi.searchSeries(
        searchQuery,
        currentPage + 1,
      );
      const newResults = Array.isArray(response.results)
        ? response.results
        : [];

      setSearchResults((prev) => [...prev, ...newResults]);
      setCurrentPage(response.page);

      await loadFavoriteStatus(newResults);
    } catch (error: any) {
      console.error("Erro ao carregar mais resultados:", error);
      toast.error("Erro ao carregar mais resultados");
    } finally {
      setLoadingMore(false);
    }
  };

  const loadFavoriteStatus = async (seriesList: TmdbSerie[]) => {
    try {
      const statusPromises = seriesList.map(async (serie) => {
        try {
          const isFavorite = await favoriteSeriesApi.getFavoriteStatus(
            serie.id.toString(),
          );
          return { serieId: serie.id, isFavorite };
        } catch (error) {
          console.error(
            `Erro ao verificar favorito para série ${serie.id}:`,
            error,
          );
          return { serieId: serie.id, isFavorite: false };
        }
      });

      const statuses = await Promise.all(statusPromises);
      const statusMap: Record<number, boolean> = {};
      statuses.forEach(({ serieId, isFavorite }) => {
        statusMap[serieId] = isFavorite;
      });

      setFavoriteStatus((prev) => ({ ...prev, ...statusMap }));
    } catch (error) {
      console.error("Erro ao carregar status de favoritos:", error);
    }
  };

  const handleToggleFavorite = async (serieId: number) => {
    try {
      const response = await favoriteSeriesApi.toggleFavorite(
        serieId.toString(),
      );

      setFavoriteStatus((prev) => ({
        ...prev,
        [serieId]: response.isFavorite,
      }));

      toast.success(
        response.isFavorite
          ? "Série adicionada aos favoritos!"
          : "Série removida dos favoritos!",
      );
    } catch (error) {
      console.error("Erro ao alterar favorito:", error);
      toast.error("Erro ao alterar favorito");
    }
  };

  const handleSerieClick = async (serie: TmdbSerie) => {
    setSelectedSerie(serie);
    setDialogOpen(true);

    try {
      console.log("Carregando detalhes da série:", serie.id);
      const serieDetails = await seriesApi.getSerieDetails(serie.id);
      console.log("Detalhes da série recebidos:", serieDetails);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsSearchMode(true);

    try {
      const response = await seriesApi.searchSeries(searchQuery, 1);

      const results = Array.isArray(response.results) ? response.results : [];
      setSearchResults(results);
      setCurrentPage(1);

      await loadFavoriteStatus(results);

      toast.success(
        `Encontrados ${results.length} resultados para "${searchQuery}"`,
      );
    } catch (error: any) {
      console.error("Erro ao buscar séries:", error);
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
    loadSeriesByCategory(categoryFilter, 1);
  };

  const handleCategoryChange = (category: SerieCategory) => {
    if (category === categoryFilter) return;
    setCategoryFilter(category);
    setIsSearchMode(false);
    setSearchQuery("");
    setLoading(true);
    loadSeriesByCategory(category, 1);
  };

  const currentCategoryInfo =
    serieCategories.find((c) => c.id === categoryFilter) || serieCategories[0];

  const SerieGridLoader = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-slate-400 font-medium">Carregando series...</p>
    </div>
  );

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Search Section */}
        <Card className="mb-8 sm:mb-8 bg-gray-900 !border-gray-800 border-2 shadow-2xl shadow-zinc-950">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-white flex items-center space-x-2">
              <Search className="w-5 h-5 text-green-400" />
              <span>Buscar Séries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="Digite o nome da série..."
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
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
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
                  {serieCategories.map(({ id, label, Icon }) => (
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
                  {isSearchMode ? searchResults.length : series.length} séries
                </span>
                {isSearchMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="text-slate-400 hover:text-slate-300 px-2 py-1 h-6"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpar busca
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de séries */}
        {loading ? (
          <SerieGridLoader />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              {(isSearchMode ? searchResults : series).map((serie, index) => (
                <SerieCard
                  key={serie.id}
                  serie={serie}
                  onClick={() => handleSerieClick(serie)}
                  showFavoriteButton={true}
                  isFavorite={favoriteStatus[serie.id] || false}
                  onFavoriteToggle={() => handleToggleFavorite(serie.id)}
                />
              ))}
            </div>

            {/* Mensagem quando não há resultados na busca */}
            {isSearchMode && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700/50">
                  <Tv className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-slate-300 text-lg font-medium mb-2">
                    Nenhuma série encontrada
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Não encontramos séries para "{searchQuery}".
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

            {/* Botão carregar mais */}
            <div className="text-center">
              <Button
                onClick={loadMoreSeries}
                disabled={loadingMore}
                size="lg"
                variant="outline"
                className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 text-slate-300 hover:text-white disabled:opacity-50"
              >
                {loadingMore ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                    <span>Carregando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Carregar Mais</span>
                  </div>
                )}
              </Button>
            </div>
          </>
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
