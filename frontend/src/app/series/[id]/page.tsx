"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { seriesApi, ratingSeriesApi } from "@/lib/api";
import MovieService from "@/lib/movieService";
import AuthService from "@/lib/auth";
import { TmdbSerie, Serie } from "@/lib/types";
import { RatingDialog } from "@/components/RatingDialog";
import {
  Star,
  Clock,
  ArrowLeft,
  Play,
  Tv,
  Film,
  ExternalLink,
  Users,
  Building2,
  CalendarDays,
  Info,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SerieDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const serieId = params.id as string;

  const [serie, setSerie] = useState<TmdbSerie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userRating, setUserRating] = useState<Serie | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const logged = AuthService.isAuthenticated();
    setIsLoggedIn(logged);

    const fetchData = async () => {
      if (!serieId) return;

      try {
        setLoading(true);
        const serieData = await seriesApi.getSerieDetails(serieId);
        setSerie(serieData);

        if (logged) {
          try {
            setLoadingRating(true);
            const ratingData = await ratingSeriesApi.getSerieRating(serieId);
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
        console.error("Erro ao buscar série:", err);
        setError("Não foi possível carregar os detalhes desta série.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serieId]);

  const handleRateSerie = async (ratingString: string, comment?: string) => {
    if (!serie) return;

    try {
      const ratingValue = parseFloat(ratingString);
      const updatedRating = await MovieService.rateSerie(
        serie.id,
        ratingValue,
        serie.name || "Série Desconhecida",
        serie.poster_path || "",
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !serie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <h2 className="text-2xl font-bold mb-4">
          {error || "Série não encontrada."}
        </h2>
        <Button onClick={() => router.back()} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const trailer = serie.videos?.results?.find(
    (v) => v.site === "YouTube" && v.type === "Trailer",
  );
  const cast = serie.credits?.cast?.slice(0, 10) || [];
  const providers = serie["watch/providers"]?.results?.BR?.flatrate || [];

  const backdropUrl = serie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${serie.backdrop_path}`
    : null;
  const posterUrl = serie.poster_path
    ? `https://image.tmdb.org/t/p/w500${serie.poster_path}`
    : "/placeholder-movie.jpg";

  const getYearRange = () => {
    const firstYear = serie.first_air_date
      ? new Date(serie.first_air_date).getFullYear()
      : null;
    const lastYear = serie.last_air_date
      ? new Date(serie.last_air_date).getFullYear()
      : null;
    if (!firstYear) return "N/A";
    if (!lastYear || firstYear === lastYear) return firstYear.toString();
    return `${firstYear}-${lastYear}`;
  };

  const getTotalEpisodes = () => {
    if (!serie.seasons) return null;
    return serie.seasons.reduce(
      (total, season) => total + (season.episode_count || 0),
      0,
    );
  };

  const hasCreators = serie.created_by && serie.created_by.length > 0;
  const hasNetworks = serie.networks && serie.networks.length > 0;
  const hasCompanies =
    serie.production_companies && serie.production_companies.length > 0;
  const showProductionDetails = hasCreators || hasNetworks || hasCompanies;

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

      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh]">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={serie.name}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 -mt-20 sm:-mt-32 md:-mt-48 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 w-full">
          <div className="w-48 sm:w-64 md:w-72 shrink-0 mx-auto md:mx-0 space-y-6">
            <img
              src={posterUrl}
              alt={serie.name}
              className="w-full rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-slate-800"
            />

            {/* SÓ MOSTRA SE LOGADO E TIVER NOTA */}
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
                      className="w-12 h-12 rounded-xl shadow-md border border-slate-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {showProductionDetails && (
              <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 text-center md:text-left">
                  Detalhes Técnicos
                </h3>
                {hasNetworks && (
                  <div>
                    <h4 className="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start">
                      <Tv className="w-3 h-3 mr-1" /> Emissora Original
                    </h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {serie.networks!.map((net) => (
                        <Badge
                          key={net.id}
                          variant="secondary"
                          className="bg-slate-200 text-slate-900 text-center"
                        >
                          {net.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {hasCreators && (
                  <div>
                    <h4 className="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start">
                      <Users className="w-3 h-3 mr-1" /> Criadores
                    </h4>
                    <div className="space-y-1">
                      {serie.created_by!.map((creator) => (
                        <p
                          key={creator.id}
                          className="text-slate-200 text-sm font-medium text-center md:text-left"
                        >
                          {creator.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {hasCompanies && (
                  <div>
                    <h4 className="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start">
                      <Building2 className="w-3 h-3 mr-1" /> Produtoras
                    </h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {serie.production_companies!.map((pc) => (
                        <Badge
                          key={pc.id}
                          variant="outline"
                          className="border-slate-700 text-slate-300 text-center truncate max-w-full"
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

          <div className="flex-1 min-w-0 pt-2 md:pt-10 w-full">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-2 text-center md:text-left break-words">
              {serie.name}
            </h1>
            {serie.tagline && (
              <p className="text-lg sm:text-xl text-slate-400 italic mb-6 text-center md:text-left font-light break-words">
                "{serie.tagline}"
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-sm sm:text-base font-medium">
              <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/20">
                <Star className="w-5 h-5 mr-1.5 fill-current" />
                <span className="text-lg">
                  {serie.vote_average?.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center text-slate-300">
                <Calendar className="w-4 h-4 mr-1.5 text-slate-500" />
                {getYearRange()}
              </div>
              <div className="flex items-center text-slate-300">
                <Tv className="w-4 h-4 mr-1.5 text-slate-500" />
                {serie.number_of_seasons} Temporada
                {serie.number_of_seasons !== 1 ? "s" : ""}
              </div>
              {getTotalEpisodes() && (
                <div className="flex items-center text-slate-300">
                  <Play className="w-4 h-4 mr-1.5 text-slate-500" />
                  {getTotalEpisodes()} Episódios
                </div>
              )}
              {serie.status && (
                <div
                  className={`flex items-center ${serie.status === "Ended" ? "text-red-400" : "text-emerald-400"}`}
                >
                  <Info className="w-4 h-4 mr-1.5" />
                  {serie.status === "Ended"
                    ? "Finalizada"
                    : serie.status === "Returning Series"
                      ? "Em Andamento"
                      : serie.status}
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8 w-full">
              {/* BLOQUEIO DO BOTÃO DE AVALIAÇÃO */}
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
                      : "Avaliar Série"}
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

              {serie.homepage && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => window.open(serie.homepage, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Site Oficial
                </Button>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
              {serie.genres?.map((genre) => (
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
                <Film className="w-5 h-5 mr-2 text-slate-500" /> Sinopse
              </h3>
              <p className="text-slate-300 leading-relaxed text-lg text-center md:text-left break-words">
                {serie.overview ||
                  "Nenhuma sinopse disponível para esta série."}
              </p>
            </div>

            {(serie.last_air_date || serie.next_episode_to_air) && (
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {serie.last_air_date && (
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                      Último Episódio
                    </p>
                    {serie.last_episode_to_air?.name && (
                      <p className="text-slate-200 font-medium line-clamp-1 mb-2">
                        {serie.last_episode_to_air.name}
                      </p>
                    )}
                    <div className="flex items-center text-slate-300 text-sm">
                      <Clock className="w-4 h-4 mr-2 text-slate-500" />
                      {new Date(serie.last_air_date).toLocaleDateString(
                        "pt-BR",
                      )}
                      {serie.last_episode_to_air && (
                        <>
                          <span className="mx-2">•</span>T
                          {serie.last_episode_to_air.season_number}:E
                          {serie.last_episode_to_air.episode_number}
                        </>
                      )}
                    </div>
                  </div>
                )}
                {serie.next_episode_to_air && (
                  <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">
                      Próximo Episódio
                    </p>
                    <p className="text-slate-200 font-medium text-base line-clamp-1">
                      {serie.next_episode_to_air.name}
                    </p>
                    <div className="flex flex-wrap items-center mt-2 text-sm text-emerald-200/80">
                      <CalendarDays className="w-4 h-4 mr-1.5 shrink-0" />
                      {new Date(
                        serie.next_episode_to_air.air_date,
                      ).toLocaleDateString("pt-BR")}
                      <span className="mx-2">•</span>T
                      {serie.next_episode_to_air.season_number}:E
                      {serie.next_episode_to_air.episode_number}
                    </div>
                  </div>
                )}
              </div>
            )}

            {trailer && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Play className="w-5 h-5 mr-2 text-red-500" /> Trailer Oficial
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
                      <h4 className="text-sm font-semibold text-slate-200 line-clamp-1">
                        {actor.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {actor.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {serie.seasons && serie.seasons.length > 0 && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Tv className="w-5 h-5 mr-2 text-slate-400" /> Todas as
                  Temporadas ({serie.number_of_seasons})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {serie.seasons.map((season) => (
                    <div
                      key={`season-${season.id}`}
                      className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors flex gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-slate-100 font-semibold text-base truncate pr-2">
                            {season.name}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="bg-slate-700 text-slate-300 shrink-0"
                          >
                            {season.episode_count} ep.
                          </Badge>
                        </div>
                        {season.air_date && (
                          <p className="text-slate-400 text-xs mb-2">
                            Lançamento:{" "}
                            {new Date(season.air_date).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        )}
                        {season.overview ? (
                          <p className="text-slate-400 text-xs line-clamp-2 mt-1">
                            {season.overview}
                          </p>
                        ) : (
                          <p className="text-slate-500 text-xs italic mt-1">
                            Nenhuma sinopse disponível.
                          </p>
                        )}
                      </div>
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
        onSubmit={handleRateSerie}
        itemTitle={serie.name || ""}
        itemType="série"
        itemId={serie.id}
        currentRating={
          userRating
            ? { myVote: String(userRating.rating), comment: userRating.comment }
            : null
        }
      />
    </div>
  );
}
