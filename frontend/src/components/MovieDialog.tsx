import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RatingDialog } from "./RatingDialog";
import { TmdbMovie, Movie } from "@/lib/types";
import {
  Star,
  DollarSign,
  ExternalLink,
  Film,
  Info,
  ListPlus,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import MovieService from "@/lib/movieService";
import { ratingMoviesApi, watchlistMoviesApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MovieDialogProps {
  movie: TmdbMovie;
  movieDetails: TmdbMovie | null;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
}

export function MovieDialog({
  movie,
  movieDetails,
  isOpen,
  onClose,
  isLoggedIn = false,
}: MovieDialogProps) {
  const queryClient = useQueryClient();
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [userRating, setUserRating] = useState<Movie | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  const displayMovie = movieDetails ?? movie;

  useEffect(() => {
    if (isOpen && displayMovie) {
      if (isLoggedIn) {
        loadUserRating(String(displayMovie.id));
        loadWatchlistStatus(String(displayMovie.id));
      }
    } else {
      setUserRating(null);
      setIsInWatchlist(false);
    }
  }, [isOpen, displayMovie?.id, isLoggedIn]);

  const loadUserRating = async (movieId: string) => {
    if (loadingRating) return;
    setLoadingRating(true);
    setUserRating(null);
    try {
      const rating = await ratingMoviesApi.getMovieRating(movieId);
      setUserRating(rating);
    } catch (error: any) {
      if (error?.status !== 404) console.error("Erro ao carregar avaliação do filme:", error);
      setUserRating(null);
    } finally {
      setLoadingRating(false);
    }
  };

  const loadWatchlistStatus = async (movieId: string) => {
    try {
      const res = await watchlistMoviesApi.getWatchlistStatus(movieId);
      setIsInWatchlist(res.inWatchlist);
    } catch (error) {
      console.error("Erro ao carregar status da watchlist:", error);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!displayMovie) return;
    setLoadingWatchlist(true);
    try {
      const res = await watchlistMoviesApi.toggleWatchlist(String(displayMovie.id));
      setIsInWatchlist(res.inWatchlist);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(res.inWatchlist ? "Adicionado à sua Watchlist!" : "Removido da Watchlist!");
    } catch {
      toast.error("Erro ao atualizar a Watchlist.");
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const imageUrl = displayMovie.poster_path
    ? `https://image.tmdb.org/t/p/w500${displayMovie.poster_path}`
    : "/placeholder-movie.jpg";

  const backdropUrl = displayMovie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${displayMovie.backdrop_path}`
    : null;

  const formatCurrency = (value: number) => {
    if (!value || value === 0) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatRuntime = (minutes: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const releaseYear = displayMovie.release_date
    ? new Date(displayMovie.release_date).getFullYear().toString()
    : "N/A";

  const handleRateMovie = async (ratingString: string, comment?: string) => {
    if (!displayMovie) {
      toast.error("Erro", { description: "Dados do filme não encontrados." });
      return;
    }
    try {
      const ratingValue = parseFloat(ratingString);
      const updatedRating = await MovieService.rateMovie(
        displayMovie.id,
        ratingValue,
        displayMovie.title || "Filme Desconhecido",
        displayMovie.poster_path || "",
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
                  alt={displayMovie.title}
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
                  alt={displayMovie.title}
                  className="w-full rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] border-2 border-white/[0.08] object-cover aspect-[2/3]"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-movie.jpg"; }}
                />
              </div>

              <div className="flex-1 flex flex-col justify-end pt-2 md:pt-12 text-center md:text-left w-full">
                <DialogHeader>
                  <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {displayMovie.title}
                  </DialogTitle>
                  {displayMovie.original_title && displayMovie.original_title !== displayMovie.title && (
                    <DialogDescription className="text-white/40 mt-1 text-sm sm:text-base">
                      Título original: {displayMovie.original_title}
                    </DialogDescription>
                  )}
                </DialogHeader>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-2 mt-3 text-xs sm:text-sm text-white/60 font-medium">
                  <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 fill-current" />
                    {displayMovie.vote_average?.toFixed(1) || "N/A"}
                  </div>
                  <span>•</span>
                  <span>{releaseYear}</span>
                  {displayMovie.runtime && displayMovie.runtime > 0 && (
                    <>
                      <span>•</span>
                      <span>{formatRuntime(displayMovie.runtime)}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-5 w-full">
                  {isLoggedIn ? (
                    <>
                      <button
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-purple-900/30 transition-all text-sm"
                        onClick={() => setIsRatingOpen(true)}
                        disabled={loadingRating}
                      >
                        <Star className="w-4 h-4" />
                        {loadingRating ? "Carregando..." : userRating ? "Editar Avaliação" : "Avaliar Filme"}
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

                  {displayMovie.homepage && (
                    <button
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm font-medium transition-all"
                      onClick={() => window.open(displayMovie.homepage, "_blank")}
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
                {displayMovie.overview && (
                  <section>
                    <h3 className="text-lg sm:text-xl font-semibold text-white/80 mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-white/30" />
                      Sinopse
                    </h3>
                    <p className="text-white/55 leading-relaxed text-sm sm:text-base">
                      {displayMovie.overview}
                    </p>
                  </section>
                )}

                {displayMovie.production_companies && displayMovie.production_companies.length > 0 && (
                  <section>
                    <h3 className="text-lg sm:text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
                      <Film className="w-5 h-5 text-white/30" />
                      Produtoras
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {displayMovie.production_companies.map((company) => (
                        <div
                          key={company.id}
                          className="bg-white/5 px-4 py-2 rounded-xl border border-white/[0.06]"
                        >
                          <span className="text-white/70 text-sm font-medium">{company.name}</span>
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

                {displayMovie.genres && displayMovie.genres.length > 0 && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white/35 uppercase tracking-wider mb-2 sm:mb-3">
                      Gêneros
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {displayMovie.genres.map((genre) => (
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

                {((displayMovie.budget && displayMovie.budget > 0) ||
                  (displayMovie.revenue && displayMovie.revenue > 0)) && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white/35 uppercase tracking-wider mb-2 sm:mb-3">
                      Financeiro
                    </h4>
                    <div className="space-y-3">
                      {displayMovie.budget && displayMovie.budget > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/40 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" /> Orçamento
                          </span>
                          <span className="text-white/70 font-medium">
                            {formatCurrency(displayMovie.budget)}
                          </span>
                        </div>
                      )}
                      {displayMovie.revenue && displayMovie.revenue > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/40 flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-emerald-500/70" /> Bilheteria
                          </span>
                          <span className="text-emerald-400 font-medium">
                            {formatCurrency(displayMovie.revenue)}
                          </span>
                        </div>
                      )}
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
          onSubmit={handleRateMovie}
          itemTitle={displayMovie.title || ""}
          itemType="filme"
          itemId={displayMovie.id}
          currentRating={
            userRating ? { myVote: String(userRating.rating), comment: userRating.comment } : null
          }
        />
      </DialogContent>
    </Dialog>
  );
}
