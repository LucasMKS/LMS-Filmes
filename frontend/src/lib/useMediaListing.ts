import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TmdbPage } from "./types";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import AuthService from "./auth";

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
  mediaType: "movie" | "serie";
  initialCategory: C;
  loadByCategory: (category: C, page: number) => Promise<TmdbPage<T>>;
  searchMedia: (query: string, page: number) => Promise<TmdbPage<T>>;
  getFavoriteStatus: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<{ isFavorite: boolean }>;
  messages: ListingMessages;
}

export function useMediaListing<T extends { id: number }, C extends string>({
  mediaType,
  initialCategory,
  loadByCategory,
  searchMedia,
  getFavoriteStatus,
  toggleFavorite,
  messages,
}: UseMediaListingParams<T, C>) {
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState<C>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>(
    {},
  );
  const favoriteStatusRef = useRef<Record<number, boolean>>({});
  const favoriteInFlightRef = useRef<Set<number>>(new Set());

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      mediaType,
      "media",
      isSearchMode ? "search" : "category",
      isSearchMode ? activeSearch : categoryFilter,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (isSearchMode) {
        return searchMedia(activeSearch, pageParam as number);
      }
      return loadByCategory(categoryFilter, pageParam as number);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.total_pages
        ? lastPage.page + 1
        : undefined;
    },
    enabled: !isSearchMode || activeSearch.trim().length > 0,
  });

  const rawItems = data?.pages.flatMap((page) => page.results ?? []) ?? [];

  const fetchedItems = Array.from(
    new Map(rawItems.map((item) => [item.id, item])).values(),
  );

  useEffect(() => {
    if (fetchedItems.length === 0) return;

    if (!AuthService.isAuthenticated()) return;

    const pendingMedia = fetchedItems.filter((media) => {
      const alreadyLoaded = favoriteStatusRef.current[media.id] !== undefined;
      const alreadyInFlight = favoriteInFlightRef.current.has(media.id);
      return !alreadyLoaded && !alreadyInFlight;
    });

    if (pendingMedia.length === 0) return;

    pendingMedia.forEach((media) => favoriteInFlightRef.current.add(media.id));

    const queue = [...pendingMedia];
    const workerCount = Math.min(MAX_FAVORITE_STATUS_CONCURRENCY, queue.length);

    const runWorker = async () => {
      while (queue.length > 0) {
        const media = queue.shift();
        if (!media) return;

        try {
          const isFavorite = await getFavoriteStatus(media.id.toString());
          favoriteStatusRef.current[media.id] = isFavorite;
          setFavoriteStatus((prev) => ({ ...prev, [media.id]: isFavorite }));
        } catch (error) {
          console.error(
            `Erro ao verificar favorito para o item ${media.id}:`,
            error,
          );
          favoriteStatusRef.current[media.id] = false;
          setFavoriteStatus((prev) => ({ ...prev, [media.id]: false }));
        } finally {
          favoriteInFlightRef.current.delete(media.id);
        }
      }
    };

    Array.from({ length: workerCount }).forEach(runWorker);
  }, [fetchedItems, getFavoriteStatus]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: (mediaId: string) => toggleFavorite(mediaId),
    onSuccess: (response, mediaIdStr) => {
      const mediaId = Number(mediaIdStr);
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
    },
    onError: (error) => {
      console.error("Erro ao alterar favorito:", error);
      toast.error(messages.toggleError);
    },
  });

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearchMode(true);
    setActiveSearch(searchQuery);

    queryClient.removeQueries({
      queryKey: [mediaType, "media", "search", searchQuery],
    });
  }, [searchQuery, queryClient]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveSearch("");
    setIsSearchMode(false);
  }, []);

  const handleCategoryChange = useCallback(
    (category: C) => {
      if (category === categoryFilter) return;

      setCategoryFilter(category);
      setIsSearchMode(false);
      setSearchQuery("");
      setActiveSearch("");
    },
    [categoryFilter],
  );

  const handleToggleFavorite = useCallback(
    (mediaId: number) => {
      toggleFavoriteMutation.mutate(mediaId.toString());
    },
    [toggleFavoriteMutation],
  );

  const loadMoreItems = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const initialize = useCallback(async () => {
    favoriteStatusRef.current = {};
    favoriteInFlightRef.current.clear();
    setFavoriteStatus({});
    await refetch();
  }, [refetch]);

  return {
    items: !isSearchMode ? fetchedItems : [],
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    favoriteStatus,
    searchQuery,
    setSearchQuery,
    isSearching: isFetching && isSearchMode,
    searchResults: isSearchMode ? fetchedItems : [],
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
