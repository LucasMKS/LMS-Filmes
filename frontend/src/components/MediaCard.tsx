"use client";

import { useState, useEffect } from "react";
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
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#14141c] transition-all duration-300",
        "hover:-translate-y-1.5 hover:border-purple-500/20 hover:shadow-[0_8px_32px_rgba(168,85,247,0.15)]",
        "focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:ring-offset-2 focus-within:ring-offset-[#0a0a0f]",
        cardClassName,
      )}
    >
      {/* Glow decorativo no topo ao hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

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

      <div className="relative z-0">
        {/* Imagem */}
        <div className="relative overflow-hidden">
          <img
            src={imgSrc}
            alt={altText}
            className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgSrc("/placeholder-movie.jpg")}
          />

          {/* Overlay com nota global */}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent opacity-100 transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100">
            <div className="w-full p-4">
              <div className="flex w-fit items-center gap-1.5 rounded-xl border border-white/10 bg-[#0a0a0f]/70 px-3 py-1.5 text-white backdrop-blur-md">
                <OverlayIcon
                  className={cn("h-3.5 w-3.5 fill-current", overlayIconClassName)}
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

        {/* Footer do card */}
        <div className="border-t border-white/[0.05] bg-[#14141c] px-4 py-3.5">
          <h3 className="mb-0.5 line-clamp-1 text-sm font-bold text-white/90 transition-colors duration-200 group-hover:text-purple-300">
            {title}
          </h3>
          <p className="text-xs font-medium text-white/35">{subtitle}</p>
        </div>
      </div>

      {/* Botão Quick View */}
      {onQuickView && (
        <div className="absolute left-1/2 top-[155px] z-20 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-90">
          <Button
            variant="secondary"
            size="icon"
            className="h-12 w-12 rounded-full border border-white/10 bg-[#0a0a0f]/80 text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-110 hover:bg-purple-600 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView();
            }}
            aria-label="Visualização rápida"
          >
            <Eye className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Badge de categoria */}
      <Badge
        className={cn(
          "pointer-events-none absolute left-3 top-3 z-20 px-2.5 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md rounded-xl",
          badgeClassName,
        )}
      >
        <BadgeIcon className="mr-1.5 h-3 w-3" />
        {badgeLabel}
      </Badge>

      {/* Badge de avaliação do usuário */}
      {userRating && (
        <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-600/90 px-2.5 py-1 text-xs font-bold text-white shadow-[0_4px_12px_rgba(168,85,247,0.35)] backdrop-blur-md">
          <Star
            className={cn("h-3 w-3 fill-current", userRatingIconClassName)}
          />
          {userRating.rating}
        </div>
      )}

      {/* Botão de favorito */}
      {showFavoriteButton && onFavoriteToggle && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute z-20 h-8 w-8 rounded-full transition-all duration-300 hover:scale-110",
            userRating ? "right-3 top-[2.75rem]" : "right-3 top-3",
            isFavorite
              ? "border border-pink-500/50 bg-pink-600/90 text-white shadow-[0_4px_12px_rgba(219,39,119,0.35)] backdrop-blur-sm hover:bg-pink-500"
              : "border border-white/10 bg-[#0a0a0f]/50 text-white/60 backdrop-blur-sm hover:bg-[#0a0a0f]/80 hover:text-white hover:border-white/20",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </Button>
      )}

      {/* Ícone de comentário */}
      {userRating && userRating.comment && !showFavoriteButton && (
        <div className="pointer-events-none absolute bottom-[72px] right-3 z-20 rounded-full border border-emerald-500/30 bg-emerald-600/90 p-1.5 text-white shadow-lg backdrop-blur-md">
          <MessageSquare className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}
