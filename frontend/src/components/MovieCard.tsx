import { MediaCard } from "@/components/MediaCard";
import { TmdbMovie } from "@/lib/types";
import { Film, UserStar } from "lucide-react";

interface MovieCardProps {
  movie: TmdbMovie;
  onClick: () => void;
  userRating?: {
    rating: string;
    comment?: string;
  } | null;
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export function MovieCard({
  movie,
  onClick,
  userRating,
  showFavoriteButton = false,
  isFavorite = false,
  onFavoriteToggle,
}: MovieCardProps) {
  const imageUrl = movie.poster_path
    ? movie.poster_path.startsWith("http")
      ? movie.poster_path
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder-movie.jpg";

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear().toString()
    : "N/A";

  return (
    <MediaCard
      imageUrl={imageUrl}
      altText={movie.title}
      title={movie.title}
      subtitle={releaseYear}
      onClick={onClick}
      userRating={userRating}
      showFavoriteButton={showFavoriteButton}
      isFavorite={isFavorite}
      onFavoriteToggle={onFavoriteToggle}
      badgeLabel="Filme"
      badgeIcon={Film}
      badgeClassName="bg-blue-600/90"
      overlayRating={movie.vote_average}
      overlayIcon={UserStar}
      overlayIconClassName="text-yellow-500"
      userRatingIconClassName="text-yellow-300"
      cardClassName="hover:shadow-zinc-950 bg-gray-900 backdrop-blur-sm border-2 !border-slate-950 shadow-zinc-950 shadow-lg"
    />
  );
}
