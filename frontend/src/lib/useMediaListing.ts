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
  getWatchlistStatuses?: (ids: string[]) => Promise<Record<string, boolean>>;
  toggleWatchlist: (id: string) => Promise<{ inWatchlist: boolean }>;
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
  getWatchlistStatuses,
  toggleWatchlist,
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

  const [watchlistStatus, setWatchlistStatus] = useState<Record<number, boolean>>({});
  const watchlistStatusRef = useRef<Record<number, boolean>>({});
  const watchlistInFlightRef = useRef<Set<number>>(new Set());

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

  // Carrega status de watchlist em batch para itens novos
  useEffect(() => {
    if (fetchedItems.length === 0 || !AuthService.isAuthenticated() || !getWatchlistStatuses) return;

    const pending = fetchedItems.filter(
      (media) =>
        watchlistStatusRef.current[media.id] === undefined &&
        !watchlistInFlightRef.current.has(media.id),
    );

    if (pending.length === 0) return;

    pending.forEach((m) => watchlistInFlightRef.current.add(m.id));

    const chunks = chunkArray(
      pending.map((m) => m.id.toString()),
      BATCH_SIZE,
    );

    (async () => {
      try {
        for (const chunk of chunks) {
          const statuses = await getWatchlistStatuses(chunk);
          setWatchlistStatus((prev) => {
            const next = { ...prev };
            chunk.forEach((id) => {
              const numId = Number(id);
              const val = Boolean(statuses[id]);
              next[numId] = val;
              watchlistStatusRef.current[numId] = val;
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Erro ao carregar status da watchlist:", err);
      } finally {
        pending.forEach((m) => watchlistInFlightRef.current.delete(m.id));
      }
    })();
  }, [fetchedItems, getWatchlistStatuses]);

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
    mutationFn: async (mediaId: string) => {
      const { toggleFavoriteAction } = await import("@/app/actions");
      return toggleFavoriteAction(mediaId, mediaType);
    },
    onMutate: async (mediaIdStr) => {
      const mediaId = Number(mediaIdStr);
      // Cancelar refetches em andamento para não sobrescrever o estado otimista
      await queryClient.cancelQueries({ queryKey: [mediaType, "media"] });

      // Salvar estado anterior
      const previousStatus = favoriteStatusRef.current[mediaId];
      const newStatus = !previousStatus;

      // Atualizar estado local instantaneamente
      setFavoriteStatus((prev) => ({ ...prev, [mediaId]: newStatus }));
      favoriteStatusRef.current[mediaId] = newStatus;

      return { previousStatus, mediaId };
    },
    onSuccess: (result, mediaIdStr) => {
      if (result.success && result.data) {
        const mediaId = Number(mediaIdStr);
        // Garantir que o estado final condiz com o servidor
        setFavoriteStatus((prev) => ({ ...prev, [mediaId]: result.data!.isFavorite }));
        favoriteStatusRef.current[mediaId] = result.data!.isFavorite;
        
        if (result.data!.isFavorite) {
          import("@/lib/celebrations").then(({ celebrateAction }) => celebrateAction("favorite"));
        }

        toast.success(
          result.data!.isFavorite ? messages.toggleAddSuccess : messages.toggleRemoveSuccess,
        );
      } else {
        toast.error(result.error || messages.toggleError);
      }
    },
    onError: (err, mediaIdStr, context) => {
      // Reverter em caso de erro
      if (context) {
        setFavoriteStatus((prev) => ({ ...prev, [context.mediaId]: context.previousStatus }));
        favoriteStatusRef.current[context.mediaId] = context.previousStatus;
      }
      toast.error(messages.toggleError);
    },
  });

  const toggleWatchlistMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      const { toggleWatchlistAction } = await import("@/app/actions");
      return toggleWatchlistAction(mediaId, mediaType);
    },
    onMutate: async (mediaIdStr) => {
      const mediaId = Number(mediaIdStr);
      await queryClient.cancelQueries({ queryKey: [mediaType, "media"] });

      const previousStatus = watchlistStatusRef.current[mediaId];
      const newStatus = !previousStatus;

      setWatchlistStatus((prev) => ({ ...prev, [mediaId]: newStatus }));
      watchlistStatusRef.current[mediaId] = newStatus;

      return { previousStatus, mediaId };
    },
    onSuccess: (result, mediaIdStr) => {
      if (result.success && result.data) {
        const mediaId = Number(mediaIdStr);
        setWatchlistStatus((prev) => ({ ...prev, [mediaId]: result.data!.inWatchlist }));
        watchlistStatusRef.current[mediaId] = result.data!.inWatchlist;
        queryClient.invalidateQueries({ queryKey: ["watchlist"] });

        if (result.data!.inWatchlist) {
          import("@/lib/celebrations").then(({ celebrateAction }) => celebrateAction("watchlist"));
        }

        toast.success(
          result.data!.inWatchlist ? "Adicionado à sua Watchlist!" : "Removido da Watchlist!",
        );
      } else {
        toast.error(result.error || "Erro ao atualizar a Watchlist.");
      }
    },
    onError: (err, mediaIdStr, context) => {
      if (context) {
        setWatchlistStatus((prev) => ({ ...prev, [context.mediaId]: context.previousStatus }));
        watchlistStatusRef.current[context.mediaId] = context.previousStatus;
      }
      toast.error("Erro ao atualizar a Watchlist.");
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

  const handleToggleWatchlist = useCallback(
    (mediaId: number) => {
      toggleWatchlistMutation.mutate(mediaId.toString());
    },
    [toggleWatchlistMutation],
  );

  const loadMoreItems = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const initialize = useCallback(async () => {
    favoriteStatusRef.current = {};
    favoriteInFlightRef.current.clear();
    watchlistStatusRef.current = {};
    watchlistInFlightRef.current.clear();
    ratingStatusRef.current = {};
    ratingInFlightRef.current.clear();
    setFavoriteStatus({});
    setWatchlistStatus({});
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
    watchlistStatus,
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
    handleToggleWatchlist,
    updateRatingStatus,
  };
}
