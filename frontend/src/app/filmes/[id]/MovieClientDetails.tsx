"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { TmdbMovie, Movie as UserRatingMovie } from "@/lib/types";
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
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AddToListModal } from "@/components/AddToListModal";

interface MovieClientDetailsProps {
  movie: TmdbMovie;
  initialUserRating: UserRatingMovie | null;
  initialIsInWatchlist: boolean;
  isLoggedIn: boolean;
}

export function MovieClientDetails({
  movie,
  initialUserRating,
  initialIsInWatchlist,
  isLoggedIn,
}: MovieClientDetailsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [userRating, setUserRating] = useState<UserRatingMovie | null>(initialUserRating);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);
  
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);

  const [posterLoading, setPosterLoading] = useState(true);
  const posterRef = useRef<HTMLImageElement>(null);

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

  useEffect(() => {
    if (posterRef.current?.complete) {
      setPosterLoading(false);
    }
  }, [posterUrl]);

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

  const handleToggleWatchlist = async () => {
    setLoadingWatchlist(true);
    try {
      const { toggleWatchlistAction } = await import("@/app/actions");
      const result = await toggleWatchlistAction(String(movie.id), "movie");
      
      if (result.success && result.data) {
        setIsInWatchlist(result.data.inWatchlist);
        queryClient.invalidateQueries({ queryKey: ["watchlist"] });
        toast.success(result.data.inWatchlist ? "Adicionado à sua Watchlist!" : "Removido da Watchlist!");
      } else {
        toast.error(result.error || "Erro ao atualizar a Watchlist.");
      }
    } catch {
      toast.error("Erro ao atualizar a Watchlist.");
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const handleRateMovie = async (ratingString: string, comment?: string) => {
    try {
      const ratingValue = parseFloat(ratingString);
      const { rateMediaAction } = await import("@/app/actions");
      const result = await rateMediaAction(String(movie.id), "movie", {
        rating: ratingValue,
        title: movie.title || "Filme Desconhecido",
        poster_path: movie.poster_path || "",
        comment: comment,
      });

      if (result.success && result.data) {
        setUserRating(result.data as UserRatingMovie);
      } else {
        throw new Error(result.error || "Erro ao avaliar");
      }
    } catch (error) {
      console.error("Erro ao avaliar:", error);
      throw error;
    }
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
          <Image 
            src={backdropUrl} 
            alt={movie.title} 
            fill
            priority
            className="object-cover opacity-60" 
          />
        ) : (
          <div className="w-full h-full bg-[#14141c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 -mt-20 sm:-mt-32 md:-mt-48 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full">
          {/* Coluna lateral */}
          <div className="w-48 sm:w-64 md:w-72 shrink-0 mx-auto md:mx-0 space-y-6">
            <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/[0.08] bg-white/5">
              <Image
                ref={posterRef}
                key={posterUrl}
                src={posterUrl}
                alt={movie.title}
                fill
                className={cn(
                  "object-cover transition-all duration-500",
                  posterLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0"
                )}
                onLoad={() => setPosterLoading(false)}
              />
            </div>

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
                    <div key={provider.provider_id} className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border border-white/[0.06]">
                      <Image
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                        alt={provider.provider_name}
                        fill
                        className="object-cover"
                      />
                    </div>
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

              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 font-semibold text-sm transition-all"
                onClick={() => setIsAddToListOpen(true)}
              >
                <FolderPlus className="w-4 h-4 text-purple-400" />
                Salvar em Lista
              </button>

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
                      <div className="relative w-32 h-48 mb-3 rounded-xl overflow-hidden bg-white/5 border border-white/[0.06]">
                        <Image
                          src={
                            actor.profile_path
                              ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                              : "/placeholder-user.jpg"
                          }
                          alt={actor.name}
                          fill
                          className="object-cover"
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
                    <Link
                      key={rec.id}
                      href={`/filmes/${rec.id}`}
                      className="w-32 sm:w-36 shrink-0 snap-start cursor-pointer group block"
                    >
                      <div className="relative w-full aspect-[2/3] mb-3 rounded-xl overflow-hidden bg-white/5 border border-white/[0.06] shadow-md">
                        <Image
                          src={
                            rec.poster_path
                              ? `https://image.tmdb.org/t/p/w342${rec.poster_path}`
                              : "/placeholder-movie.jpg"
                          }
                          alt={rec.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
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
                    </Link>
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

      <AddToListModal
        isOpen={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        item={{
          id: movie.id,
          type: "movie",
          title: movie.title || "",
          posterPath: movie.poster_path || null,
          backdropPath: movie.backdrop_path || null,
          voteAverage: movie.vote_average,
          releaseYear: movie.release_date
            ? movie.release_date.substring(0, 4)
            : undefined,
        }}
      />
    </div>
  );
}
