"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dices, Check, Trash2, ListVideo, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingDialog } from "../../components/RatingDialog";
import {
  watchlistMoviesApi,
  watchlistSeriesApi,
  moviesApi,
  seriesApi,
} from "../../lib/api";
import MovieService from "../../lib/movieService";
import AuthService from "../../lib/auth";
import {
  EnrichedWatchlistMovie,
  EnrichedWatchlistSerie,
} from "../../lib/types";
import { cn } from "@/lib/utils";

export default function WatchlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuth = AuthService.isAuthenticated();

  const [activeTab, setActiveTab] = useState<"movie" | "serie">("movie");
  const [randomItem, setRandomItem] = useState<any | null>(null);
  const [isRandomDialogOpen, setIsRandomDialogOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const [ratingItem, setRatingItem] = useState<
    EnrichedWatchlistMovie | EnrichedWatchlistSerie | null
  >(null);

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
              tmdbData: tmdbData,
              addedAt: item.addedAt,
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
              tmdbData: tmdbData,
              addedAt: item.addedAt,
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
    mutationFn: async ({
      type,
      id,
    }: {
      type: "movie" | "serie";
      id: string;
    }) => {
      if (type === "movie") return watchlistMoviesApi.toggleWatchlist(id);
      return watchlistSeriesApi.toggleWatchlist(id);
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({
        queryKey: ["watchlist", type === "movie" ? "movies" : "series"],
      });
    },
  });

  const handleRateSubmit = async (ratingString: string, comment?: string) => {
    if (!ratingItem) return;

    try {
      const ratingValue = parseFloat(ratingString);

      if (ratingItem.type === "movie") {
        await MovieService.rateMovie(
          ratingItem.tmdbData.id,
          ratingValue,
          ratingItem.title,
          ratingItem.tmdbData.poster_path || "",
          comment,
        );
      } else {
        await MovieService.rateSerie(
          ratingItem.tmdbData.id,
          ratingValue,
          ratingItem.title,
          ratingItem.tmdbData.poster_path || "",
          comment,
        );
      }

      removeMutation.mutate({ type: ratingItem.type, id: ratingItem.id });

      toast.success("Avaliação salva com sucesso!", {
        description: "O título foi removido da sua Watchlist automaticamente.",
      });

      setRatingItem(null);
    } catch (error) {
      console.error("Erro ao avaliar na watchlist:", error);
      toast.error("Erro ao salvar avaliação.", {
        description: "A nota não foi salva. Tente novamente.",
      });
    }
  };

  const currentList = activeTab === "movie" ? movies : series;
  const isLoading = loadingMovies || loadingSeries;

  const handleRandomPick = () => {
    if (currentList.length === 0) {
      toast.error("Sua lista está vazia!", {
        description: "Adicione títulos para usar a roleta.",
      });
      return;
    }

    setIsRandomDialogOpen(true);
    setIsSpinning(true);

    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * currentList.length);
      setRandomItem(currentList[randomIndex]);
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleMarkAsWatched = (
    item: EnrichedWatchlistMovie | EnrichedWatchlistSerie,
  ) => {
    setRatingItem(item);
  };

  const handleNavigate = (type: "movie" | "serie", id: string) => {
    if (type === "movie") {
      router.push(`/filmes/${id}`);
    } else {
      router.push(`/series/${id}`);
    }
  };

  const PageLoader = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center border border-slate-800/50 rounded-2xl bg-slate-900/20">
      <div className="w-12 h-12 mb-4 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
      <p className="font-medium text-slate-400">Carregando sua lista...</p>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-slate-950">
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:mb-10 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-white">
              <ListVideo className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500" />
              Minha Watchlist
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Títulos que você separou para assistir em breve.
            </p>
          </div>

          <Button
            onClick={handleRandomPick}
            disabled={isLoading || isSpinning}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 sm:py-6 px-6 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:scale-105"
          >
            <Dices className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Escolher Aleatório
          </Button>
        </div>

        {/* Abas */}
        <div className="flex gap-2 pb-4 mb-6 border-b border-slate-800">
          <Button
            variant={activeTab === "movie" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("movie")}
            className={
              activeTab === "movie"
                ? "bg-slate-800 text-white"
                : "text-slate-400"
            }
          >
            <Film className="w-4 h-4 mr-2" /> Filmes ({movies.length})
          </Button>
          <Button
            variant={activeTab === "serie" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("serie")}
            className={
              activeTab === "serie"
                ? "bg-slate-800 text-white"
                : "text-slate-400"
            }
          >
            <Tv className="w-4 h-4 mr-2" /> Séries ({series.length})
          </Button>
        </div>

        {/* Lista Híbrida (Compacta no Mobile, Estendida no Desktop) */}
        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="space-y-4">
            {currentList.length === 0 ? (
              <div className="py-16 sm:py-20 text-center border-2 border-dashed text-slate-500 border-slate-800 rounded-xl px-4">
                Nenhum título adicionado à watchlist ainda.{" "}
                <br className="hidden sm:block" /> Navegue pelo catálogo e
                clique em "Add à Watchlist" para salvar!
              </div>
            ) : (
              currentList.map((item) => (
                <Card
                  key={item.internalId}
                  onClick={() => handleNavigate(item.type, item.id)}
                  className="relative overflow-hidden transition-all duration-300 border-slate-800 bg-slate-900 hover:border-slate-600 hover:shadow-xl cursor-pointer group"
                >
                  {/* Backdrop */}
                  {item.backdrop && (
                    <div className="hidden sm:block absolute inset-0 z-0 pointer-events-none">
                      <img
                        src={item.backdrop}
                        alt=""
                        className="object-cover w-full h-full opacity-15 group-hover:opacity-25 transition-opacity duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-900/40" />
                    </div>
                  )}

                  <CardContent className="relative z-10 flex flex-row items-stretch p-0">
                    {/* Pôster */}
                    <div className="relative shrink-0 w-24 sm:w-28 md:w-36 aspect-[2/3]">
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/30" />
                    </div>

                    {/* Informações */}
                    <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5 justify-between min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                          <Badge className="mb-1.5 border-indigo-500/30 bg-indigo-500/20 text-indigo-400 text-[10px] sm:text-xs px-1.5 py-0">
                            {item.type === "movie" ? "Filme" : "Série"}
                          </Badge>
                          <h3 className="mb-1 text-base sm:text-lg md:text-xl font-bold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 mb-2">
                            <span className="font-semibold text-slate-300">
                              {item.year}
                            </span>
                            <span className="hidden sm:flex items-center gap-1">
                              <span className="mx-1">•</span>
                              Adicionado há pouco
                            </span>
                          </div>

                          <div className="hidden md:flex flex-wrap gap-2 mb-2">
                            {item.genres.map((g) => (
                              <Badge
                                key={g}
                                variant="outline"
                                className="text-[10px] text-slate-300 border-slate-700 bg-slate-800/50 backdrop-blur-sm px-2"
                              >
                                {g}
                              </Badge>
                            ))}
                          </div>
                          <p className="hidden md:block text-slate-400 text-sm line-clamp-2 leading-relaxed">
                            {item.overview}
                          </p>
                        </div>

                        {/* Botões Desktop */}
                        <div className="hidden sm:flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsWatched(item);
                            }}
                            variant="secondary"
                            className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 font-medium h-9"
                          >
                            <Check className="w-4 h-4 mr-1.5" /> Assisti e
                            Avaliar
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMutation.mutate({
                                type: item.type,
                                id: item.id,
                              });
                              toast.success("Removido da Watchlist");
                            }}
                            disabled={removeMutation.isPending}
                            variant="ghost"
                            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-9"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" /> Remover
                          </Button>
                        </div>
                      </div>

                      {/* Botões Mobile */}
                      <div className="flex sm:hidden gap-2 mt-auto pt-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsWatched(item);
                          }}
                          className="flex-1 bg-emerald-600/20 text-emerald-400 h-8 text-xs font-medium px-2"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Avaliar
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMutation.mutate({
                              type: item.type,
                              id: item.id,
                            });
                            toast.success("Removido da Watchlist");
                          }}
                          disabled={removeMutation.isPending}
                          variant="ghost"
                          className="text-slate-400 hover:text-red-400 bg-slate-800/50 h-8 px-3"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal da Roleta */}
      {isRandomDialogOpen && randomItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl transition-all duration-300">
            <h2 className="mb-2 text-xl sm:text-2xl font-bold text-white">
              {isSpinning ? "Girando a Roleta..." : "A Roleta Escolheu!"}
            </h2>
            <p className="mb-6 text-sm sm:text-base text-slate-400">
              {isSpinning
                ? "Buscando nos seus interesses..."
                : "Você vai assistir:"}
            </p>

            <img
              src={randomItem.poster}
              className={cn(
                "object-cover mx-auto mb-6 border-4 rounded-xl shadow-xl w-40 h-60 sm:w-48 sm:h-72 transition-all duration-200",
                isSpinning
                  ? "border-slate-700 scale-90 opacity-60 blur-[3px]"
                  : "border-indigo-500 scale-100 opacity-100 blur-0",
              )}
              alt="Pôster Sorteado"
            />

            <h3 className="mb-6 text-lg sm:text-xl font-bold text-white line-clamp-2">
              {randomItem.title}
            </h3>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setIsRandomDialogOpen(false);
                  setRandomItem(null);
                }}
                disabled={isSpinning}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </Button>
              <Button
                disabled={isSpinning}
                onClick={() => {
                  setIsRandomDialogOpen(false);
                  handleMarkAsWatched(randomItem);
                }}
                className="flex-1 text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Check className="w-4 h-4 mr-2" /> Avaliar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Simples de Avaliação */}
      <RatingDialog
        isOpen={!!ratingItem}
        onClose={() => setRatingItem(null)}
        onSubmit={handleRateSubmit}
        itemTitle={ratingItem?.title || ""}
        itemType={ratingItem?.type === "movie" ? "filme" : "série"}
        itemId={ratingItem?.tmdbData.id || 0}
        currentRating={null}
      />
    </div>
  );
}
