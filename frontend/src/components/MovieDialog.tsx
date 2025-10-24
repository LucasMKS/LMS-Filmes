import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RatingDialog } from "./RatingDialog";
import { TmdbMovie } from "@/lib/types";
import { Star, Calendar, Clock, DollarSign, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { ratingMoviesApi } from "@/lib/api";

interface MovieDialogProps {
  movie: TmdbMovie;
  movieDetails: TmdbMovie | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MovieDialog({
  movie,
  movieDetails,
  isOpen,
  onClose,
}: MovieDialogProps) {
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [userRating, setUserRating] = useState<any>(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const displayMovie = movieDetails || movie;

  useEffect(() => {
    if (isOpen) {
      loadUserRating();
    }
  }, [isOpen, displayMovie.id]);

  const loadUserRating = async () => {
    setLoadingRating(true);
    try {
      const rating = await ratingMoviesApi.getMovieRating(displayMovie.id);
      console.log("Avaliação carregada loadUserRating:", rating);
      setUserRating(rating);
    } catch (error) {
      console.error("Erro ao carregar avaliação:", error);
      setUserRating(null);
    } finally {
      setLoadingRating(false);
    }
  };

  const imageUrl = displayMovie.poster_path
    ? `https://image.tmdb.org/t/p/w500${displayMovie.poster_path}`
    : "/placeholder-movie.jpg";

  const backdropUrl = displayMovie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${displayMovie.backdrop_path}`
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const handleRateMovie = async (rating: string, comment?: string) => {
    await ratingMoviesApi.rateMovie(
      displayMovie.id,
      rating,
      displayMovie.title || "",
      displayMovie.poster_path || "",
      comment
    );
    // Recarregar a avaliação após enviar
    await loadUserRating();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm !border-slate-700 border-2 text-slate-50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-50 mb-2">
            {displayMovie.title}
          </DialogTitle>
          {displayMovie.original_title !== displayMovie.title && (
            <DialogDescription className="text-slate-400">
              Título original: {displayMovie.original_title}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagem de fundo */}
          {backdropUrl && (
            <div className="relative h-64 rounded-lg overflow-hidden shadow-lg">
              <img
                src={backdropUrl}
                alt={displayMovie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Poster e informações básicas */}
            <div className="md:col-span-1">
              <img
                src={imageUrl}
                alt={displayMovie.title}
                className="w-full rounded-lg shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-movie.jpg";
                }}
              />

              <div className="mt-4 space-y-3">
                {/* Avaliação */}
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current drop-shadow-sm" />
                  <span className="text-slate-50 font-medium">
                    {displayMovie.vote_average?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-slate-400 text-sm">
                    ({displayMovie.vote_count?.toLocaleString() || "0"} votos)
                  </span>
                </div>

                {/* Data de lançamento */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300">
                    {displayMovie.release_date
                      ? new Date(displayMovie.release_date).toLocaleDateString(
                          "pt-BR"
                        )
                      : "N/A"}
                  </span>
                </div>

                {/* Duração */}
                {displayMovie.runtime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-300">
                      {formatRuntime(displayMovie.runtime)}
                    </span>
                  </div>
                )}

                {/* Orçamento */}
                {displayMovie.budget && displayMovie.budget > 0 && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-300">
                      {formatCurrency(displayMovie.budget)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Detalhes principais */}
            <div className="md:col-span-2 space-y-4">
              {/* Sinopse */}
              {displayMovie.overview && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">
                    Sinopse
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {displayMovie.overview}
                  </p>
                </div>
              )}

              <Separator className="bg-slate-700" />

              {/* Gêneros */}
              {displayMovie.genres && displayMovie.genres.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">
                    Gêneros
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {displayMovie.genres.map((genre, index) => (
                      <span
                        key={`${genre.id}-${index}`}
                        className="px-3 py-1 bg-slate-700/80 backdrop-blur-sm text-slate-300 rounded-full text-sm border border-slate-600/30 shadow-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtoras */}
              {displayMovie.production_companies &&
                displayMovie.production_companies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-50 mb-2">
                      Produtoras
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {displayMovie.production_companies.map(
                        (company, index) => (
                          <span
                            key={`${company.id}-${index}`}
                            className="px-3 py-1 bg-slate-700/80 backdrop-blur-sm text-slate-300 rounded-full text-sm border border-slate-600/30 shadow-sm"
                          >
                            {company.name}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Botões de ação */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="default"
                  className="bg-indigo-600/90 hover:bg-indigo-700/90 backdrop-blur-sm shadow-lg transition-all"
                  onClick={() => setIsRatingOpen(true)}
                  disabled={loadingRating}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {loadingRating
                    ? "Carregando..."
                    : userRating
                    ? "Editar Avaliação"
                    : "Avaliar Filme"}
                </Button>
                {displayMovie.homepage ? (
                  <Button
                    variant="outline"
                    className="border-slate-600/60 text-slate-300 hover:bg-slate-700/80 backdrop-blur-sm transition-all"
                    onClick={() => window.open(displayMovie.homepage, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Site Oficial
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-slate-600/60 text-slate-400 hover:bg-slate-700/80 backdrop-blur-sm transition-all opacity-50 cursor-not-allowed"
                    disabled
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Site Indisponível
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Avaliação do usuário */}
        {userRating && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-50 font-semibold">Sua avaliação</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current drop-shadow-sm" />
                  <span className="text-slate-300 font-medium">
                    {userRating.myVote}/10
                  </span>
                </div>
                {userRating.comment && (
                  <p className="text-slate-400 text-sm mt-2 italic">
                    "{userRating.comment}"
                  </p>
                )}
              </div>
              <Button
                onClick={() => setIsRatingOpen(true)}
                variant="outline"
                size="sm"
                className="border-slate-600/60 text-slate-300 hover:bg-slate-800/80 backdrop-blur-sm transition-all"
              >
                Editar
              </Button>
            </div>
          </div>
        )}

        {/* Dialog de Avaliação */}
        <RatingDialog
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          onSubmit={handleRateMovie}
          itemTitle={displayMovie.title || ""}
          itemType="filme"
          itemId={displayMovie.id}
          currentRating={userRating}
        />
      </DialogContent>
    </Dialog>
  );
}
