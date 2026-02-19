import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, Star, type LucideIcon } from "lucide-react";

interface MediaCardProps {
  imageUrl: string;
  altText: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  userRating?: {
    rating: string;
    comment?: string;
  } | null;
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  cardClassName?: string;
  badgeLabel: string;
  badgeIcon: LucideIcon;
  badgeClassName?: string;
  overlayRating?: number;
  overlayIcon?: LucideIcon;
  overlayIconClassName?: string;
  userRatingIconClassName?: string;
}

export function MediaCard({
  imageUrl,
  altText,
  title,
  subtitle,
  onClick,
  userRating,
  showFavoriteButton = false,
  isFavorite = false,
  onFavoriteToggle,
  cardClassName,
  badgeLabel,
  badgeIcon: BadgeIcon,
  badgeClassName,
  overlayRating,
  overlayIcon: OverlayIcon = Star,
  overlayIconClassName,
  userRatingIconClassName,
}: MediaCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer hover:scale-[1.02] transition-all duration-300 hover:border-slate-600/70 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        cardClassName,
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-[300px] object-cover rounded-t-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-movie.jpg";
            }}
          />

          {userRating && (
            <div className="absolute top-2 right-2 z-20 bg-blue-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
              <Star
                className={cn("w-3 h-3 fill-current", userRatingIconClassName)}
              />
              {userRating.rating}
            </div>
          )}

          <Badge
            className={cn(
              "absolute top-2 left-2 z-20 text-white text-xs",
              badgeClassName,
            )}
          >
            <BadgeIcon className="w-3 h-3 mr-1" />
            {badgeLabel}
          </Badge>

          {showFavoriteButton && onFavoriteToggle && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "absolute top-2 right-2 z-20 w-8 h-8 p-0 rounded-full transition-all duration-300",
                isFavorite
                  ? "bg-pink-600/90 hover:bg-pink-700/90 text-white shadow-lg scale-110 backdrop-blur-sm"
                  : "bg-black/60 hover:bg-black/80 text-white hover:scale-110 backdrop-blur-sm",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle();
              }}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
          )}

          {userRating && userRating.comment && !showFavoriteButton && (
            <div className="absolute bottom-2 right-2 z-20 bg-green-600/90 backdrop-blur-sm text-white p-1 rounded-full shadow-lg">
              <MessageSquare className="w-3 h-3" />
            </div>
          )}

          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-t-lg flex items-end">
            <div className="p-4 w-full">
              <div className="flex items-center space-x-2 text-white">
                <OverlayIcon
                  className={cn(
                    "w-4 h-4 fill-current drop-shadow-sm",
                    overlayIconClassName,
                  )}
                />
                <span className="text-sm font-medium drop-shadow-sm">
                  {typeof overlayRating === "number"
                    ? overlayRating.toFixed(1)
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-slate-50 font-medium text-sm line-clamp-2 mb-2">
            {title}
          </h3>
          <p className="text-slate-300 text-xs">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
