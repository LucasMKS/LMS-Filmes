"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TmdbSerie, Serie as UserRatingSerie, WatchlistStatus } from "@/lib/types";
import { RatingDialog } from "@/components/RatingDialog";
import { EpisodeList } from "@/components/EpisodeList";
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
  ChevronDown,
  CheckCircle2,
  XCircle,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AddToListModal } from "@/components/AddToListModal";
import { useEffect } from "react";
import { watchlistSeriesApi, favoriteSeriesApi } from "@/lib/api";

interface SerieClientDetailsProps {
  serie: TmdbSerie;
  initialUserRating: UserRatingSerie | null;
  initialIsInWatchlist: boolean;
  isLoggedIn: boolean;
}

export function SerieClientDetails({
  serie,
  initialUserRating,
  initialIsInWatchlist,
  isLoggedIn,
}: SerieClientDetailsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [userRating, setUserRating] = useState<UserRatingSerie | null>(initialUserRating);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);
  
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist);
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus | null>(null);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [watchedEpisodesCount, setWatchedEpisodesCount] = useState(0);
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);

  const [posterLoading, setPosterLoading] = useState(true);
  const posterRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isLoggedIn && serie.id) {
      loadWatchlistStatus(String(serie.id));
      loadWatchedProgress(String(serie.id));
    }
  }, [serie.id, isLoggedIn]);

  const loadWatchlistStatus = async (serieId: string) => {
    try {
      const res = await watchlistSeriesApi.getWatchlistStatus(serieId);
      setIsInWatchlist(res.inWatchlist);
      setWatchlistStatus(res.status || null);
    } catch (error) {
      console.error("Erro ao carregar status da watchlist:", error);
    }
  };

  const loadWatchedProgress = async (serieId: string) => {
    try {
      const watched = await favoriteSeriesApi.getWatchedEpisodes(serieId);
      setWatchedEpisodesCount(watched.length);
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
    }
  };

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

  useEffect(() => {
    if (posterRef.current?.complete) {
      setPosterLoading(false);
    }
  }, [posterUrl]);

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

  const handleToggleWatchlist = async () => {
    setLoadingWatchlist(true);
    try {
      const res = await watchlistSeriesApi.toggleWatchlist(String(serie.id), isInWatchlist ? undefined : "WATCHING");
      setIsInWatchlist(res.inWatchlist);
      setWatchlistStatus(res.status || null);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(res.inWatchlist ? "Você está acompanhando esta série!" : "Parou de acompanhar esta série!");
    } catch {
      toast.error("Erro ao atualizar o acompanhamento.");
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const handleRateSerie = async (ratingString: string, comment?: string) => {
    try {
      const ratingValue = parseFloat(ratingString);
      const { rateMediaAction } = await import("@/app/actions");
      const result = await rateMediaAction(String(serie.id), "serie", {
        rating: ratingValue,
        title: serie.name || "Série Desconhecida",
        poster_path: serie.poster_path || "",
        comment: comment,
      });

      if (result.success && result.data) {
        setUserRating(result.data as UserRatingSerie);
      } else {
        throw new Error(result.error || "Erro ao avaliar");
      }
    } catch (error) {
      console.error("Erro ao avaliar:", error);
      throw error;
    }
  };

  const getWatchlistButtonLabel = () => {
    if (!isInWatchlist) return "Acompanhar Série";
    
    if (watchlistStatus === "PLAN_TO_WATCH") {
      return "Acompanhando (Ver depois)";
    }
    if (watchlistStatus === "DROPPED") {
      return "Acompanhando (Abandonado)";
    }
    
    const total = getTotalEpisodes();
    if (total !== null && total > 0 && watchedEpisodesCount >= total) {
      return "Acompanhando (Em dia)";
    }
    
    return "Acompanhando (Assistindo)";
  };

  const getWatchlistButtonIcon = () => {
    if (!isInWatchlist) return <ListPlus className="w-4 h-4" />;
    
    if (watchlistStatus === "PLAN_TO_WATCH") {
      return <Clock className="w-4 h-4 text-amber-400" />;
    }
    if (watchlistStatus === "DROPPED") {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    
    const total = getTotalEpisodes();
    if (total !== null && total > 0 && watchedEpisodesCount >= total) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    
    return <Play className="w-4 h-4 fill-current text-violet-400" />;
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
          <Image 
            src={backdropUrl} 
            alt={serie.name} 
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
                alt={serie.name}
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

            {/* Progress Bar (if watching or has progress) */}
            {isLoggedIn && (watchedEpisodesCount > 0 || watchlistStatus === "WATCHING") && (
              <div className="mb-8 max-w-md mx-auto md:mx-0">
                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2">
                  <span>Progresso da Série</span>
                  <span>{watchedEpisodesCount} / {getTotalEpisodes() || 0} episódios</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                  <div 
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-500 ease-out"
                    style={{ width: `${(watchedEpisodesCount / (getTotalEpisodes() || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

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
                    {getWatchlistButtonIcon()}
                    {getWatchlistButtonLabel()}
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
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 font-semibold text-sm transition-all"
                onClick={() => setIsAddToListOpen(true)}
              >
                <FolderPlus className="w-4 h-4 text-violet-400" />
                Salvar em Lista
              </button>

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

            {/* Temporadas */}
            {serie.seasons && serie.seasons.length > 0 && (
              <div className="mb-12 w-full">
                <h3 className="text-xl font-semibold text-white/80 mb-4 flex items-center gap-2">
                  <Tv className="w-5 h-5 text-white/30" /> Todas as Temporadas ({serie.number_of_seasons})
                </h3>
                <div className="space-y-4">
                  {serie.seasons.map((season) => (
                    <details 
                      key={`season-${season.id}`}
                      className={cn(
                        "group bg-white/5 rounded-xl border border-white/[0.06] overflow-hidden transition-all",
                        watchlistStatus === "WATCHING" && "border-emerald-500/20 bg-emerald-500/[0.02]"
                      )}
                      open={watchlistStatus === "WATCHING" && season.season_number === 1}
                    >
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.04] transition-colors list-none">
                        <div className="flex items-center gap-4">
                          {season.poster_path ? (
                            <div className="relative w-10 h-14 sm:w-12 sm:h-18 aspect-[2/3] rounded-md overflow-hidden">
                              <Image 
                                src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                                alt={season.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 sm:w-12 sm:h-18 aspect-[2/3] rounded-md bg-white/5 flex items-center justify-center">
                              <Tv className="w-6 h-6 text-white/10" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-white/90 font-bold text-sm sm:text-base">
                              {season.name}
                            </h4>
                            <p className="text-white/35 text-[10px] sm:text-xs">
                              {season.episode_count} episódios • {season.air_date ? new Date(season.air_date).getFullYear() : "N/A"}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-white/20 group-open:rotate-180 transition-transform" />
                      </summary>
                      
                      <div className="p-4 border-t border-white/[0.03] bg-[#0a0a0f]/40">
                        <EpisodeList 
                          serieId={serie.id} 
                          seasonNumber={season.season_number} 
                          isLoggedIn={isLoggedIn}
                          onToggleWatched={() => loadWatchedProgress(String(serie.id))}
                        />
                      </div>
                    </details>
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
                      <div className="relative w-full aspect-[2/3] mb-3 rounded-xl overflow-hidden bg-white/5 border border-white/[0.06] shadow-md">
                        <Image
                          src={
                            rec.poster_path
                              ? `https://image.tmdb.org/t/p/w342${rec.poster_path}`
                              : "/placeholder-movie.jpg"
                          }
                          alt={rec.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
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

      <AddToListModal
        isOpen={isAddToListOpen}
        onClose={() => setIsAddToListOpen(false)}
        item={{
          id: serie.id,
          type: "serie",
          title: serie.name || "",
          posterPath: serie.poster_path || null,
          backdropPath: serie.backdrop_path || null,
          voteAverage: serie.vote_average,
          releaseYear: serie.first_air_date
            ? serie.first_air_date.substring(0, 4)
            : undefined,
        }}
      />
    </div>
  );
}
