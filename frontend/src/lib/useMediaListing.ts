import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { TmdbPage } from "./types";

const MAX_FAVORITE_STATUS_CONCURRENCY = 5;

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
  const favoriteStatusRef = useRef<Record<number, boolean>>({});
  const favoriteInFlightRef = useRef<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<C>(initialCategory);

  const mergeFavoriteStatus = useCallback(
    (statusMap: Record<number, boolean>) => {
      if (Object.keys(statusMap).length === 0) return;

      favoriteStatusRef.current = {
        ...favoriteStatusRef.current,
        ...statusMap,
      };
      setFavoriteStatus((prev) => ({ ...prev, ...statusMap }));
    },
    [],
  );

  const resetFavoriteStatus = useCallback(() => {
    favoriteStatusRef.current = {};
    favoriteInFlightRef.current.clear();
    setFavoriteStatus({});
  }, []);

  const loadFavoriteStatus = useCallback(
    async (mediaList: T[]) => {
      try {
        const pendingMedia = mediaList.filter((media) => {
          const alreadyLoaded =
            favoriteStatusRef.current[media.id] !== undefined;
          const alreadyInFlight = favoriteInFlightRef.current.has(media.id);
          return !alreadyLoaded && !alreadyInFlight;
        });

        if (pendingMedia.length === 0) return;

        pendingMedia.forEach((media) =>
          favoriteInFlightRef.current.add(media.id),
        );

        const queue = [...pendingMedia];
        const statuses: Array<{ mediaId: number; isFavorite: boolean }> = [];
        const workerCount = Math.min(
          MAX_FAVORITE_STATUS_CONCURRENCY,
          queue.length,
        );

        const workers = Array.from({ length: workerCount }, async () => {
          while (queue.length > 0) {
            const media = queue.shift();
            if (!media) return;

            try {
              const isFavorite = await getFavoriteStatus(media.id.toString());
              statuses.push({ mediaId: media.id, isFavorite });
            } catch (error) {
              console.error(
                `Erro ao verificar favorito para item ${media.id}:`,
                error,
              );
              statuses.push({ mediaId: media.id, isFavorite: false });
            } finally {
              favoriteInFlightRef.current.delete(media.id);
            }
          }
        });

        await Promise.all(workers);
        const statusMap: Record<number, boolean> = {};
        statuses.forEach(({ mediaId, isFavorite }) => {
          statusMap[mediaId] = isFavorite;
        });

        mergeFavoriteStatus(statusMap);
      } catch (error) {
        console.error("Erro ao carregar status de favoritos:", error);
      }
    },
    [getFavoriteStatus, mergeFavoriteStatus],
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
    resetFavoriteStatus();
    setLoading(true);
    await loadItemsByCategory(initialCategory, 1);
  }, [initialCategory, loadItemsByCategory, resetFavoriteStatus]);

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
    resetFavoriteStatus();
    setLoading(true);
    loadItemsByCategory(categoryFilter, 1);
  }, [categoryFilter, loadItemsByCategory, resetFavoriteStatus]);

  const handleCategoryChange = useCallback(
    (category: C) => {
      if (category === categoryFilter) return;

      setCategoryFilter(category);
      setIsSearchMode(false);
      setSearchQuery("");
      resetFavoriteStatus();
      setLoading(true);
      loadItemsByCategory(category, 1);
    },
    [categoryFilter, loadItemsByCategory, resetFavoriteStatus],
  );

  const handleToggleFavorite = useCallback(
    async (mediaId: number) => {
      try {
        const response = await toggleFavorite(mediaId.toString());

        setFavoriteStatus((prev) => ({
          ...prev,
          [mediaId]: response.isFavorite,
        }));
        favoriteStatusRef.current[mediaId] = response.isFavorite;

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
