import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TmdbSerie } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Star, Tv, MessageSquare, Heart } from "lucide-react";

interface SerieCardProps {
  serie: TmdbSerie;
  onClick: () => void;
  userRating?: {
    myVote: string;
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

  return (
    <Card
      className="group cursor-pointer hover:scale-[1.02] transition-all duration-300 bg-slate-800/80 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/70 hover:shadow-xl hover:shadow-slate-900/30"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={imageUrl}
            alt={serie.name}
            className="w-full h-[300px] object-cover rounded-t-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-movie.jpg";
            }}
          />

          {/* Badge da avaliação do usuário */}
          {userRating && (
            <div className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              {userRating.myVote}
            </div>
          )}

          <Badge className="absolute top-2 left-2 bg-green-600/90 text-white text-xs">
            <Tv className="w-3 h-3 mr-1" />
            Série
          </Badge>

          {/* Botão de favorito */}
          {showFavoriteButton && onFavoriteToggle && (
            <Button
              variant="ghost"
              size="sm"
              className={`absolute top-2 right-2 w-8 h-8 p-0 rounded-full transition-all duration-300 z-10 ${
                isFavorite
                  ? "bg-pink-600/90 hover:bg-pink-700/90 text-white shadow-lg scale-110 backdrop-blur-sm"
                  : "bg-black/60 hover:bg-black/80 text-white hover:scale-110 backdrop-blur-sm"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle();
              }}
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
              />
            </Button>
          )}

          {/* Ícone de comentário (apenas quando não há botão de favorito) */}
          {userRating && userRating.comment && !showFavoriteButton && (
            <div className="absolute bottom-2 right-2 bg-green-600/90 backdrop-blur-sm text-white p-1 rounded-full shadow-lg">
              <MessageSquare className="w-3 h-3" />
            </div>
          )}
          {/* Overlay com informações básicas */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-lg flex items-end backdrop-blur-[1px]">
            <div className="p-4 w-full">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current drop-shadow-sm" />
                  <span className="text-sm font-medium drop-shadow-sm">
                    {serie.vote_average?.toFixed(1) || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações da série */}
        <div className="p-4">
          <h3 className="text-slate-50 font-medium text-sm line-clamp-2 mb-2">
            {serie.name}
          </h3>
          <p className="text-slate-400 text-xs">{getYearRange()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
