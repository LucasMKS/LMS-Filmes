"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { MediaCard } from "@/components/MediaCard";
import { MovieDialog } from "@/components/MovieDialog";
import { SerieDialog } from "@/components/SerieDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FolderHeart,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Film,
  Tv,
  ListFilter,
  Search,
  Sparkles,
  BookmarkX,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AuthService, { getUserSlug } from "@/lib/auth";
import {
  getUserLists,
  fetchUserLists,
  createCustomList,
  updateCustomList,
  deleteCustomList,
  addItemToCustomList,
  removeItemFromCustomList,
  isItemInList,
  useListsListener,
  notifyListsChanged,
  CustomList,
  CustomListItem,
} from "@/lib/userLists";
import { moviesApi, seriesApi, ratingMoviesApi, ratingSeriesApi } from "@/lib/api";
import { TmdbMovie, TmdbSerie, User } from "@/lib/types";
import Image from "next/image";

export default function UserListsPage() {
  const router = useRouter();
  const params = useParams();
  const urlListId = params?.id as string | undefined;

  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [lists, setLists] = useState<CustomList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [selectedListId, setSelectedListId] = useState<string | null>(urlListId || null);

  useEffect(() => {
    if (urlListId) {
      setSelectedListId(urlListId);
    }
  }, [urlListId]);

  const handleSelectList = (id: string | null) => {
    setSelectedListId(id);
    const slug = getUserSlug(user);
    if (id) {
      router.push(`/${slug}/listas/${id}`);
    } else {
      router.push(`/${slug}/listas`);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "movie" | "serie">("all");

  // State for Create/Edit Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<CustomList | null>(null);
  const [listNameInput, setListNameInput] = useState("");
  const [listDescInput, setListDescInput] = useState("");

  // State for Delete Modal
  const [deletingList, setDeletingList] = useState<CustomList | null>(null);

  // State for Media Detail Dialogs
  const [selectedMovie, setSelectedMovie] = useState<{
    tmdb: TmdbMovie;
    details: TmdbMovie | null;
  } | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<{
    tmdb: TmdbSerie;
    details: TmdbSerie | null;
  } | null>(null);
  const [loadingMediaDetails, setLoadingMediaDetails] = useState(false);

  // Quick Add Item Search State inside selected list
  const [addItemSearchQuery, setAddItemSearchQuery] = useState("");
  const [addItemSearchResults, setAddItemSearchResults] = useState<Array<{
    id: string | number;
    type: "movie" | "serie";
    title: string;
    posterPath: string | null;
    backdropPath?: string | null;
    voteAverage?: number;
    releaseYear?: string;
  }>>([]);
  const [isSearchingAddItem, setIsSearchingAddItem] = useState(false);

  useEffect(() => {
    if (!addItemSearchQuery.trim() || addItemSearchQuery.trim().length < 2) {
      setAddItemSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddItem(true);
      try {
        const [moviesRes, seriesRes] = await Promise.all([
          moviesApi.searchMovies(addItemSearchQuery).catch(() => ({ results: [] })),
          seriesApi.searchSeries(addItemSearchQuery).catch(() => ({ results: [] })),
        ]);

        const moviesList = (moviesRes.results || []).slice(0, 5).map((m) => ({
          id: m.id,
          type: "movie" as const,
          title: m.title,
          posterPath: m.poster_path || null,
          backdropPath: m.backdrop_path || null,
          voteAverage: m.vote_average,
          releaseYear: m.release_date ? new Date(m.release_date).getFullYear().toString() : undefined,
        }));

        const seriesList = (seriesRes.results || []).slice(0, 5).map((s) => ({
          id: s.id,
          type: "serie" as const,
          title: s.name,
          posterPath: s.poster_path || null,
          backdropPath: s.backdrop_path || null,
          voteAverage: s.vote_average,
          releaseYear: s.first_air_date ? new Date(s.first_air_date).getFullYear().toString() : undefined,
        }));

        setAddItemSearchResults([...moviesList, ...seriesList]);
      } catch (err) {
        console.error("Erro na busca de títulos:", err);
      } finally {
        setIsSearchingAddItem(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [addItemSearchQuery]);

  const handleAddSearchResultToList = async (item: any) => {
    if (!selectedListId) return;
    const inList = isItemInList(selectedListId, String(item.id), item.type, user?.email);

    let updatedList: CustomList | null = null;
    if (inList) {
      updatedList = await removeItemFromCustomList(selectedListId, String(item.id), item.type, user?.email);
      toast.success(`Removido da lista`);
    } else {
      updatedList = await addItemToCustomList(
        selectedListId,
        {
          id: String(item.id),
          type: item.type,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          voteAverage: item.voteAverage,
          releaseYear: item.releaseYear,
        },
        user?.email
      );
      toast.success(`"${item.title}" adicionado à lista!`);
    }

    if (updatedList) {
      setLists((prevLists) =>
        prevLists.map((l) => (String(l.id) === String(selectedListId) ? updatedList! : l))
      );
    } else {
      setLists(getUserLists(user?.email));
    }
    notifyListsChanged();
  };

  useEffect(() => {
    setIsMounted(true);
    const currentUser = AuthService.getUser();
    setUser(currentUser);
    const cached = getUserLists(currentUser?.email);
    if (cached && cached.length > 0) {
      setLists(cached);
      setIsLoadingLists(false);
    }
    fetchUserLists(currentUser?.email)
      .then((data) => {
        setLists(data);
      })
      .finally(() => {
        setIsLoadingLists(false);
      });
  }, []);

  // Listen to list changes from anywhere in app
  useEffect(() => {
    const cleanup = useListsListener(() => {
      const currentUser = AuthService.getUser();
      setLists(getUserLists(currentUser?.email));
    });
    return cleanup;
  }, []);

  const [userRatingsMap, setUserRatingsMap] = useState<Record<string, { rating: string; comment?: string }>>({});

  const selectedList = lists.find((l) => String(l.id) === String(selectedListId));

  // Fetch ratings for items in selected list
  useEffect(() => {
    if (!selectedList || selectedList.items.length === 0 || !user) return;

    const movieIds = selectedList.items.filter((i) => i.type === "movie").map((i) => String(i.id));
    const serieIds = selectedList.items.filter((i) => i.type === "serie").map((i) => String(i.id));

    (async () => {
      try {
        const [movieRatings, serieRatings] = await Promise.all([
          movieIds.length > 0 ? ratingMoviesApi.getRatingStatuses(movieIds).catch(() => ({})) : Promise.resolve({}),
          serieIds.length > 0 ? ratingSeriesApi.getRatingStatuses(serieIds).catch(() => ({})) : Promise.resolve({}),
        ]);

        const map: Record<string, { rating: string; comment?: string }> = {};
        
        Object.entries(movieRatings).forEach(([id, r]) => {
          if (r && r.rating) {
            map[`movie_${id}`] = { rating: String(r.rating), comment: r.comment };
          }
        });
        Object.entries(serieRatings).forEach(([id, r]) => {
          if (r && r.rating) {
            map[`serie_${id}`] = { rating: String(r.rating), comment: r.comment };
          }
        });

        setUserRatingsMap(map);
      } catch (err) {
        console.error("Erro ao carregar avaliações da lista:", err);
      }
    })();
  }, [selectedList, user]);

  if (!isMounted) return null;

  const currentEmail = user?.email;

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listNameInput.trim()) {
      toast.error("Por favor, informe o nome da lista.");
      return;
    }
    const created = await createCustomList(listNameInput.trim(), listDescInput.trim(), currentEmail);
    if (created) {
      toast.success(`Lista "${created.name}" criada com sucesso!`);
      setLists(getUserLists(currentEmail));
      setListNameInput("");
      setListDescInput("");
      setIsCreateModalOpen(false);
      setSelectedListId(String(created.id));
    }
  };

  const handleRenameList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList || !listNameInput.trim()) return;
    const updated = await updateCustomList(
      editingList.id,
      listNameInput.trim(),
      listDescInput.trim(),
      currentEmail
    );
    if (updated) {
      toast.success(`Lista atualizada com sucesso!`);
      setLists(getUserLists(currentEmail));
    }
    setIsRenameModalOpen(false);
    setEditingList(null);
    setListNameInput("");
    setListDescInput("");
  };

  const handleDeleteList = async () => {
    if (!deletingList) return;
    const success = await deleteCustomList(deletingList.id, currentEmail);
    if (success) {
      toast.success(`Lista "${deletingList.name}" removida.`);
      setLists(getUserLists(currentEmail));
      if (selectedListId === deletingList.id) {
        setSelectedListId(null);
      }
    }
    setDeletingList(null);
  };

  const handleRemoveItem = async (listId: string, item: CustomListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedList = await removeItemFromCustomList(listId, item.id, item.type, currentEmail);
    toast.success(`"${item.title}" removido da lista.`);
    if (updatedList) {
      setLists((prevLists) =>
        prevLists.map((l) => (String(l.id) === String(listId) ? updatedList! : l))
      );
    } else {
      setLists(getUserLists(currentEmail));
    }
    notifyListsChanged();
  };

  const handleOpenItem = async (item: CustomListItem) => {
    setLoadingMediaDetails(true);
    try {
      if (item.type === "movie") {
        const fullDetails = await moviesApi.getMovieDetails(item.id);
        const tmdbData = fullDetails || {
          id: Number(item.id),
          title: item.title,
          original_title: item.title,
          poster_path: item.posterPath,
          backdrop_path: item.backdropPath,
          vote_average: item.voteAverage,
        };
        setSelectedMovie({ tmdb: tmdbData as TmdbMovie, details: fullDetails });
      } else {
        const fullDetails = await seriesApi.getSerieDetails(item.id);
        const tmdbData = fullDetails || {
          id: Number(item.id),
          name: item.title,
          original_name: item.title,
          poster_path: item.posterPath,
          backdrop_path: item.backdropPath,
          vote_average: item.voteAverage,
        };
        setSelectedSerie({ tmdb: tmdbData as TmdbSerie, details: fullDetails });
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do item:", error);
      toast.error("Não foi possível carregar os detalhes.");
    } finally {
      setLoadingMediaDetails(false);
    }
  };

  const filteredItems = selectedList?.items.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-2xl">
                <FolderHeart className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Listas Personalizadas
                </h1>
                <p className="text-sm text-white/50 font-medium mt-0.5">
                  Crie, organize e compartilhe suas seleções de filmes e séries.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setListNameInput("");
              setListDescInput("");
              setIsCreateModalOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl h-11 px-5 shadow-lg shadow-purple-900/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nova Lista
          </Button>
        </div>

        {/* Visão de Detalhes da Lista Selecionada */}
        {selectedList ? (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14141c] border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
              <div className="space-y-2">
                <button
                  onClick={() => handleSelectList(null)}
                  className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para todas as listas
                </button>
                <div className="flex items-center gap-3 pt-1">
                  <h2 className="text-2xl font-black text-white">
                    {selectedList.name}
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                    {selectedList.items.length}{" "}
                    {selectedList.items.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                {selectedList.description && (
                  <p className="text-sm text-white/60 font-medium">
                    {selectedList.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingList(selectedList);
                    setListNameInput(selectedList.name);
                    setListDescInput(selectedList.description || "");
                    setIsRenameModalOpen(true);
                  }}
                  className="border-white/10 hover:bg-white/5 text-white/80 rounded-xl gap-2 text-xs font-semibold"
                >
                  <Pencil className="w-3.5 h-3.5 text-purple-400" />
                  Renomear
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingList(selectedList)}
                  className="border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-xl gap-2 text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Lista
                </Button>
              </div>
            </div>

            {/* Widget de Pesquisa & Resumo da Lista em Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-4">
              {/* Lado Esquerdo: Busca rápida para Adicionar Títulos */}
              <div className="lg:col-span-7 bg-[#14141c] border border-purple-500/20 p-4 rounded-3xl space-y-3 relative z-30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <Plus className="w-4 h-4 text-purple-400" />
                    <span>Adicionar filmes ou séries a esta lista</span>
                  </div>
                  {addItemSearchQuery && (
                    <button
                      onClick={() => {
                        setAddItemSearchQuery("");
                        setAddItemSearchResults([]);
                      }}
                      className="text-[11px] text-white/40 hover:text-white transition-colors"
                    >
                      Limpar busca
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
                  <Input
                    placeholder="Digite o nome do filme ou série (ex: Batman, Breaking Bad)..."
                    value={addItemSearchQuery}
                    onChange={(e) => setAddItemSearchQuery(e.target.value)}
                    className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-white/30 text-xs rounded-2xl h-10 focus:border-purple-500"
                  />

                  {/* Dropdown FLUTUANTE que sobrepõe sem mover a Grid */}
                  {(isSearchingAddItem || addItemSearchResults.length > 0 || (addItemSearchQuery.trim().length >= 2 && !isSearchingAddItem)) && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#12121a]/95 border border-purple-500/30 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl space-y-1.5 max-h-72 overflow-y-auto">
                      {isSearchingAddItem ? (
                        <div className="p-3 text-center text-xs text-white/40 animate-pulse font-medium">
                          Buscando no catálogo...
                        </div>
                      ) : addItemSearchResults.length > 0 ? (
                        addItemSearchResults.map((result) => {
                          const inList = isItemInList(selectedList.id, String(result.id), result.type, user?.email);
                          const posterUrl = result.posterPath
                            ? result.posterPath.startsWith("http")
                              ? result.posterPath
                              : `https://image.tmdb.org/t/p/w92${result.posterPath}`
                            : "/placeholder-movie.jpg";

                          return (
                            <div
                              key={`${result.type}_${result.id}`}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] transition-all"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative w-8 h-11 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/10">
                                  <Image src={posterUrl} alt={result.title} fill className="object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-semibold border", result.type === "movie" ? "bg-purple-500/10 text-purple-300 border-purple-500/20" : "bg-violet-500/10 text-violet-300 border-violet-500/20")}>
                                      {result.type === "movie" ? "Filme" : "Série"}
                                    </span>
                                    {result.releaseYear && <span className="text-[10px] text-white/40 font-medium">{result.releaseYear}</span>}
                                  </div>
                                  <h5 className="text-xs font-bold text-white line-clamp-1 mt-0.5">{result.title}</h5>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddSearchResultToList(result)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5",
                                  inList
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                                )}
                              >
                                {inList ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Adicionado</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    <span>Adicionar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3 text-center text-xs text-white/40 font-medium">
                          Nenhum título encontrado para "{addItemSearchQuery}".
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Lado Direito: Resumo e Estatísticas da Lista */}
              <div className="lg:col-span-5 bg-[#14141c] border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-xl">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Resumo da Seleção
                  </span>
                  <div className="flex items-center gap-3 text-xs text-white/70 font-medium pt-1">
                    <span>Filmes: <strong className="text-white">{selectedList.items.filter(i => i.type === 'movie').length}</strong></span>
                    <span className="text-white/20">•</span>
                    <span>Séries: <strong className="text-white">{selectedList.items.filter(i => i.type === 'serie').length}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-white/40 font-medium block">Última atualização</span>
                  <span className="text-xs font-semibold text-white/80">
                    {new Date(selectedList.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Filtros e Busca dentro da Lista */}
            {selectedList.items.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    placeholder="Buscar nesta lista..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#14141c] border-white/10 text-white placeholder:text-white/30 text-xs rounded-2xl h-10"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-[#14141c] border border-white/10 p-1 rounded-2xl w-full sm:w-auto">
                  <button
                    onClick={() => setTypeFilter("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-1 sm:flex-initial",
                      typeFilter === "all"
                        ? "bg-purple-600 text-white"
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    Todos ({selectedList.items.length})
                  </button>
                  <button
                    onClick={() => setTypeFilter("movie")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-1 sm:flex-initial flex items-center justify-center gap-1",
                      typeFilter === "movie"
                        ? "bg-purple-600 text-white"
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    <Film className="w-3 h-3" />
                    Filmes
                  </button>
                  <button
                    onClick={() => setTypeFilter("serie")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-1 sm:flex-initial flex items-center justify-center gap-1",
                      typeFilter === "serie"
                        ? "bg-purple-600 text-white"
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    <Tv className="w-3 h-3" />
                    Séries
                  </button>
                </div>
              </div>
            )}

            {/* Grid de Itens da Lista (Compacta - Reduzida em ~30%) */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-[#14141c]/50 rounded-3xl border border-dashed border-white/10 space-y-3">
                <BookmarkX className="w-12 h-12 text-white/20 mx-auto" />
                <p className="text-base font-semibold text-white/70">
                  {selectedList.items.length === 0
                    ? "Esta lista ainda não possui nenhum filme ou série."
                    : "Nenhum item corresponde ao filtro atual."}
                </p>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Navegue pelo catálogo de filmes e séries e clique no botão de lista para adicionar itens aqui!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                {filteredItems.map((item) => {
                  const posterUrl = item.posterPath
                    ? item.posterPath.startsWith("http")
                      ? item.posterPath
                      : `https://image.tmdb.org/t/p/w500${item.posterPath}`
                    : "/placeholder-movie.jpg";

                  const itemUserRating = userRatingsMap[`${item.type}_${item.id}`] || null;

                  return (
                    <div key={`${item.type}_${item.id}`} className="relative group">
                      <MediaCard
                        imageUrl={posterUrl}
                        altText={item.title}
                        title={item.title}
                        subtitle={item.releaseYear ? `Ano: ${item.releaseYear}` : item.type === "movie" ? "Filme" : "Série"}
                        onClick={() => handleOpenItem(item)}
                        userRating={itemUserRating}
                        badgeLabel={item.type === "movie" ? "Filme" : "Série"}
                        badgeIcon={item.type === "movie" ? Film : Tv}
                        badgeClassName={item.type === "movie" ? "bg-purple-500/80 text-white" : "bg-violet-500/80 text-white"}
                        overlayRating={item.voteAverage}
                      />

                      {/* Botão flutuante para remover item da lista */}
                      <button
                        onClick={(e) => handleRemoveItem(selectedList.id, item, e)}
                        title="Remover desta lista"
                        className="absolute top-2 right-2 z-20 p-2 rounded-xl bg-black/70 hover:bg-red-600 text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Visão Geral das Listas */
          <div className="mt-8">
            {isLoadingLists ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-[#14141c] border border-white/[0.06] rounded-3xl p-5 space-y-4 animate-pulse"
                  >
                    <div className="aspect-[16/9] w-full bg-white/5 rounded-2xl" />
                    <div className="space-y-2">
                      <div className="h-5 bg-white/10 rounded-lg w-3/4" />
                      <div className="h-3.5 bg-white/5 rounded-lg w-1/2" />
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-20 bg-[#14141c]/40 rounded-3xl border border-dashed border-white/10 space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
                  <FolderHeart className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    Nenhuma lista criada ainda
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed px-6">
                    Você pode criar listas personalizadas como "Para Assistir", "Melhores Filmes de Terror" ou "Maratona de Fim de Semana".
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setListNameInput("");
                    setListDescInput("");
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl px-6 h-11 shadow-lg shadow-purple-900/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar minha primeira lista
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {lists.map((list) => {
                  const itemsCount = list.items.length;
                  const coverPosters = list.items
                    .slice(0, 4)
                    .map((item) =>
                      item.posterPath
                        ? item.posterPath.startsWith("http")
                          ? item.posterPath
                          : `https://image.tmdb.org/t/p/w300${item.posterPath}`
                        : "/placeholder-movie.jpg"
                    );

                  return (
                    <div
                      key={list.id}
                      onClick={() => handleSelectList(list.id)}
                      className="group relative bg-[#14141c] border border-white/[0.08] hover:border-purple-500/40 rounded-3xl p-5 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/20 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Efeito Glow Topo */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="space-y-4">
                        {/* Colagem de capas */}
                        <div className="relative aspect-[16/9] w-full bg-black/40 rounded-2xl overflow-hidden border border-white/5 grid grid-cols-2 gap-0.5">
                          {coverPosters.length > 0 ? (
                            coverPosters.map((poster, idx) => (
                              <div key={idx} className="relative w-full h-full bg-white/5">
                                <Image
                                  src={poster}
                                  alt="Capa da lista"
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 flex items-center justify-center bg-white/[0.02]">
                              <ListFilter className="w-10 h-10 text-white/10" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-transparent to-transparent opacity-40" />
                        </div>

                        {/* Informações da lista */}
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                              {list.name}
                            </h3>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-white/60 font-semibold border border-white/10 flex-shrink-0">
                              {itemsCount} {itemsCount === 1 ? "item" : "itens"}
                            </span>
                          </div>
                          {list.description && (
                            <p className="text-xs text-white/50 line-clamp-2 mt-1.5 font-medium">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Rodapé do Card com Ações */}
                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                        <span className="font-medium">
                          Atualizada em{" "}
                          {new Date(list.updatedAt).toLocaleDateString("pt-BR")}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingList(list);
                              setListNameInput(list.name);
                              setListDescInput(list.description || "");
                              setIsRenameModalOpen(true);
                            }}
                            title="Renomear Lista"
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingList(list);
                            }}
                            title="Excluir Lista"
                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Criar Lista */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <FolderHeart className="w-5 h-5 text-purple-400" />
              Criar Nova Lista
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateList} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">
                Nome da Lista *
              </label>
              <Input
                placeholder="Ex: Minhas Maratonas do Fim de Semana"
                value={listNameInput}
                onChange={(e) => setListNameInput(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl h-10"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">
                Descrição (opcional)
              </label>
              <Input
                placeholder="Ex: Filmes premiados e séries que quero assistir em 2026"
                value={listDescInput}
                onChange={(e) => setListDescInput(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl h-10"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold px-5"
              >
                Criar Lista
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Renomear Lista */}
      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Pencil className="w-5 h-5 text-purple-400" />
              Renomear Lista
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRenameList} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">
                Nome da Lista *
              </label>
              <Input
                placeholder="Nome da lista"
                value={listNameInput}
                onChange={(e) => setListNameInput(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl h-10"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">
                Descrição
              </label>
              <Input
                placeholder="Descrição da lista"
                value={listDescInput}
                onChange={(e) => setListDescInput(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl h-10"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRenameModalOpen(false)}
                className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold px-5"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão de Lista */}
      <Dialog open={!!deletingList} onOpenChange={(open) => !open && setDeletingList(null)}>
        <DialogContent className="sm:max-w-md bg-[#0f0f15] border border-white/10 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Excluir Lista
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-white/70 my-2">
            Tem certeza que deseja excluir a lista{" "}
            <span className="font-bold text-white">"{deletingList?.name}"</span>? Esta ação não pode ser desfeita.
          </p>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingList(null)}
              className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteList}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold px-5"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogs de Filme e Série */}
      {selectedMovie && (
        <MovieDialog
          movie={selectedMovie.tmdb}
          movieDetails={selectedMovie.details}
          isOpen={!!selectedMovie}
          onClose={() => setSelectedMovie(null)}
          isLoggedIn={!!user}
          onRateSuccess={(rating, comment) => {
            if (selectedMovie) {
              const key = `movie_${selectedMovie.tmdb.id}`;
              setUserRatingsMap((prev) => ({
                ...prev,
                [key]: { rating, comment },
              }));
            }
          }}
        />
      )}

      {selectedSerie && (
        <SerieDialog
          serie={selectedSerie.tmdb}
          serieDetails={selectedSerie.details}
          isOpen={!!selectedSerie}
          onClose={() => setSelectedSerie(null)}
          isLoggedIn={!!user}
          onRateSuccess={(rating, comment) => {
            if (selectedSerie) {
              const key = `serie_${selectedSerie.tmdb.id}`;
              setUserRatingsMap((prev) => ({
                ...prev,
                [key]: { rating, comment },
              }));
            }
          }}
        />
      )}
    </div>
  );
}
