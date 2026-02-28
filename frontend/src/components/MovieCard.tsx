import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, Star, Eye, type LucideIcon } from "lucide-react";

interface MediaCardProps {
  imageUrl: string;
  altText: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  onQuickView?: () => void;
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
  onQuickView,
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
  const [imgSrc, setImgSrc] = useState(imageUrl);

  useEffect(() => {
    setImgSrc(imageUrl);
  }, [imageUrl]);

  return (
    <Card
      className={cn(
        "group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/70 focus-within:ring-offset-2 focus-within:ring-offset-slate-950 overflow-hidden relative",
        cardClassName,
      )}
    >
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <img
            src={imgSrc}
            alt={altText}
            className="w-full h-[320px] object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgSrc("/placeholder-movie.jpg")}
          />

          {onQuickView && (
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <Button
                variant="secondary"
                size="icon"
                className="w-14 h-14 rounded-full bg-slate-950/70 hover:bg-blue-600 text-white backdrop-blur-md border border-white/10 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-auto"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickView();
                }}
                aria-label="Visualização rápida"
              >
                <Eye className="w-6 h-6" />
              </Button>
            </div>
          )}

          {userRating && (
            <div className="absolute top-3 right-3 z-0 bg-blue-600/95 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-[0_4px_12px_rgba(37,99,235,0.4)] border border-blue-500/30">
              <Star
                className={cn(
                  "w-3.5 h-3.5 fill-current",
                  userRatingIconClassName,
                )}
              />
              {userRating.rating}
            </div>
          )}

          <Badge
            className={cn(
              "absolute top-3 left-3 z-0 text-white text-xs backdrop-blur-md shadow-lg font-semibold px-2.5 py-1",
              badgeClassName,
            )}
          >
            <BadgeIcon className="w-3.5 h-3.5 mr-1.5" />
            {badgeLabel}
          </Badge>

          {showFavoriteButton && onFavoriteToggle && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute top-3 right-3 z-20 w-9 h-9 rounded-full transition-all duration-300 hover:scale-110 pointer-events-auto",
                userRating ? "top-12" : "",
                isFavorite
                  ? "bg-pink-600/90 hover:bg-pink-500 text-white shadow-[0_4px_12px_rgba(219,39,119,0.4)] border border-pink-500/50 backdrop-blur-sm"
                  : "bg-slate-950/50 hover:bg-slate-950/80 text-white backdrop-blur-sm border border-white/20",
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavoriteToggle();
              }}
              aria-label={
                isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
              }
            >
              <Heart
                className={cn("w-4.5 h-4.5", isFavorite && "fill-current")}
              />
            </Button>
          )}

          {userRating && userRating.comment && !showFavoriteButton && (
            <div className="absolute bottom-3 right-3 z-0 bg-emerald-600/95 backdrop-blur-md text-white p-1.5 rounded-full shadow-lg border border-emerald-500/30">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 flex items-end">
            <div className="p-4 w-full">
              <div className="flex items-center space-x-2 text-white bg-slate-950/60 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm border border-slate-700/50">
                <OverlayIcon
                  className={cn("w-4 h-4 fill-current", overlayIconClassName)}
                />
                <span className="text-sm font-bold">
                  {typeof overlayRating === "number"
                    ? overlayRating.toFixed(1)
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800/60">
          <h3 className="text-slate-100 font-bold text-base line-clamp-1 mb-1 group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-slate-400 text-sm font-medium">{subtitle}</p>
        </div>
      </CardContent>

      <button
        className="absolute inset-0 w-full h-full z-10 cursor-pointer opacity-0 focus:outline-none"
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        aria-label={`Ver detalhes de ${title}`}
      />
    </Card>
  );
}
