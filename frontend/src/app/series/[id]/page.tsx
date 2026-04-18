"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { seriesApi, ratingSeriesApi, watchlistSeriesApi } from "@/lib/api";
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
  ListPlus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function SerieDetailsPage() {
  const queryClient = useQueryClient();
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
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  useEffect(() => {
    const logged = AuthService.isAuthenticated();
    setIsLoggedIn(logged);

    const fetchData = async () => {
      if (!serieId) return;
      try {
        setLoading(true);
        if (logged) setLoadingRating(true);

        const [serieData, ratingData, watchlistData] = await Promise.all([
          seriesApi.getSerieDetails(serieId, true),
          logged
            ? ratingSeriesApi.getSerieRating(serieId).catch((e: any) => {
                if (e?.status !== 404) console.error("Erro ao buscar avaliação:", e);
                return null;
              })
            : Promise.resolve(null),
          logged
            ? watchlistSeriesApi.getWatchlistStatus(serieId).catch((e: any) => {
                console.error("Erro ao buscar watchlist:", e);
                return { inWatchlist: false };
              })
            : Promise.resolve({ inWatchlist: false }),
        ]);

        setSerie(serieData);
        if (ratingData) setUserRating(ratingData);
        setIsInWatchlist(watchlistData.inWatchlist);
      } catch (err) {
        console.error("Erro ao buscar série:", err);
        setError("Não foi possível carregar os detalhes desta série.");
      } finally {
        setLoading(false);
        setLoadingRating(false);
      }
    };

    fetchData();
  }, [serieId]);

  const handleToggleWatchlist = async () => {
    if (!serie) return;
    setLoadingWatchlist(true);
    try {
      const res = await watchlistSeriesApi.toggleWatchlist(String(serie.id));
      setIsInWatchlist(res.inWatchlist);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(res.inWatchlist ? "Série adicionada à Watchlist!" : "Série removida da Watchlist!");
    } catch {
      toast.error("Erro ao atualizar a Watchlist.");
    } finally {
      setLoadingWatchlist(false);
    }
  };

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
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (error || !serie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white/70">
        <h2 className="text-2xl font-bold mb-4">{error || "Série não encontrada."}</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 transition-all"
        >
          Voltar
        </button>
      </div>
    );
  }

  const trailer = serie.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");
  const cast = serie.credits?.cast?.slice(0, 10) || [];
  const providers = serie["watch/providers"]?.results?.BR?.flatrate || [];

  const currentGenreIds = serie.genres?.map((g) => g.id) || [];
  const filteredRecommendations = (serie.recommendations?.results || [])
    .filter((rec) => {
      if (!rec.genre_ids || rec.genre_ids.length === 0) return false;
      return rec.genre_ids.some((id) => currentGenreIds.includes(id));
    })
    .slice(0, 12);

  const backdropUrl = serie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${serie.backdrop_path}`
    : null;
  const posterUrl = serie.poster_path
    ? `https://image.tmdb.org/t/p/w500${serie.poster_path}`
    : "/placeholder-movie.jpg";

  const getYearRange = () => {
    const firstYear = serie.first_air_date ? new Date(serie.first_air_date).getFullYear() : null;
    const lastYear = serie.last_air_date ? new Date(serie.last_air_date).getFullYear() : null;
    if (!firstYear) return "N/A";
    if (!lastYear || firstYear === lastYear) return firstYear.toString();
    return `${firstYear}-${lastYear}`;
  };

  const getTotalEpisodes = () => {
    if (!serie.seasons) return null;
    return serie.seasons.reduce((total, season) => total + (season.episode_count || 0), 0);
  };

  const hasCreators = serie.created_by && serie.created_by.length > 0;
  const hasNetworks = serie.networks && serie.networks.length > 0;
  const hasCompanies = serie.production_companies && serie.production_companies.length > 0;
  const showProductionDetails = hasCreators || hasNetworks || hasCompanies;

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
          <img src={backdropUrl} alt={serie.name} className="w-full h-full object-cover opacity-60" />
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
              alt={serie.name}
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
                  Detalhes Técnicos
                </h3>
                {hasNetworks && (
                  <div>
                    <h4 className="text-white/30 text-xs uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start">
                      <Tv className="w-3 h-3 mr-1" /> Emissora Original
                    </h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {serie.networks!.map((net) => (
                        <span
                          key={net.id}
                          className="bg-white/90 text-[#0a0a0f] px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm"
                        >
                          {net.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {hasCreators && (
                  <div>
                    <h4 className="text-white/30 text-xs uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start">
                      <Users className="w-3 h-3 mr-1" /> Criadores
                    </h4>
                    <div className="space-y-1">
                      {serie.created_by!.map((creator) => (
                        <p key={creator.id} className="text-white/60 text-sm font-medium text-center md:text-left">
                          {creator.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {hasCompanies && (
                  <div>
                    <h4 className="text-white/30 text-xs uppercase tracking-wider mb-2 flex items-center justify-center md:justify-start">
                      <Building2 className="w-3 h-3 mr-1" /> Produtoras
                    </h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {serie.production_companies!.map((pc) => (
                        <span
                          key={pc.id}
                          className="px-2 py-0.5 rounded-lg border border-white/[0.06] text-white/50 bg-white/5 text-xs truncate max-w-full"
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
              {serie.name}
            </h1>
            {serie.tagline && (
              <p className="text-lg sm:text-xl text-white/35 italic mb-6 text-center md:text-left font-light break-words">
                "{serie.tagline}"
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-sm sm:text-base font-medium">
              <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/20">
                <Star className="w-5 h-5 mr-1.5 fill-current" />
                <span className="text-lg">{serie.vote_average?.toFixed(1)}</span>
              </div>
              <div className="flex items-center text-white/55">
                <Calendar className="w-4 h-4 mr-1.5 text-white/25" />
                {getYearRange()}
              </div>
              <div className="flex items-center text-white/55">
                <Tv className="w-4 h-4 mr-1.5 text-white/25" />
                {serie.number_of_seasons} Temporada{serie.number_of_seasons !== 1 ? "s" : ""}
              </div>
              {getTotalEpisodes() && (
                <div className="flex items-center text-white/55">
                  <Play className="w-4 h-4 mr-1.5 text-white/25" />
                  {getTotalEpisodes()} Episódios
                </div>
              )}
              {serie.status && (
                <div className={`flex items-center ${serie.status === "Ended" ? "text-red-400" : "text-emerald-400"}`}>
                  <Info className="w-4 h-4 mr-1.5" />
                  {serie.status === "Ended"
                    ? "Finalizada"
                    : serie.status === "Returning Series"
                      ? "Em Andamento"
                      : serie.status}
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8 w-full">
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

              {serie.homepage && (
                <button
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm font-medium transition-all"
                  onClick={() => window.open(serie.homepage, "_blank")}
                >
                  <ExternalLink className="w-4 h-4" /> Site Oficial
                </button>
              )}
            </div>

            {/* Gêneros */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
              {serie.genres?.map((genre) => (
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
                {serie.overview || "Nenhuma sinopse disponível para esta série."}
              </p>
            </div>

            {/* Episódios recentes */}
            {(serie.last_air_date || serie.next_episode_to_air) && (
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {serie.last_air_date && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/35 font-medium uppercase tracking-wider mb-1">
                      Último Episódio
                    </p>
                    {serie.last_episode_to_air?.name && (
                      <p className="text-white/70 font-medium line-clamp-1 mb-2">
                        {serie.last_episode_to_air.name}
                      </p>
                    )}
                    <div className="flex items-center text-white/50 text-sm">
                      <Clock className="w-4 h-4 mr-2 text-white/25" />
                      {new Date(serie.last_air_date).toLocaleDateString("pt-BR")}
                      {serie.last_episode_to_air && (
                        <>
                          <span className="mx-2">•</span>T{serie.last_episode_to_air.season_number}:E
                          {serie.last_episode_to_air.episode_number}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {serie.next_episode_to_air && (
                  <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">
                      Próximo Episódio
                    </p>
                    <p className="text-white/80 font-medium text-base line-clamp-1">
                      {serie.next_episode_to_air.name}
                    </p>
                    <div className="flex flex-wrap items-center mt-2 text-sm text-emerald-300/70">
                      <CalendarDays className="w-4 h-4 mr-1.5 shrink-0" />
                      {new Date(serie.next_episode_to_air.air_date).toLocaleDateString("pt-BR")}
                      <span className="mx-2">•</span>T{serie.next_episode_to_air.season_number}:E
                      {serie.next_episode_to_air.episode_number}
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* Temporadas */}
            {serie.seasons && serie.seasons.length > 0 && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-white/30" /> Todas as Temporadas ({serie.number_of_seasons})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {serie.seasons.map((season) => (
                    <div
                      key={`season-${season.id}`}
                      className="bg-white/5 p-4 rounded-xl border border-white/[0.06] hover:bg-white/[0.07] transition-colors flex gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-white/80 font-semibold text-base truncate pr-2">{season.name}</h4>
                          <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/50 text-xs font-medium shrink-0">
                            {season.episode_count} ep.
                          </span>
                        </div>
                        {season.air_date && (
                          <p className="text-white/35 text-xs mb-2">
                            Lançamento: {new Date(season.air_date).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        {season.overview ? (
                          <p className="text-white/35 text-xs line-clamp-2 mt-1">{season.overview}</p>
                        ) : (
                          <p className="text-white/25 text-xs italic mt-1">Nenhuma sinopse disponível.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendações */}
            {filteredRecommendations.length > 0 && (
              <div className="mb-12 w-full mt-10">
                <h3 className="text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-violet-400" /> Séries Semelhantes
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x w-full">
                  {filteredRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="w-32 sm:w-36 shrink-0 snap-start cursor-pointer group"
                      onClick={() => router.push(`/series/${rec.id}`)}
                    >
                      <div className="w-full aspect-[2/3] mb-3 rounded-xl overflow-hidden bg-white/5 border border-white/[0.06] relative shadow-md">
                        <img
                          src={
                            rec.poster_path
                              ? `https://image.tmdb.org/t/p/w342${rec.poster_path}`
                              : "/placeholder-movie.jpg"
                          }
                          alt={rec.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-[#0a0a0f]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                          <ExternalLink className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                      </div>
                      <h4
                        className="text-sm font-semibold text-white/60 line-clamp-2 group-hover:text-violet-400 transition-colors"
                        title={rec.name}
                      >
                        {rec.name}
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
        onSubmit={handleRateSerie}
        itemTitle={serie.name || ""}
        itemType="série"
        itemId={serie.id}
        currentRating={
          userRating ? { myVote: String(userRating.rating), comment: userRating.comment } : null
        }
      />
    </div>
  );
}
