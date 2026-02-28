"use client";

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
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/70 focus-within:ring-offset-2 focus-within:ring-offset-slate-950",
        cardClassName,
      )}
    >
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`Ver detalhes de ${title}`}
      />

      <CardContent className="relative z-0 p-0">
        <div className="relative overflow-hidden">
          <img
            src={imgSrc}
            alt={altText}
            className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgSrc("/placeholder-movie.jpg")}
          />

          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent opacity-100 transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100">
            <div className="w-full p-4">
              <div className="flex w-fit items-center space-x-2 rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-1.5 text-white backdrop-blur-sm">
                <OverlayIcon
                  className={cn("h-4 w-4 fill-current", overlayIconClassName)}
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

        <div className="border-t border-slate-800/60 bg-slate-900 p-4">
          <h3 className="mb-1 line-clamp-1 text-base font-bold text-slate-100 transition-colors group-hover:text-blue-400">
            {title}
          </h3>
          <p className="text-sm font-medium text-slate-400">{subtitle}</p>
        </div>
      </CardContent>

      {onQuickView && (
        <div className="absolute left-1/2 top-[160px] z-20 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-14 w-14 rounded-full border border-white/10 bg-slate-950/70 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
            aria-label="Visualização rápida"
          >
            <Eye className="h-6 w-6" />
          </Button>
        </div>
      )}

      <Badge
        className={cn(
          "pointer-events-none absolute left-3 top-3 z-20 px-2.5 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md",
          badgeClassName,
        )}
      >
        <BadgeIcon className="mr-1.5 h-3.5 w-3.5" />
        {badgeLabel}
      </Badge>

      {userRating && (
        <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-600/95 px-2.5 py-1 text-xs font-bold text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)] backdrop-blur-md">
          <Star
            className={cn("h-3.5 w-3.5 fill-current", userRatingIconClassName)}
          />
          {userRating.rating}
        </div>
      )}

      {showFavoriteButton && onFavoriteToggle && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute z-20 h-9 w-9 rounded-full transition-all duration-300 hover:scale-110",
            userRating ? "right-3 top-12" : "right-3 top-3",
            isFavorite
              ? "border border-pink-500/50 bg-pink-600/90 text-white shadow-[0_4px_12px_rgba(219,39,119,0.4)] backdrop-blur-sm hover:bg-pink-500"
              : "border border-white/20 bg-slate-950/50 text-white backdrop-blur-sm hover:bg-slate-950/80",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          aria-label={
            isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
        >
          <Heart className={cn("h-4.5 w-4.5", isFavorite && "fill-current")} />
        </Button>
      )}

      {userRating && userRating.comment && !showFavoriteButton && (
        <div className="pointer-events-none absolute bottom-[80px] right-3 z-20 rounded-full border border-emerald-500/30 bg-emerald-600/95 p-1.5 text-white shadow-lg backdrop-blur-md">
          <MessageSquare className="h-3.5 w-3.5" />
        </div>
      )}
    </Card>
  );
}
