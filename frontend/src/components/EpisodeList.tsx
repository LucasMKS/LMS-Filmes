import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Tv, 
  Check, 
  Circle, 
  Star, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Clock,
  CalendarDays
} from "lucide-react";
import { 
  seriesApi, 
  favoriteSeriesApi, 
  ratingSeriesApi 
} from "@/lib/api";
import { 
  TmdbSeason, 
  TmdbEpisode, 
  WatchedEpisode, 
  RatingEpisode 
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RatingDialog } from "./RatingDialog";

interface EpisodeListProps {
  serieId: number;
  seasonNumber: number;
  isLoggedIn: boolean;
}

export function EpisodeList({ serieId, seasonNumber, isLoggedIn }: EpisodeListProps) {
  const [season, setSeason] = useState<TmdbSeason | null>(null);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set());
  const [episodeRatings, setEpisodeRatings] = useState<Record<number, RatingEpisode>>({});
  const [loading, setLoading] = useState(true);
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set());
  
  const [ratingEpisode, setRatingEpisode] = useState<TmdbEpisode | null>(null);

  useEffect(() => {
    loadSeasonData();
  }, [serieId, seasonNumber]);

  const loadSeasonData = async () => {
    setLoading(true);
    try {
      const data = await seriesApi.getSeasonDetails(serieId, seasonNumber);
      setSeason(data);

      if (isLoggedIn) {
        const [watched, ratings] = await Promise.all([
          favoriteSeriesApi.getWatchedEpisodes(String(serieId)),
          ratingSeriesApi.getRatedEpisodes(String(serieId))
        ]);

        const watchedSet = new Set(
          watched
            .filter(e => e.seasonNumber === seasonNumber)
            .map(e => e.episodeNumber)
        );
        setWatchedEpisodes(watchedSet);

        const ratingsMap = ratings
          .filter(e => e.seasonNumber === seasonNumber)
          .reduce((acc, curr) => ({ ...acc, [curr.episodeNumber]: curr }), {});
        setEpisodeRatings(ratingsMap);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da temporada:", error);
      toast.error("Não foi possível carregar os episódios.");
    } finally {
      setLoading(false);
    }
  };

  const toggleWatched = async (episodeNumber: number) => {
    if (!isLoggedIn) return;
    
    const isWatched = watchedEpisodes.has(episodeNumber);
    try {
      if (isWatched) {
        await favoriteSeriesApi.unmarkAsWatched({ 
          serieId: String(serieId), 
          seasonNumber, 
          episodeNumber 
        });
        setWatchedEpisodes(prev => {
          const next = new Set(prev);
          next.delete(episodeNumber);
          return next;
        });
      } else {
        await favoriteSeriesApi.markAsWatched({ 
          serieId: String(serieId), 
          seasonNumber, 
          episodeNumber 
        });
        setWatchedEpisodes(prev => new Set(prev).add(episodeNumber));
      }
    } catch (error) {
      toast.error("Erro ao atualizar status do episódio.");
    }
  };

  const toggleExpand = (episodeNumber: number) => {
    setExpandedEpisodes(prev => {
      const next = new Set(prev);
      if (next.has(episodeNumber)) next.delete(episodeNumber);
      else next.add(episodeNumber);
      return next;
    });
  };

  const handleRateEpisode = async (rating: string, comment?: string) => {
    if (!ratingEpisode) return;
    
    try {
      const updated = await ratingSeriesApi.rateEpisode({
        serieId: String(serieId),
        seasonNumber,
        episodeNumber: ratingEpisode.episode_number,
        rating: parseFloat(rating),
        comment
      });
      
      setEpisodeRatings(prev => ({
        ...prev,
        [ratingEpisode.episode_number]: updated
      }));
      
      toast.success("Episódio avaliado!");
    } catch (error) {
      toast.error("Erro ao salvar avaliação.");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/[0.06]" />
        ))}
      </div>
    );
  }

  if (!season || !season.episodes.length) {
    return (
      <div className="text-center py-10 text-white/30 italic">
        Nenhum episódio encontrado para esta temporada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {season.episodes.map((episode) => {
        const isWatched = watchedEpisodes.has(episode.episode_number);
        const isExpanded = expandedEpisodes.has(episode.episode_number);
        const rating = episodeRatings[episode.episode_number];

        return (
          <div 
            key={episode.id}
            className={cn(
              "group bg-white/5 rounded-xl border border-white/[0.06] overflow-hidden transition-all",
              isWatched && "bg-emerald-500/[0.02] border-emerald-500/10"
            )}
          >
            <div className="flex items-center p-3 sm:p-4 gap-4">
              {/* Checkbox */}
              <button
                onClick={() => toggleWatched(episode.episode_number)}
                className={cn(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isWatched 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : "bg-white/5 text-white/20 hover:text-white/40 hover:bg-white/10"
                )}
                disabled={!isLoggedIn}
              >
                {isWatched ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>

              {/* Episode Number */}
              <div className="shrink-0 w-8 text-center">
                <span className="text-sm font-bold text-white/30 group-hover:text-white/50 transition-colors">
                  {episode.episode_number}
                </span>
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "text-sm sm:text-base font-semibold truncate transition-colors",
                  isWatched ? "text-white/60" : "text-white/90"
                )}>
                  {episode.name}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-[10px] sm:text-xs text-white/30">
                  {episode.air_date && (
                    <span className="flex items-center">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      {new Date(episode.air_date).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {episode.runtime && (
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {episode.runtime} min
                    </span>
                  )}
                  {rating && (
                    <span className="flex items-center text-yellow-500/80 font-medium">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {rating.rating}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                {isLoggedIn && (
                  <button
                    onClick={() => setRatingEpisode(episode)}
                    className="p-2 rounded-lg bg-white/5 text-white/30 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all"
                    title="Avaliar episódio"
                  >
                    <Star className={cn("w-4 h-4", rating && "fill-current text-yellow-400")} />
                  </button>
                )}
                <button
                  onClick={() => toggleExpand(episode.episode_number)}
                  className="p-2 rounded-lg bg-white/5 text-white/30 hover:text-white/80 hover:bg-white/10 transition-all"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-white/[0.03] animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col md:flex-row gap-4 mt-3">
                  {episode.still_path && (
                    <div className="relative aspect-video w-full md:w-48 shrink-0 rounded-lg overflow-hidden border border-white/5">
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                        alt={episode.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-white/50 leading-relaxed italic">
                      {episode.overview || "Sem sinopse disponível para este episódio."}
                    </p>
                    {rating?.comment && (
                      <div className="mt-4 p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/10">
                        <p className="text-[10px] uppercase font-bold text-yellow-400/40 mb-1">Seu Comentário</p>
                        <p className="text-xs text-white/60">"{rating.comment}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {ratingEpisode && (
        <RatingDialog
          isOpen={!!ratingEpisode}
          onClose={() => setRatingEpisode(null)}
          onSubmit={handleRateEpisode}
          itemTitle={ratingEpisode.name}
          itemType="episódio"
          itemId={ratingEpisode.id}
          currentRating={
            episodeRatings[ratingEpisode.episode_number] 
              ? { 
                  myVote: String(episodeRatings[ratingEpisode.episode_number].rating), 
                  comment: episodeRatings[ratingEpisode.episode_number].comment 
                } 
              : null
          }
        />
      )}
    </div>
  );
}
