"use client";
 
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dices, Check, Trash2, Tv } from "lucide-react";
import { RatingDialog } from "@/components/RatingDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { watchlistSeriesApi, seriesApi } from "@/lib/api";
import MovieService from "@/lib/movieService";
import AuthService from "@/lib/auth";
import { EnrichedWatchlistSerie } from "@/lib/types";
import { cn } from "@/lib/utils";
 
export default function SeriesAcompanhandoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuth = AuthService.isAuthenticated();
 
  const [randomItem, setRandomItem] = useState<any | null>(null);
  const [isRandomDialogOpen, setIsRandomDialogOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
 
  const [ratingItem, setRatingItem] = useState<EnrichedWatchlistSerie | null>(null);
 
  const { data: series = [], isLoading: loadingSeries } = useQuery({
    queryKey: ["watchlist", "series"],
    queryFn: async () => {
      const response = await watchlistSeriesApi.getWatchlistSeries();
      const enriched = await Promise.all(
        response.map(async (item: any) => {
          try {
            const tmdbData = await seriesApi.getSerieDetails(item.serieId);
            return {
              type: "serie",
              id: item.serieId,
              internalId: item.id,
              title: tmdbData.name,
              poster: tmdbData.poster_path
                ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
                : "/placeholder-movie.jpg",
              backdrop: tmdbData.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}`
                : null,
              overview: tmdbData.overview || "Nenhuma sinopse disponível.",
              genres: tmdbData.genres?.map((g) => g.name).slice(0, 3) || [],
              year: tmdbData.first_air_date
                ? new Date(tmdbData.first_air_date).getFullYear().toString()
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
      return enriched.filter(Boolean) as EnrichedWatchlistSerie[];
    },
    enabled: isAuth,
  });
 
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      return watchlistSeriesApi.toggleWatchlist(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["watchlist", "series"],
      });
    },
  });
 
  const handleRateSubmit = async (ratingString: string, comment?: string) => {
    if (!ratingItem) return;
    try {
      const ratingValue = parseFloat(ratingString);
      await MovieService.rateSerie(
        ratingItem.tmdbData.id,
        ratingValue,
        ratingItem.title,
        ratingItem.tmdbData.poster_path || "",
        comment,
      );
      toast.success("Avaliação salva com sucesso!", {
        description: "A série foi avaliada e continua sendo acompanhada.",
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
    if (series.length === 0) {
      toast.error("Sua lista de séries acompanhadas está vazia!", { description: "Adicione séries para usar a roleta." });
      return;
    }
    setIsRandomDialogOpen(true);
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * series.length);
      setRandomItem(series[randomIndex]);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };
 
  const handleMarkAsWatched = (item: EnrichedWatchlistSerie) => {
    setRatingItem(item);
  };
 
  const handleNavigate = (id: string) => {
    router.push(`/series/${id}`);
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
              <Tv className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400" />
              Séries Acompanhadas
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/35">
              Séries que você está acompanhando e mantendo progresso no LifeOS.
            </p>
          </div>
 
          <button
            onClick={handleRandomPick}
            disabled={loadingSeries || isSpinning}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:scale-[1.02] duration-200"
          >
            <Dices className="w-5 h-5 sm:w-6 sm:h-6" />
            Escolher Aleatório
          </button>
        </div>
 
        {/* Lista */}
        {loadingSeries ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-40 w-full bg-[#14141c] rounded-2xl border border-white/[0.06] flex animate-pulse">
                <Skeleton className="w-28 sm:w-36 h-full rounded-l-2xl" />
                <div className="flex-1 p-5 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {series.length === 0 ? (
              <div className="py-16 sm:py-20 text-center border-2 border-dashed border-white/[0.06] text-white/35 rounded-2xl px-4">
                Nenhuma série sendo acompanhada ainda.{" "}
                <br className="hidden sm:block" />
                Navegue pelo catálogo e clique em "Acompanhar Série" para salvar!
              </div>
            ) : (
              series.map((item) => (
                <div
                  key={item.internalId}
                  onClick={() => handleNavigate(item.id)}
                  className="relative overflow-hidden transition-all duration-300 border border-white/[0.06] bg-[#14141c] hover:border-white/10 hover:shadow-xl cursor-pointer group rounded-2xl"
                >
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
 
                  <div className="relative z-10 flex flex-row items-stretch p-0">
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
                          <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px] sm:text-xs font-semibold">
                            Série
                          </span>
                          <h3 className="mb-1 text-base sm:text-lg md:text-xl font-bold text-white line-clamp-1 group-hover:text-violet-400 transition-colors">
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
                        <div className="hidden sm:flex flex-col gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsWatched(item);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/15 text-violet-400 hover:bg-violet-600/30 border border-violet-500/20 text-sm font-medium transition-all"
                          >
                            <Check className="w-4 h-4" /> Avaliar Série
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMutation.mutate(item.id);
                              toast.success("Parou de acompanhar a série");
                            }}
                            disabled={removeMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/35 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-sm font-medium transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" /> Parar de Acompanhar
                          </button>
                        </div>
                      </div>
 
                      {/* Botões Mobile */}
                      <div className="flex sm:hidden gap-2 mt-auto pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsWatched(item);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/20 text-xs font-medium transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Avaliar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMutation.mutate(item.id);
                            toast.success("Parou de acompanhar a série");
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
              ))
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
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
        itemType="série"
        itemId={ratingItem?.tmdbData.id || 0}
        currentRating={null}
      />
    </div>
  );
}
