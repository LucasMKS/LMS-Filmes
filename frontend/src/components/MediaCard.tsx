"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Heart, MessageSquare, Star, Eye, Bookmark, Info, type LucideIcon } from "lucide-react";

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
  showActionButtons?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  isInWatchlist?: boolean;
  onWatchlistToggle?: () => void;
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
  showActionButtons = false,
  isFavorite = false,
  onFavoriteToggle,
  isInWatchlist = false,
  onWatchlistToggle,
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
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImgSrc(imageUrl);
    setIsLoading(true);
  }, [imageUrl]);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoading(false);
    }
  }, [imgSrc]);

  const hasRating = !!userRating && !!userRating.rating && userRating.rating !== "0";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#14141c] transition-all duration-300",
        "hover:-translate-y-1.5 hover:border-purple-500/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
        "focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:ring-offset-2 focus-within:ring-offset-[#0a0a0f]",
        cardClassName,
      )}
    >
      {/* Glow decorativo no topo ao hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Clique principal (Navegação) - Agora com z-0 para ficar atrás dos botões */}
      <div
        className="absolute inset-0 z-0 cursor-pointer"
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

      <div className="relative z-10 pointer-events-none">
        {/* Imagem */}
        <div className="relative overflow-hidden aspect-[2/3] bg-white/5">
          <Image
            ref={imgRef}
            key={imgSrc}
            src={imgSrc}
            alt={altText}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className={cn(
              "object-cover transition-all duration-700 group-hover:scale-105",
              isLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0"
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImgSrc("/placeholder-movie.jpg");
              setIsLoading(false);
            }}
            priority={false}
          />

          {/* Overlay gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60" />

          {/* Botão Quick View / Info - Mais visível em mobile */}
          {onQuickView && (
            <div className="absolute left-3 bottom-3 z-30 flex sm:hidden pointer-events-auto">
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full border border-white/10 bg-[#0a0a0f]/80 text-white shadow-lg backdrop-blur-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView();
                }}
              >
                <Info className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Botão Quick View Desktop - Center hover */}
          {onQuickView && (
            <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 hidden sm:flex group-hover:opacity-100 group-hover:scale-100 scale-90 pointer-events-auto">
              <Button
                variant="secondary"
                size="icon"
                className="h-14 w-14 rounded-full border border-white/10 bg-[#0a0a0f]/80 text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-110 hover:bg-purple-600 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
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

          {/* Overlay com nota global (visível sempre em mobile, hover em desktop) */}
          <div className="absolute right-3 bottom-3 z-20">
             <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0a0a0f]/70 px-2.5 py-1.5 text-white backdrop-blur-md">
                <OverlayIcon
                  className={cn("h-3.5 w-3.5 fill-current", overlayIconClassName)}
                />
                <span className="text-xs font-bold">
                  {typeof overlayRating === "number"
                    ? overlayRating.toFixed(1)
                    : "N/A"}
                </span>
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

      {/* Badge de categoria */}
      <Badge
        className={cn(
          "pointer-events-none absolute left-3 top-3 z-20 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-white shadow-lg backdrop-blur-md rounded-xl",
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

      {/* Botão de Ação (Wishlist ou Favorito) */}
      {showActionButtons && (
        <div className={cn(
          "absolute z-30 transition-all duration-300 pointer-events-auto",
          userRating ? "right-3 top-[2.75rem]" : "right-3 top-3"
        )}>
          {hasRating ? (
            /* Botão de Favorito (Se já avaliou) */
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full border transition-all duration-300 hover:scale-110",
                isFavorite
                  ? "border-pink-500/50 bg-pink-600/90 text-white shadow-[0_4px_12px_rgba(219,39,119,0.35)] backdrop-blur-sm hover:bg-pink-500"
                  : "border-white/10 bg-[#0a0a0f]/50 text-white/60 backdrop-blur-sm hover:bg-[#0a0a0f]/80 hover:text-white hover:border-white/20",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle?.();
              }}
              aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>
          ) : (
            /* Botão de Wishlist (Se NÃO avaliou) */
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full border transition-all duration-300 hover:scale-110",
                isInWatchlist
                  ? "border-emerald-500/50 bg-emerald-600/90 text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)] backdrop-blur-sm hover:bg-emerald-500"
                  : "border-white/10 bg-[#0a0a0f]/50 text-white/60 backdrop-blur-sm hover:bg-[#0a0a0f]/80 hover:text-white hover:border-white/20",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onWatchlistToggle?.();
              }}
              aria-label={isInWatchlist ? "Remover da Watchlist" : "Adicionar à Watchlist"}
            >
              <Bookmark className={cn("h-4 w-4", isInWatchlist && "fill-current")} />
            </Button>
          )}
        </div>
      )}

      {/* Ícone de comentário */}
      {userRating && userRating.comment && (
        <div className="pointer-events-none absolute bottom-[72px] right-3 z-20 rounded-full border border-emerald-500/30 bg-emerald-600/90 p-1.5 text-white shadow-lg backdrop-blur-md">
          <MessageSquare className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}
