"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { moviesApi, ratingMoviesApi } from "@/lib/api";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MovieDetailsPage() {
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

  useEffect(() => {
    const logged = AuthService.isAuthenticated();
    setIsLoggedIn(logged);

    const fetchData = async () => {
      if (!movieId) return;

      try {
        setLoading(true);
        const movieData = await moviesApi.getMovieDetails(movieId);
        setMovie(movieData);

        if (logged) {
          try {
            setLoadingRating(true);
            const ratingData = await ratingMoviesApi.getMovieRating(movieId);
            setUserRating(ratingData);
          } catch (ratingErr: any) {
            if (ratingErr?.status !== 404) {
              console.error("Erro ao buscar avaliação do usuário:", ratingErr);
            }
          } finally {
            setLoadingRating(false);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar filme:", err);
        setError("Não foi possível carregar os detalhes deste filme.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <h2 className="text-2xl font-bold mb-4">
          {error || "Filme não encontrado."}
        </h2>
        <Button onClick={() => router.back()} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const trailer = movie.videos?.results?.find(
    (v) => v.site === "YouTube" && v.type === "Trailer",
  );
  const cast = movie.credits?.cast?.slice(0, 10) || [];
  const providers = movie["watch/providers"]?.results?.BR?.flatrate || [];

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
  const hasCompanies =
    movie.production_companies && movie.production_companies.length > 0;
  const showProductionDetails = hasBudget || hasRevenue || hasCompanies;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 w-full">
      <div className="fixed top-24 left-4 md:left-10 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="bg-slate-900/80 border-slate-700 hover:bg-slate-800 backdrop-blur-md rounded-full w-10 h-10 shadow-xl"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
      </div>

      {/* HERO SECTION */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh]">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 -mt-20 sm:-mt-32 md:-mt-48 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full">
          {/* COLUNA ESQUERDA (Sidebar) */}
          <div className="w-48 sm:w-64 md:w-72 shrink-0 mx-auto md:mx-0 space-y-6">
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-slate-800"
            />

            {/* Apenas exibe o card de "Sua Avaliação" se estiver logado E tiver nota */}
            {isLoggedIn && userRating && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-5 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl" />
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Sua Avaliação
                </h3>
                <div className="flex items-end gap-2 mb-3">
                  <Star className="w-8 h-8 text-yellow-400 fill-current drop-shadow-sm" />
                  <span className="text-4xl font-bold text-white leading-none">
                    {userRating.rating}
                  </span>
                  <span className="text-slate-400 font-medium mb-1">/10</span>
                </div>
                {userRating.comment && (
                  <p className="text-slate-300 text-sm italic bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 mt-2">
                    "{userRating.comment}"
                  </p>
                )}
              </div>
            )}

            {providers.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 text-center md:text-left">
                  Disponível em
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {providers.map((provider) => (
                    <img
                      key={provider.provider_id}
                      src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                      alt={provider.provider_name}
                      title={provider.provider_name}
                      className="w-12 h-12 rounded-xl shadow-md border border-slate-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {showProductionDetails && (
              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 text-center md:text-left">
                  Detalhes
                </h3>
                {hasBudget && (
                  <div>
                    <h4 className="text-slate-500 text-xs uppercase tracking-wider mb-1 flex items-center justify-center md:justify-start">
                      <DollarSign className="w-3 h-3 mr-1" /> Orçamento
                    </h4>
                    <p className="text-slate-200 font-medium text-center md:text-left truncate">
                      {formatCurrency(movie.budget)}
                    </p>
                  </div>
                )}
                {hasRevenue && (
                  <div>
                    <h4 className="text-slate-500 text-xs uppercase tracking-wider mb-1 flex items-center justify-center md:justify-start">
                      <DollarSign className="w-3 h-3 mr-1" /> Bilheteria
                    </h4>
                    <p className="text-slate-200 font-medium text-center md:text-left truncate">
                      {formatCurrency(movie.revenue)}
                    </p>
                  </div>
                )}
                {hasCompanies && (
                  <div>
                    <h4 className="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start">
                      <Building2 className="w-3 h-3 mr-1" /> Produtoras
                    </h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {movie.production_companies!.map((pc) => (
                        <Badge
                          key={pc.id}
                          variant="outline"
                          className="border-slate-700 text-slate-300 text-center"
                        >
                          {pc.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COLUNA DIREITA (Conteúdo Principal) */}
          <div className="flex-1 min-w-0 pt-2 md:pt-10 w-full">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-2 text-center md:text-left break-words">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-lg sm:text-xl text-slate-400 italic mb-6 text-center md:text-left font-light break-words">
                "{movie.tagline}"
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-sm sm:text-base font-medium">
              <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/20">
                <Star className="w-5 h-5 mr-1.5 fill-current" />
                <span className="text-lg">
                  {movie.vote_average?.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center text-slate-300">
                <Calendar className="w-4 h-4 mr-1.5 text-slate-500" />
                {movie.release_date
                  ? new Date(movie.release_date).getFullYear()
                  : "N/A"}
              </div>
              <div className="flex items-center text-slate-300">
                <Clock className="w-4 h-4 mr-1.5 text-slate-500" />
                {movie.runtime ? formatRuntime(movie.runtime) : "N/A"}
              </div>
              {movie.original_language && (
                <div className="flex items-center text-slate-300 uppercase">
                  <Globe className="w-4 h-4 mr-1.5 text-slate-500" />
                  {movie.original_language}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8 w-full">
              {/* BOTÃO COM TRAVA DE LOGIN */}
              {isLoggedIn ? (
                <Button
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/20"
                  onClick={() => setIsRatingOpen(true)}
                  disabled={loadingRating}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {loadingRating
                    ? "Carregando..."
                    : userRating
                      ? "Editar Avaliação"
                      : "Avaliar Filme"}
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full sm:w-auto bg-slate-800/50 text-slate-400 font-semibold border border-slate-700 cursor-not-allowed"
                >
                  <Star className="w-4 h-4 mr-2 opacity-50" />
                  Faça login para avaliar
                </Button>
              )}

              {movie.homepage && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => window.open(movie.homepage, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Site Oficial
                </Button>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
              {movie.genres?.map((genre) => (
                <Badge
                  key={genre.id}
                  variant="secondary"
                  className="bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1"
                >
                  {genre.name}
                </Badge>
              ))}
            </div>

            <div className="mb-10 w-full">
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center justify-center md:justify-start">
                <Film className="w-5 h-5 mr-2 text-slate-500" />
                Sinopse
              </h3>
              <p className="text-slate-300 leading-relaxed text-lg text-center md:text-left break-words">
                {movie.overview ||
                  "Nenhuma sinopse disponível para este filme."}
              </p>
            </div>

            {trailer && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Play className="w-5 h-5 mr-2 text-red-500" />
                  Trailer Oficial
                </h3>
                <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-black">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${trailer.key}?rel=0&modestbranding=1`}
                    title="Trailer"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {cast.length > 0 && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Elenco Principal
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x w-full">
                  {cast.map((actor) => (
                    <div key={actor.id} className="w-32 shrink-0 snap-start">
                      <div className="w-32 h-48 mb-3 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
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
                      <h4
                        className="text-sm font-semibold text-slate-200 line-clamp-1"
                        title={actor.name}
                      >
                        {actor.name}
                      </h4>
                      <p
                        className="text-xs text-slate-500 line-clamp-2"
                        title={actor.character}
                      >
                        {actor.character}
                      </p>
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
          userRating
            ? {
                myVote: String(userRating.rating),
                comment: userRating.comment,
              }
            : null
        }
      />
    </div>
  );
}
