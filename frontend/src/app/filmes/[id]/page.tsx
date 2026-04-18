"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { moviesApi, ratingMoviesApi, watchlistMoviesApi } from "@/lib/api";
import MovieService from "@/lib/movieService";
import AuthService from "@/lib/auth";
import { TmdbMovie, Movie } from "@/lib/types";
import { RatingDialog } from "@/components/RatingDialog";
import {
  Star,
  Clock,
  Calendar,
  ArrowLeft,
  Play,
  Film,
  Globe,
  ExternalLink,
  DollarSign,
  Building2,
  ListPlus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function MovieDetailsPage() {
  const queryClient = useQueryClient();
  const params = useParams();
  const router = useRouter();
  const movieId = params.id as string;

  const [movie, setMovie] = useState<TmdbMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userRating, setUserRating] = useState<Movie | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  useEffect(() => {
    const logged = AuthService.isAuthenticated();
    setIsLoggedIn(logged);

    const fetchData = async () => {
      if (!movieId) return;
      try {
        setLoading(true);
        if (logged) setLoadingRating(true);

        const [movieData, ratingData, watchlistData] = await Promise.all([
          moviesApi.getMovieDetails(movieId, true),
          logged
            ? ratingMoviesApi.getMovieRating(movieId).catch((e: any) => {
                if (e?.status !== 404) console.error("Erro ao buscar avaliação:", e);
                return null;
              })
            : Promise.resolve(null),
          logged
            ? watchlistMoviesApi.getWatchlistStatus(movieId).catch((e: any) => {
                console.error("Erro ao buscar watchlist:", e);
                return { inWatchlist: false };
              })
            : Promise.resolve({ inWatchlist: false }),
        ]);

        setMovie(movieData);
        if (ratingData) setUserRating(ratingData);
        setIsInWatchlist(watchlistData.inWatchlist);
      } catch (err) {
        console.error("Erro ao buscar filme:", err);
        setError("Não foi possível carregar os detalhes deste filme.");
      } finally {
        setLoading(false);
        setLoadingRating(false);
      }
    };

    fetchData();
  }, [movieId]);

  const handleToggleWatchlist = async () => {
    if (!movie) return;
    setLoadingWatchlist(true);
    try {
      const res = await watchlistMoviesApi.toggleWatchlist(String(movie.id));
      setIsInWatchlist(res.inWatchlist);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(res.inWatchlist ? "Adicionado à sua Watchlist!" : "Removido da Watchlist!");
    } catch {
      toast.error("Erro ao atualizar a Watchlist.");
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const handleRateMovie = async (ratingString: string, comment?: string) => {
    if (!movie) return;
    try {
      const ratingValue = parseFloat(ratingString);
      const updatedRating = await MovieService.rateMovie(
        movie.id,
        ratingValue,
        movie.title || "Filme Desconhecido",
        movie.poster_path || "",
        comment,
      );
      setUserRating(updatedRating);
    } catch (error) {
      console.error("Erro ao avaliar:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white/70">
        <h2 className="text-2xl font-bold mb-4">{error || "Filme não encontrado."}</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 transition-all"
        >
          Voltar
        </button>
      </div>
    );
  }

  const trailer = movie.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");
  const cast = movie.credits?.cast?.slice(0, 10) || [];
  const providers = movie["watch/providers"]?.results?.BR?.flatrate || [];

  const currentGenreIds = movie.genres?.map((g) => g.id) || [];
  const filteredRecommendations = (movie.recommendations?.results || [])
    .filter((rec) => {
      if (!rec.genre_ids || rec.genre_ids.length === 0) return false;
      return rec.genre_ids.some((id) => currentGenreIds.includes(id));
    })
    .slice(0, 12);

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.jpg";

  const formatRuntime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const formatCurrency = (value?: number) => {
    if (!value || value === 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const hasBudget = movie.budget && movie.budget > 0;
  const hasRevenue = movie.revenue && movie.revenue > 0;
  const hasCompanies = movie.production_companies && movie.production_companies.length > 0;
  const showProductionDetails = hasBudget || hasRevenue || hasCompanies;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white/80 pb-20 w-full">
      {/* Botão Voltar */}
      <div className="fixed top-24 left-4 md:left-10 z-50">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#14141c]/80 border border-white/10 hover:bg-white/10 backdrop-blur-md shadow-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Backdrop */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh]">
        {backdropUrl ? (
          <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-[#14141c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 -mt-20 sm:-mt-32 md:-mt-48 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full">
          {/* Coluna lateral */}
          <div className="w-48 sm:w-64 md:w-72 shrink-0 mx-auto md:mx-0 space-y-6">
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/[0.08]"
            />

            {isLoggedIn && userRating && (
              <div className="bg-[#14141c] p-5 rounded-2xl border border-white/[0.06] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full -mr-4 -mt-4 blur-xl" />
                <h3 className="text-sm font-semibold text-white/35 uppercase tracking-wider mb-3">
                  Sua Avaliação
                </h3>
                <div className="flex items-end gap-2 mb-3">
                  <Star className="w-8 h-8 text-yellow-400 fill-current drop-shadow-sm" />
                  <span className="text-4xl font-bold text-white leading-none">{userRating.rating}</span>
                  <span className="text-white/35 font-medium mb-1">/10</span>
                </div>
                {userRating.comment && (
                  <p className="text-white/50 text-sm italic bg-[#0a0a0f]/60 p-3 rounded-xl border border-white/[0.06] mt-2">
                    "{userRating.comment}"
                  </p>
                )}
              </div>
            )}

            {providers.length > 0 && (
              <div className="bg-[#14141c] p-5 rounded-2xl border border-white/[0.06]">
                <h3 className="text-sm font-bold text-white/35 uppercase tracking-wider mb-4 text-center md:text-left">
                  Disponível em
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {providers.map((provider) => (
                    <img
                      key={provider.provider_id}
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                      alt={provider.provider_name}
                      title={provider.provider_name}
                      className="w-12 h-12 rounded-xl shadow-md border border-white/[0.06]"
                    />
                  ))}
                </div>
              </div>
            )}

            {showProductionDetails && (
              <div className="bg-[#14141c] p-5 rounded-2xl border border-white/[0.06] space-y-5">
                <h3 className="text-sm font-bold text-white/35 uppercase tracking-wider text-center md:text-left">
                  Detalhes
                </h3>
                {hasBudget && (
                  <div>
                    <h4 className="text-white/30 text-xs uppercase tracking-wider mb-1 flex items-center justify-center md:justify-start">
                      <DollarSign className="w-3 h-3 mr-1" /> Orçamento
                    </h4>
                    <p className="text-white/70 font-medium text-center md:text-left truncate">
                      {formatCurrency(movie.budget)}
                    </p>
                  </div>
                )}
                {hasRevenue && (
                  <div>
                    <h4 className="text-white/30 text-xs uppercase tracking-wider mb-1 flex items-center justify-center md:justify-start">
                      <DollarSign className="w-3 h-3 mr-1" /> Bilheteria
                    </h4>
                    <p className="text-emerald-400 font-medium text-center md:text-left truncate">
                      {formatCurrency(movie.revenue)}
                    </p>
                  </div>
                )}
                {hasCompanies && (
                  <div>
                    <h4 className="text-white/30 text-xs uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start">
                      <Building2 className="w-3 h-3 mr-1" /> Produtoras
                    </h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {movie.production_companies!.map((pc) => (
                        <span
                          key={pc.id}
                          className="px-2 py-0.5 rounded-lg border border-white/[0.06] text-white/50 bg-white/5 text-xs"
                        >
                          {pc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0 pt-2 md:pt-10 w-full">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-2 text-center md:text-left break-words">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-lg sm:text-xl text-white/35 italic mb-6 text-center md:text-left font-light break-words">
                "{movie.tagline}"
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-sm sm:text-base font-medium">
              <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/20">
                <Star className="w-5 h-5 mr-1.5 fill-current" />
                <span className="text-lg">{movie.vote_average?.toFixed(1)}</span>
              </div>
              <div className="flex items-center text-white/55">
                <Calendar className="w-4 h-4 mr-1.5 text-white/25" />
                {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
              </div>
              <div className="flex items-center text-white/55">
                <Clock className="w-4 h-4 mr-1.5 text-white/25" />
                {movie.runtime ? formatRuntime(movie.runtime) : "N/A"}
              </div>
              {movie.original_language && (
                <div className="flex items-center text-white/55 uppercase">
                  <Globe className="w-4 h-4 mr-1.5 text-white/25" />
                  {movie.original_language}
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8 w-full">
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

              {movie.homepage && (
                <button
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm font-medium transition-all"
                  onClick={() => window.open(movie.homepage, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" /> Site Oficial
                </button>
              )}
            </div>

            {/* Gêneros */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
              {movie.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 rounded-xl bg-white/5 border border-white/[0.06] text-white/50 text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Sinopse */}
            <div className="mb-10 w-full">
              <h3 className="text-xl font-semibold text-white/80 mb-3 flex items-center justify-center md:justify-start gap-2">
                <Film className="w-5 h-5 text-white/30" /> Sinopse
              </h3>
              <p className="text-white/55 leading-relaxed text-lg text-center md:text-left break-words">
                {movie.overview || "Nenhuma sinopse disponível para este filme."}
              </p>
            </div>

            {/* Trailer */}
            {trailer && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5 text-red-500" /> Trailer Oficial
                </h3>
                <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden border border-white/[0.06] shadow-xl bg-black">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${trailer.key}?rel=0&modestbranding=1`}
                    title="Trailer"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Elenco */}
            {cast.length > 0 && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white/80 mb-4">Elenco Principal</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x w-full">
                  {cast.map((actor) => (
                    <div key={actor.id} className="w-32 shrink-0 snap-start">
                      <div className="w-32 h-48 mb-3 rounded-xl overflow-hidden bg-white/5 border border-white/[0.06]">
                        <img
                          src={
                            actor.profile_path
                              ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                              : "/placeholder-user.jpg"
                          }
                          alt={actor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-sm font-semibold text-white/70 line-clamp-1" title={actor.name}>
                        {actor.name}
                      </h4>
                      <p className="text-xs text-white/35 line-clamp-2" title={actor.character}>
                        {actor.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendações */}
            {filteredRecommendations.length > 0 && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Film className="w-5 h-5 text-purple-400" /> Títulos Semelhantes
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x w-full">
                  {filteredRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="w-32 sm:w-36 shrink-0 snap-start cursor-pointer group"
                      onClick={() => router.push(`/filmes/${rec.id}`)}
                    >
                      <div className="w-full aspect-[2/3] mb-3 rounded-xl overflow-hidden bg-white/5 border border-white/[0.06] relative shadow-md">
                        <img
                          src={
                            rec.poster_path
                              ? `https://image.tmdb.org/t/p/w342${rec.poster_path}`
                              : "/placeholder-movie.jpg"
                          }
                          alt={rec.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-[#0a0a0f]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <ExternalLink className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                      </div>
                      <h4
                        className="text-sm font-semibold text-white/60 line-clamp-2 group-hover:text-purple-400 transition-colors"
                        title={rec.title}
                      >
                        {rec.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RatingDialog
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        onSubmit={handleRateMovie}
        itemTitle={movie.title || ""}
        itemType="filme"
        itemId={movie.id}
        currentRating={
          userRating ? { myVote: String(userRating.rating), comment: userRating.comment } : null
        }
      />
    </div>
  );
}
