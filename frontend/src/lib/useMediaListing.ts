import { useCallback, useState } from "react";
import { toast } from "sonner";
import { TmdbPage } from "./types";

interface ListingMessages {
  loadTitle: string;
  loadDescription: string;
  searchTitle: string;
  searchDescription: string;
  toggleAddSuccess: string;
  toggleRemoveSuccess: string;
  toggleError: string;
}

interface UseMediaListingParams<T extends { id: number }, C extends string> {
  initialCategory: C;
  loadByCategory: (category: C, page: number) => Promise<TmdbPage<T>>;
  searchMedia: (query: string, page: number) => Promise<TmdbPage<T>>;
  getFavoriteStatus: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<{ isFavorite: boolean }>;
  messages: ListingMessages;
}

export function useMediaListing<T extends { id: number }, C extends string>({
  initialCategory,
  loadByCategory,
  searchMedia,
  getFavoriteStatus,
  toggleFavorite,
  messages,
}: UseMediaListingParams<T, C>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>(
    {},
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<C>(initialCategory);

  const loadFavoriteStatus = useCallback(
    async (mediaList: T[]) => {
      try {
        const statusPromises = mediaList.map(async (media) => {
          try {
            const isFavorite = await getFavoriteStatus(media.id.toString());
            return { mediaId: media.id, isFavorite };
          } catch (error) {
            console.error(
              `Erro ao verificar favorito para item ${media.id}:`,
              error,
            );
            return { mediaId: media.id, isFavorite: false };
          }
        });

        const statuses = await Promise.all(statusPromises);
        const statusMap: Record<number, boolean> = {};
        statuses.forEach(({ mediaId, isFavorite }) => {
          statusMap[mediaId] = isFavorite;
        });

        setFavoriteStatus((prev) => ({ ...prev, ...statusMap }));
      } catch (error) {
        console.error("Erro ao carregar status de favoritos:", error);
      }
    },
    [getFavoriteStatus],
  );

  const loadItemsByCategory = useCallback(
    async (category: C, page: number) => {
      try {
        const response = await loadByCategory(category, page);

        if (page === 1) {
          setItems(response.results);
        } else {
          setItems((prev) => [...prev, ...response.results]);
        }

        await loadFavoriteStatus(response.results);
        setCurrentPage(response.page);
      } catch (error: any) {
        console.error(messages.loadTitle + ":", error);
        toast.error(messages.loadTitle, {
          description: messages.loadDescription,
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loadByCategory, loadFavoriteStatus, messages],
  );

  const loadMoreSearchResults = useCallback(async () => {
    try {
      const response = await searchMedia(searchQuery, currentPage + 1);
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
  }, [searchMedia, searchQuery, currentPage, loadFavoriteStatus]);

  const initialize = useCallback(async () => {
    setFavoriteStatus({});
    setLoading(true);
    await loadItemsByCategory(initialCategory, 1);
  }, [initialCategory, loadItemsByCategory]);

  const loadMoreItems = useCallback(() => {
    if (loadingMore) return;

    setLoadingMore(true);
    if (isSearchMode) {
      loadMoreSearchResults();
    } else {
      loadItemsByCategory(categoryFilter, currentPage + 1);
    }
  }, [
    loadingMore,
    isSearchMode,
    loadMoreSearchResults,
    loadItemsByCategory,
    categoryFilter,
    currentPage,
  ]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setIsSearchMode(true);

    try {
      const response = await searchMedia(searchQuery, 1);
      const results = Array.isArray(response.results) ? response.results : [];

      setSearchResults(results);
      setCurrentPage(1);

      await loadFavoriteStatus(results);

      toast.success(
        `Encontrados ${results.length} resultados para "${searchQuery}"`,
      );
    } catch (error: any) {
      console.error(messages.searchTitle + ":", error);
      toast.error(messages.searchTitle, {
        description: messages.searchDescription,
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchMedia, loadFavoriteStatus, messages]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchMode(false);
    setCurrentPage(1);
    setLoading(true);
    loadItemsByCategory(categoryFilter, 1);
  }, [categoryFilter, loadItemsByCategory]);

  const handleCategoryChange = useCallback(
    (category: C) => {
      if (category === categoryFilter) return;

      setCategoryFilter(category);
      setIsSearchMode(false);
      setSearchQuery("");
      setLoading(true);
      loadItemsByCategory(category, 1);
    },
    [categoryFilter, loadItemsByCategory],
  );

  const handleToggleFavorite = useCallback(
    async (mediaId: number) => {
      try {
        const response = await toggleFavorite(mediaId.toString());

        setFavoriteStatus((prev) => ({
          ...prev,
          [mediaId]: response.isFavorite,
        }));

        toast.success(
          response.isFavorite
            ? messages.toggleAddSuccess
            : messages.toggleRemoveSuccess,
        );
      } catch (error) {
        console.error("Erro ao alterar favorito:", error);
        toast.error(messages.toggleError);
      }
    },
    [toggleFavorite, messages],
  );

  return {
    items,
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
  };
}
