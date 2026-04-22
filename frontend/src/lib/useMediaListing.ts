import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TmdbPage } from "./types";
import { RatingStatus } from "./api";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import AuthService from "./auth";

const MAX_CONCURRENCY = 5;
const BATCH_SIZE = 50;

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
  getFavoriteStatuses?: (ids: string[]) => Promise<Record<string, boolean>>;
  toggleFavorite: (id: string) => Promise<{ isFavorite: boolean }>;
  getRatingStatuses?: (ids: string[]) => Promise<Record<string, RatingStatus>>;
  messages: ListingMessages;
}

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

export function useMediaListing<T extends { id: number }, C extends string>({
  mediaType,
  initialCategory,
  loadByCategory,
  searchMedia,
  getFavoriteStatus,
  getFavoriteStatuses,
  toggleFavorite,
  getRatingStatuses,
  messages,
}: UseMediaListingParams<T, C>) {
  const queryClient = useQueryClient();

  const [categoryFilter, setCategoryFilter] = useState<C>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>({});
  const favoriteStatusRef = useRef<Record<number, boolean>>({});
  const favoriteInFlightRef = useRef<Set<number>>(new Set());

  const [ratingStatus, setRatingStatus] = useState<Record<number, RatingStatus | null>>({});
  const ratingStatusRef = useRef<Record<number, RatingStatus | null>>({});
  const ratingInFlightRef = useRef<Set<number>>(new Set());

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

  // Carrega status de favoritos em batch para itens novos
  useEffect(() => {
    if (fetchedItems.length === 0 || !AuthService.isAuthenticated()) return;

    const pending = fetchedItems.filter(
      (media) =>
        favoriteStatusRef.current[media.id] === undefined &&
        !favoriteInFlightRef.current.has(media.id),
    );

    if (pending.length === 0) return;

    pending.forEach((m) => favoriteInFlightRef.current.add(m.id));

    const clearInFlight = () =>
      pending.forEach((m) => favoriteInFlightRef.current.delete(m.id));

    const applyStatuses = (statuses: Record<string, boolean>, ids: string[]) => {
      setFavoriteStatus((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          const numId = Number(id);
          const val = Boolean(statuses[id]);
          next[numId] = val;
          favoriteStatusRef.current[numId] = val;
        });
        return next;
      });
    };

    if (getFavoriteStatuses) {
      const chunks = chunkArray(
        pending.map((m) => m.id.toString()),
        BATCH_SIZE,
      );

      (async () => {
        try {
          for (const chunk of chunks) {
            const statuses = await getFavoriteStatuses(chunk);
            applyStatuses(statuses, chunk);
          }
        } catch {
          // fallback individual
          const queue = [...pending];
          const workers = Math.min(MAX_CONCURRENCY, queue.length);
          const runWorker = async () => {
            while (queue.length > 0) {
              const media = queue.shift()!;
              try {
                const isFav = await getFavoriteStatus(media.id.toString());
                favoriteStatusRef.current[media.id] = isFav;
                setFavoriteStatus((prev) => ({ ...prev, [media.id]: isFav }));
              } catch {
                favoriteStatusRef.current[media.id] = false;
                setFavoriteStatus((prev) => ({ ...prev, [media.id]: false }));
              }
            }
          };
          await Promise.all(Array.from({ length: workers }, runWorker));
        } finally {
          clearInFlight();
        }
      })();
      return;
    }

    // sem endpoint batch: workers paralelos
    const queue = [...pending];
    const workers = Math.min(MAX_CONCURRENCY, queue.length);
    const runWorker = async () => {
      while (queue.length > 0) {
        const media = queue.shift()!;
        try {
          const isFav = await getFavoriteStatus(media.id.toString());
          favoriteStatusRef.current[media.id] = isFav;
          setFavoriteStatus((prev) => ({ ...prev, [media.id]: isFav }));
        } catch {
          favoriteStatusRef.current[media.id] = false;
          setFavoriteStatus((prev) => ({ ...prev, [media.id]: false }));
        } finally {
          favoriteInFlightRef.current.delete(media.id);
        }
      }
    };
    Array.from({ length: workers }).forEach(runWorker);
  }, [fetchedItems, getFavoriteStatus]);

  // Carrega avaliações do usuário em batch para itens novos
  useEffect(() => {
    if (fetchedItems.length === 0 || !AuthService.isAuthenticated()) return;
    if (!getRatingStatuses) return;

    const pending = fetchedItems.filter(
      (media) =>
        ratingStatusRef.current[media.id] === undefined &&
        !ratingInFlightRef.current.has(media.id),
    );

    if (pending.length === 0) return;

    pending.forEach((m) => ratingInFlightRef.current.add(m.id));

    const chunks = chunkArray(
      pending.map((m) => m.id.toString()),
      BATCH_SIZE,
    );

    (async () => {
      try {
        for (const chunk of chunks) {
          const statuses = await getRatingStatuses(chunk);
          setRatingStatus((prev) => {
            const next = { ...prev };
            chunk.forEach((id) => {
              const numId = Number(id);
              const val = statuses[id] ?? null;
              next[numId] = val;
              ratingStatusRef.current[numId] = val;
            });
            return next;
          });
        }
      } catch {
        // silently mark as null so the card renders without rating badge
        pending.forEach((m) => {
          ratingStatusRef.current[m.id] = null;
          setRatingStatus((prev) => ({ ...prev, [m.id]: null }));
        });
      } finally {
        pending.forEach((m) => ratingInFlightRef.current.delete(m.id));
      }
    })();
  }, [fetchedItems, getRatingStatuses]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: (mediaId: string) => toggleFavorite(mediaId),
    onSuccess: (response, mediaIdStr) => {
      const mediaId = Number(mediaIdStr);
      setFavoriteStatus((prev) => ({ ...prev, [mediaId]: response.isFavorite }));
      favoriteStatusRef.current[mediaId] = response.isFavorite;
      toast.success(
        response.isFavorite ? messages.toggleAddSuccess : messages.toggleRemoveSuccess,
      );
    },
    onError: () => {
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
    ratingStatusRef.current = {};
    ratingInFlightRef.current.clear();
    setFavoriteStatus({});
    setRatingStatus({});
    await refetch();
  }, [refetch]);

  // Atualiza o rating local após o usuário avaliar (sem refetch)
  const updateRatingStatus = useCallback((mediaId: number, status: RatingStatus | null) => {
    ratingStatusRef.current[mediaId] = status;
    setRatingStatus((prev) => ({ ...prev, [mediaId]: status }));
  }, []);

  return {
    items: !isSearchMode ? fetchedItems : [],
    loading: isLoading,
    loadingMore: isFetchingNextPage,
    favoriteStatus,
    ratingStatus,
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
    updateRatingStatus,
  };
}
