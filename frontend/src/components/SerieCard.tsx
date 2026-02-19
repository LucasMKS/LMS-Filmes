import { MediaCard } from "@/components/MediaCard";
import { TmdbSerie } from "@/lib/types";
import { Tv, UserStar } from "lucide-react";

interface SerieCardProps {
  serie: TmdbSerie;
  onClick: () => void;
  userRating?: {
    rating: string;
    comment?: string;
  } | null;
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export function SerieCard({
  serie,
  onClick,
  userRating,
  showFavoriteButton = false,
  isFavorite = false,
  onFavoriteToggle,
}: SerieCardProps) {
  const imageUrl = serie.poster_path
    ? serie.poster_path.startsWith("http")
      ? serie.poster_path
      : `https://image.tmdb.org/t/p/w500${serie.poster_path}`
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

  return (
    <MediaCard
      imageUrl={imageUrl}
      altText={serie.name}
      title={serie.name}
      subtitle={getYearRange()}
      onClick={onClick}
      userRating={userRating}
      showFavoriteButton={showFavoriteButton}
      isFavorite={isFavorite}
      onFavoriteToggle={onFavoriteToggle}
      badgeLabel="Série"
      badgeIcon={Tv}
      badgeClassName="bg-green-600/90"
      overlayRating={serie.vote_average}
      overlayIcon={UserStar}
      overlayIconClassName="text-yellow-500"
      userRatingIconClassName="text-yellow-300"
      cardClassName="hover:shadow-zinc-950 bg-gray-900 backdrop-blur-sm border-2 !border-slate-950 shadow-zinc-950 shadow-lg"
    />
  );
}
