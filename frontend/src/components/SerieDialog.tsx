import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RatingDialog } from "./RatingDialog";
import { TmdbSerie, Serie } from "@/lib/types";
import {
  Star,
  Tv,
  Users,
  Clock,
  ExternalLink,
  CalendarDays,
  Info,
  ListPlus,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ratingSeriesApi, watchlistSeriesApi } from "@/lib/api";
import MovieService from "@/lib/movieService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface SerieDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serie: TmdbSerie | null;
  serieDetails?: TmdbSerie | null;
  isLoggedIn?: boolean;
}

export function SerieDialog({
  isOpen,
  onClose,
  serie,
  serieDetails,
  isLoggedIn = false,
}: SerieDialogProps) {
  const queryClient = useQueryClient();

  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [userRating, setUserRating] = useState<Serie | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  if (!serie) return null;
  const serieData = serieDetails ?? serie;

  useEffect(() => {
    if (isOpen && serieData) {
      if (isLoggedIn) {
        loadUserRating(String(serieData.id));
        loadWatchlistStatus(String(serieData.id));
      }
    } else {
      setUserRating(null);
      setIsInWatchlist(false);
    }
  }, [isOpen, serieData?.id, isLoggedIn]);

  const loadUserRating = async (serieId: string) => {
    if (loadingRating) return;
    setLoadingRating(true);
    setUserRating(null);
    try {
      const rating = await ratingSeriesApi.getSerieRating(serieId);
      setUserRating(rating);
    } catch (error: any) {
      if (error?.status !== 404) console.error("Erro ao carregar avaliação:", error);
      setUserRating(null);
    } finally {
      setLoadingRating(false);
    }
  };

  const loadWatchlistStatus = async (serieId: string) => {
    try {
      const res = await watchlistSeriesApi.getWatchlistStatus(serieId);
      setIsInWatchlist(res.inWatchlist);
    } catch (error) {
      console.error("Erro ao carregar status da watchlist:", error);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!serieData) return;
    setLoadingWatchlist(true);
    try {
      const res = await watchlistSeriesApi.toggleWatchlist(String(serieData.id));
      setIsInWatchlist(res.inWatchlist);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(res.inWatchlist ? "Série adicionada à Watchlist!" : "Série removida da Watchlist!");
    } catch {
      toast.error("Erro ao atualizar a Watchlist.");
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const imageUrl = serieData.poster_path
    ? `https://image.tmdb.org/t/p/w500${serieData.poster_path}`
    : "/placeholder-movie.jpg";

  const backdropUrl = serieData.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${serieData.backdrop_path}`
    : null;

  const getYearRange = () => {
    const firstYear = serieData.first_air_date ? new Date(serieData.first_air_date).getFullYear() : null;
    const lastYear = serieData.last_air_date ? new Date(serieData.last_air_date).getFullYear() : null;
    if (!firstYear) return "N/A";
    if (!lastYear || firstYear === lastYear) return firstYear.toString();
    return `${firstYear}-${lastYear}`;
  };

  const handleRateSerie = async (ratingString: string, comment?: string) => {
    if (!serieData) return;
    try {
      const ratingValue = parseFloat(ratingString);
      const updatedRating = await MovieService.rateSerie(
        serieData.id,
        ratingValue,
        serieData.name || "Série Desconhecida",
        serieData.poster_path || "",
        comment,
      );
      setUserRating(updatedRating);
    } catch (error) {
      console.error("Erro capturado no Dialog ao submeter avaliação:", error);
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-[#0a0a0f] border border-white/[0.06] shadow-2xl sm:rounded-2xl">
        <div className="max-h-[90vh] overflow-y-auto custom-scrollbar relative w-full">
          {/* Backdrop */}
          <div className="relative w-full h-48 sm:h-64 md:h-80 bg-[#14141c] shrink-0">
            {backdropUrl && (
              <>
                <img
                  src={backdropUrl}
                  alt={serieData.name}
                  className="w-full h-full object-cover opacity-40 md:opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
              </>
            )}
          </div>

          <div className="relative z-10 px-4 sm:px-6 md:px-10 pb-8 -mt-20 sm:-mt-28 md:-mt-32">
            <div className="flex flex-col md:flex-row gap-5 sm:gap-6 md:gap-8 items-center md:items-end">
              <div className="w-32 sm:w-44 md:w-56 lg:w-64 shrink-0 mx-auto md:mx-0">
                <img
                  src={imageUrl}
                  alt={serieData.name}
                  className="w-full rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] border-2 border-white/[0.08] object-cover aspect-[2/3]"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-movie.jpg"; }}
                />
              </div>

              <div className="flex-1 flex flex-col justify-end pt-2 md:pt-12 text-center md:text-left w-full">
                <DialogHeader>
                  <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {serieData.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-2 mt-3 text-xs sm:text-sm text-white/60 font-medium">
                  <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 fill-current" />
                    {serieData.vote_average?.toFixed(1) || "N/A"}
                  </div>
                  <span>•</span>
                  <span>{getYearRange()}</span>
                  {serieData.number_of_seasons && (
                    <>
                      <span>•</span>
                      <span>{serieData.number_of_seasons} Temporadas</span>
                    </>
                  )}
                  {serieData.status && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className={serieData.status === "Ended" ? "text-red-400" : "text-emerald-400"}>
                        {serieData.status === "Ended"
                          ? "Finalizada"
                          : serieData.status === "Returning Series"
                            ? "Em Andamento"
                            : serieData.status}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5 w-full">
                  {isLoggedIn ? (
                    <>
                      <button
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-violet-900/30 transition-all text-sm"
                        onClick={() => setIsRatingOpen(true)}
                        disabled={loadingRating}
                      >
                        <Star className="w-4 h-4" />
                        {loadingRating ? "Carregando..." : userRating ? "Editar Avaliação" : "Avaliar Série"}
                      </button>

                      <button
                        className={cn(
                          "w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50",
                          isInWatchlist
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            : "border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5",
                        )}
                        onClick={handleToggleWatchlist}
                        disabled={loadingWatchlist}
                      >
                        {isInWatchlist ? <Check className="w-4 h-4" /> : <ListPlus className="w-4 h-4" />}
                        {loadingWatchlist ? "Salvando..." : isInWatchlist ? "Na Watchlist" : "Add à Watchlist"}
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/30 font-semibold border border-white/[0.06] cursor-not-allowed text-sm"
                    >
                      <Star className="w-4 h-4 opacity-50" />
                      Faça login para interagir
                    </button>
                  )}
                  {serieData.homepage && (
                    <button
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm font-medium transition-all"
                      onClick={() => window.open(serieData.homepage, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Site Oficial
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="my-6 sm:my-8 border-t border-white/[0.06]" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                {serieData.overview && (
                  <section>
                    <h3 className="text-lg sm:text-xl font-semibold text-white/80 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-white/30" />
                      Sinopse
                    </h3>
                    <p className="text-white/55 leading-relaxed text-sm sm:text-base">
                      {serieData.overview}
                    </p>
                  </section>
                )}

                {(serieData.last_air_date || serieData.next_episode_to_air) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {serieData.last_air_date && (
                      <div className="bg-white/5 p-4 rounded-xl border border-white/[0.06]">
                        <p className="text-xs text-white/35 font-medium uppercase tracking-wider mb-1">
                          Último Episódio
                        </p>
                        <div className="flex items-center text-white/70 text-sm sm:text-base">
                          <Clock className="w-4 h-4 mr-2 text-white/30" />
                          {new Date(serieData.last_air_date).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    )}

                    {serieData.next_episode_to_air && (
                      <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">
                          Próximo Episódio
                        </p>
                        <p className="text-white/80 font-medium text-sm sm:text-base line-clamp-1">
                          {serieData.next_episode_to_air.name}
                        </p>
                        <div className="flex flex-wrap items-center mt-2 text-xs sm:text-sm text-emerald-300/70">
                          <CalendarDays className="w-4 h-4 mr-1.5 shrink-0" />
                          {new Date(serieData.next_episode_to_air.air_date).toLocaleDateString("pt-BR")}
                          <span className="mx-2">•</span>
                          T{serieData.next_episode_to_air.season_number}:E{serieData.next_episode_to_air.episode_number}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {serieData.seasons && serieData.seasons.length > 0 && (
                  <section>
                    <h3 className="text-lg sm:text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
                      <Tv className="w-5 h-5 text-white/30" />
                      Temporadas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {serieData.seasons.map((season) => (
                        <div
                          key={`season-${season.id}`}
                          className="bg-white/5 p-4 rounded-xl border border-white/[0.06] hover:bg-white/[0.07] transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white/80 font-semibold text-sm sm:text-base">
                                {season.name}
                              </h4>
                              {season.air_date && (
                                <p className="text-white/35 text-xs sm:text-sm mt-0.5">
                                  {new Date(season.air_date).getFullYear()}
                                </p>
                              )}
                            </div>
                            <span className="ml-2 shrink-0 px-2 py-0.5 rounded-lg bg-white/10 text-white/50 text-xs font-medium">
                              {season.episode_count} ep{season.episode_count !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {season.overview && (
                            <p className="text-white/35 text-xs sm:text-sm mt-3 line-clamp-2">
                              {season.overview}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-6">
                {isLoggedIn && userRating && (
                  <div className="bg-[#14141c] p-4 sm:p-5 rounded-2xl border border-white/[0.06] shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full -mr-4 -mt-4 blur-xl" />
                    <h3 className="text-xs sm:text-sm font-semibold text-white/40 uppercase tracking-wider mb-2">
                      Sua Avaliação
                    </h3>
                    <div className="flex items-end gap-2 mb-3">
                      <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 fill-current drop-shadow-sm" />
                      <span className="text-3xl sm:text-4xl font-bold text-white leading-none">
                        {userRating.rating}
                      </span>
                      <span className="text-white/35 text-sm sm:text-base font-medium mb-1">/10</span>
                    </div>
                    {userRating.comment && (
                      <p className="text-white/50 text-xs sm:text-sm italic bg-[#0a0a0f]/60 p-3 rounded-xl border border-white/[0.06] mt-2">
                        "{userRating.comment}"
                      </p>
                    )}
                  </div>
                )}

                {serieData.genres && serieData.genres.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white/35 uppercase tracking-wider mb-2 sm:mb-3">
                      Gêneros
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {serieData.genres.map((genre) => (
                        <span
                          key={`genre-${genre.id}`}
                          className="px-2.5 py-1 rounded-lg border border-white/[0.06] text-white/50 bg-white/5 text-xs sm:text-sm"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {serieData.created_by && serieData.created_by.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white/35 uppercase tracking-wider mb-2 sm:mb-3">
                      Criadores
                    </h4>
                    <div className="space-y-2 flex flex-col">
                      {serieData.created_by.map((creator) => (
                        <div
                          key={creator.id}
                          className="flex items-center text-white/60 bg-white/5 p-2 rounded-xl border border-white/[0.06] w-fit sm:w-full"
                        >
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-white/30 shrink-0" />
                          <span className="text-xs sm:text-sm font-medium">{creator.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {serieData.networks && serieData.networks.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white/35 uppercase tracking-wider mb-2 sm:mb-3">
                      Exibição Original
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {serieData.networks.map((network) => (
                        <div
                          key={`network-${network.id}`}
                          className="bg-white/90 text-[#0a0a0f] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm"
                        >
                          {network.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <RatingDialog
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          onSubmit={handleRateSerie}
          itemTitle={serieData.name || ""}
          itemType="série"
          itemId={serieData.id}
          currentRating={
            userRating ? { myVote: String(userRating.rating), comment: userRating.comment } : null
          }
        />
      </DialogContent>
    </Dialog>
  );
}
