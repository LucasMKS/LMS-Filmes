"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dices, Check, Trash2, ListVideo, LayoutGrid, List } from "lucide-react";
import { RatingDialog } from "../../components/RatingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { watchlistMoviesApi, moviesApi } from "../../lib/api";
import MovieService from "../../lib/movieService";
import AuthService from "../../lib/auth";
import { EnrichedWatchlistMovie } from "../../lib/types";
import { cn } from "@/lib/utils";
 
export default function WatchlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuth = AuthService.isAuthenticated();
 
  const [randomItem, setRandomItem] = useState<any | null>(null);
  const [isRandomDialogOpen, setIsRandomDialogOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
 
  const [ratingItem, setRatingItem] = useState<EnrichedWatchlistMovie | null>(null);
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    const saved = localStorage.getItem("lms_watchlist_layout");
    if (saved === "grid" || saved === "list") {
      setLayoutMode(saved);
    }
  }, []);

  const toggleLayout = (mode: "list" | "grid") => {
    setLayoutMode(mode);
    localStorage.setItem("lms_watchlist_layout", mode);
  };
 
  const { data: movies = [], isLoading: loadingMovies } = useQuery({
    queryKey: ["watchlist", "movies"],
    queryFn: async () => {
      const response = await watchlistMoviesApi.getWatchlistMovies();
      const enriched = await Promise.all(
        response.map(async (item: any) => {
          try {
            const tmdbData = await moviesApi.getMovieDetails(item.movieId);
            return {
              type: "movie",
              id: item.movieId,
              internalId: item.id,
              title: tmdbData.title,
              poster: tmdbData.poster_path
                ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
                : "/placeholder-movie.jpg",
              backdrop: tmdbData.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}`
                : null,
              overview: tmdbData.overview || "Nenhuma sinopse disponível.",
              genres: tmdbData.genres?.map((g) => g.name).slice(0, 3) || [],
              year: tmdbData.release_date
                ? new Date(tmdbData.release_date).getFullYear().toString()
                : "N/A",
              tmdbData,
              addedAt: item.addedAt,
              status: item.status,
            };
          } catch {
            return null;
          }
        }),
      );
      return enriched.filter(Boolean) as EnrichedWatchlistMovie[];
    },
    enabled: isAuth,
  });
 
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return watchlistMoviesApi.toggleWatchlist(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["watchlist", "movies"],
      });
    },
  });
 
  const handleRateSubmit = async (ratingString: string, comment?: string) => {
    if (!ratingItem) return;
    try {
      const ratingValue = parseFloat(ratingString);
      await MovieService.rateMovie(
        ratingItem.tmdbData.id,
        ratingValue,
        ratingItem.title,
        ratingItem.tmdbData.poster_path || "",
        comment,
      );
      removeMutation.mutate(ratingItem.id);
      toast.success("Avaliação salva com sucesso!", {
        description: "O filme foi removido da sua Watchlist automaticamente.",
      });
      setRatingItem(null);
    } catch (error) {
      console.error("Erro ao avaliar na watchlist:", error);
      toast.error("Erro ao salvar avaliação.", {
        description: "A nota não foi salva. Tente novamente.",
      });
      throw error;
    }
  };
 
  const handleRandomPick = () => {
    if (movies.length === 0) {
      toast.error("Sua lista está vazia!", { description: "Adicione títulos para usar a roleta." });
      return;
    }
    setIsRandomDialogOpen(true);
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * movies.length);
      setRandomItem(movies[randomIndex]);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };
 
  const handleMarkAsWatched = (item: EnrichedWatchlistMovie) => {
    setRatingItem(item);
  };
 
  const handleNavigate = (id: string) => {
    router.push(`/filmes/${id}`);
  };
 
  const formatAddedAt = (dateStr?: string) => {
    if (!dateStr) return "Adicionado recentemente";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Adicionado recentemente";
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          if (diffMins < 5) return "Adicionado agora mesmo";
          return `Adicionado há ${diffMins} min`;
        }
        return `Adicionado há ${diffHours}h`;
      }
      if (diffDays === 1) return "Adicionado ontem";
      if (diffDays < 7) return `Adicionado há ${diffDays} dias`;
      
      return `Adicionado em ${date.toLocaleDateString("pt-BR")}`;
    } catch {
      return "Adicionado recentemente";
    }
  };
 
  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:mb-10 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-white">
              <ListVideo className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
              Minha Watchlist (Filmes)
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/35">
              Filmes que você separou para assistir em breve.
            </p>
          </div>
 
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Seletor de Layout (Lista vs Grid) */}
            <div className="flex items-center gap-1 bg-[#14141c] border border-white/10 p-1 rounded-2xl">
              <button
                onClick={() => toggleLayout("list")}
                title="Visualização em Lista"
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  layoutMode === "list"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleLayout("grid")}
                title="Visualização em Grid (3 por linha)"
                className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  layoutMode === "grid"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleRandomPick}
              disabled={loadingMovies || isSpinning}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] duration-200 text-sm"
            >
              <Dices className="w-4 h-4 sm:w-5 sm:h-5" />
              Escolher Aleatório
            </button>
          </div>
        </div>
 
        {/* Conteúdo */}
        {loadingMovies ? (
          <div className={layoutMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" : "space-y-4"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn("bg-[#14141c] rounded-2xl border border-white/[0.06] flex animate-pulse", layoutMode === "grid" ? "h-72 flex-col" : "h-40 w-full")}>
                <Skeleton className={layoutMode === "grid" ? "w-full h-40 rounded-t-2xl" : "w-28 sm:w-36 h-full rounded-l-2xl"} />
                <div className="flex-1 p-5 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {movies.length === 0 ? (
              <div className="py-16 sm:py-20 text-center border-2 border-dashed border-white/[0.06] text-white/35 rounded-2xl px-4">
                Nenhum filme adicionado à watchlist ainda.{" "}
                <br className="hidden sm:block" />
                Navegue pelo catálogo e clique em "Add à Watchlist" para salvar!
              </div>
            ) : layoutMode === "grid" ? (
              /* MODO GRID (3 por linha em desktop) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {movies.map((item) => (
                  <div
                    key={item.internalId}
                    className="group relative bg-[#14141c] border border-white/[0.06] hover:border-emerald-500/40 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/20"
                  >
                    <Link
                      href={`/filmes/${item.id}`}
                      className="absolute inset-0 z-0 cursor-pointer"
                      aria-label={`Ver detalhes de ${item.title}`}
                    />
                    {/* Glow decorativo no topo */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

                    {/* Capa Grid */}
                    <div className="relative aspect-[16/10] w-full bg-white/5 overflow-hidden pointer-events-none">
                      <Image
                        src={item.backdrop || item.poster}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-[#14141c]/40 to-transparent" />
                      
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-purple-500/80 text-white backdrop-blur-md text-[10px] font-bold tracking-wide">
                        Filme
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMutation.mutate(item.id);
                          toast.success("Removido da Watchlist");
                        }}
                        disabled={removeMutation.isPending}
                        title="Remover da Watchlist"
                        className="pointer-events-auto absolute top-3 right-3 p-1.5 rounded-xl bg-black/60 hover:bg-red-600 text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 z-20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Conteúdo compacto Grid (sem a descrição) */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 pointer-events-none">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-white/40 mt-1">
                          <span className="font-semibold text-white/60">{item.year}</span>
                          <span>•</span>
                          <span>{formatAddedAt(item.addedAt)}</span>
                        </div>
                      </div>

                      {/* Botões de Ação Grid */}
                      <div className="flex gap-2 pt-1 pointer-events-auto z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsWatched(item);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/20 text-xs font-semibold transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Assisti e Avaliar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* MODO LISTA */
              <div className="space-y-4">
                {movies.map((item) => (
                  <div
                    key={item.internalId}
                    className="relative overflow-hidden transition-all duration-300 border border-white/[0.06] bg-[#14141c] hover:border-white/10 hover:shadow-xl group rounded-2xl"
                  >
                    <Link
                      href={`/filmes/${item.id}`}
                      className="absolute inset-0 z-0 cursor-pointer"
                      aria-label={`Ver detalhes de ${item.title}`}
                    />
                    {item.backdrop && (
                      <div className="hidden sm:block absolute inset-0 z-0 pointer-events-none">
                        <Image
                          src={item.backdrop}
                          alt=""
                          fill
                          className="object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#14141c] via-[#14141c]/95 to-[#14141c]/40" />
                      </div>
                    )}

                    <div className="relative z-10 flex flex-row items-stretch p-0 pointer-events-none">
                      {/* Pôster */}
                      <div className="relative shrink-0 w-24 sm:w-28 md:w-36 aspect-[2/3]">
                        <Image
                          src={item.poster}
                          alt={item.title}
                          fill
                          className="object-cover rounded-l-2xl"
                        />
                      </div>

                      {/* Informações */}
                      <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5 justify-between min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                            <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] sm:text-xs font-semibold">
                              Filme
                            </span>
                            <h3 className="mb-1 text-base sm:text-lg md:text-xl font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-white/40 mb-2">
                              <span className="font-semibold text-white/60">{item.year}</span>
                              <span className="hidden sm:flex items-center gap-1">
                                <span className="mx-1">•</span>
                                {formatAddedAt(item.addedAt)}
                              </span>
                            </div>

                            <div className="hidden md:flex flex-wrap gap-2 mb-2">
                              {item.genres.map((g) => (
                                <span
                                  key={g}
                                  className="text-[10px] text-white/50 border border-white/[0.06] bg-white/5 rounded-lg px-2 py-0.5"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                            <p className="hidden md:block text-white/35 text-sm line-clamp-2 leading-relaxed">
                              {item.overview}
                            </p>
                          </div>

                          {/* Botões Desktop */}
                          <div className="hidden sm:flex flex-col gap-2 shrink-0 pointer-events-auto z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsWatched(item);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/20 text-sm font-medium transition-all"
                            >
                              <Check className="w-4 h-4" /> Assisti e Avaliar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeMutation.mutate(item.id);
                                toast.success("Removido da Watchlist");
                              }}
                              disabled={removeMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/35 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-sm font-medium transition-all disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" /> Remover
                            </button>
                          </div>
                        </div>

                        {/* Botões Mobile */}
                        <div className="flex sm:hidden gap-2 mt-auto pt-2 pointer-events-auto z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsWatched(item);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Avaliar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMutation.mutate(item.id);
                              toast.success("Removido da Watchlist");
                            }}
                            disabled={removeMutation.isPending}
                            className="px-3 py-1.5 rounded-xl text-white/35 hover:text-red-400 bg-white/5 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* Modal da Roleta */}
      {isRandomDialogOpen && randomItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#14141c] border border-white/[0.06] p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl transition-all duration-300">
            <h2 className="mb-2 text-xl sm:text-2xl font-bold text-white">
              {isSpinning ? "Girando a Roleta..." : "A Roleta Escolheu!"}
            </h2>
            <p className="mb-6 text-sm sm:text-base text-white/35">
              {isSpinning ? "Buscando nos seus interesses..." : "Você vai assistir:"}
            </p>
 
            <Image
              src={randomItem.poster}
              width={200}
              height={300}
              className={cn(
                "object-cover mx-auto mb-6 border-4 rounded-xl shadow-xl w-40 h-60 sm:w-48 sm:h-72 transition-all duration-200",
                isSpinning
                  ? "border-white/10 scale-90 opacity-60 blur-[3px]"
                  : "border-emerald-500 scale-100 opacity-100 blur-0",
              )}
              alt="Pôster Sorteado"
            />
 
            <h3 className="mb-6 text-lg sm:text-xl font-bold text-white line-clamp-2">
              {randomItem.title}
            </h3>
 
            <div className="flex gap-3">
              <button
                onClick={() => { setIsRandomDialogOpen(false); setRandomItem(null); }}
                disabled={isSpinning}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm font-medium transition-all disabled:opacity-50"
              >
                Fechar
              </button>
              <button
                disabled={isSpinning}
                onClick={() => { setIsRandomDialogOpen(false); handleMarkAsWatched(randomItem); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Avaliar
              </button>
            </div>
          </div>
        </div>
      )}
 
      <RatingDialog
        isOpen={!!ratingItem}
        onClose={() => setRatingItem(null)}
        onSubmit={handleRateSubmit}
        itemTitle={ratingItem?.title || ""}
        itemType="filme"
        itemId={ratingItem?.tmdbData.id || 0}
        currentRating={null}
      />
    </div>
  );
}
