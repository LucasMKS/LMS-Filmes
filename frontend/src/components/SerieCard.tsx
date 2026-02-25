import { MediaCard } from "@/components/MediaCard";
import { TmdbSerie } from "@/lib/types";
import { Tv, UserStar } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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

  const handleNavigateToDetails = () => {
    router.push(`/series/${serie.id}`);
  };

  return (
    <MediaCard
      imageUrl={imageUrl}
      altText={serie.name}
      title={serie.name}
      subtitle={getYearRange()}
      onClick={handleNavigateToDetails}
      onQuickView={onClick}
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
      cardClassName="hover:shadow-zinc-950 bg-slate-900 border-2 border-slate-800"
    />
  );
}
