import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RatingDialog } from "./RatingDialog";
import { TmdbSerie, Serie } from "@/lib/types";
import {
  Star,
  Calendar,
  Tv,
  Users,
  Play,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ratingSeriesApi } from "@/lib/api";
import MovieService from "@/lib/movieService";

interface SerieDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serie: TmdbSerie | null;
  serieDetails?: TmdbSerie | null;
}

export function SerieDialog({
  isOpen,
  onClose,
  serie,
  serieDetails,
}: SerieDialogProps) {
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [userRating, setUserRating] = useState<Serie | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);

  if (!serie) return null;

  const serieData = serieDetails ?? serie;

  useEffect(() => {
    if (isOpen && serieData) {
      loadUserRating(String(serieData.id));
    } else {
      setUserRating(null);
    }
  }, [isOpen, serieData?.id]);

  const loadUserRating = async (serieId: string) => {
    if (loadingRating) return;

    setLoadingRating(true);
    setUserRating(null);
    try {
      const rating = await ratingSeriesApi.getSerieRating(serieId);
      console.log("Avaliação carregada loadUserRating:", rating);
      setUserRating(rating);
    } catch (error: any) {
      if (error?.status !== 404) {
        console.error("Erro ao carregar avaliação:", error);
      }
      setUserRating(null);
    } finally {
      setLoadingRating(false);
    }
  };

  const imageUrl = serieData.poster_path
    ? `https://image.tmdb.org/t/p/w500${serieData.poster_path}`
    : "/placeholder-movie.jpg";

  const backdropUrl = serieData.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${serieData.backdrop_path}`
    : null;

  const getYearRange = () => {
    const firstYear = serieData.first_air_date
      ? new Date(serieData.first_air_date).getFullYear()
      : null;
    const lastYear = serieData.last_air_date
      ? new Date(serieData.last_air_date).getFullYear()
      : null;

    if (!firstYear) return "N/A";
    if (!lastYear || firstYear === lastYear) return firstYear.toString();
    return `${firstYear}-${lastYear}`;
  };

  const getTotalEpisodes = () => {
    if (!serieData.seasons) return null;
    return serieData.seasons.reduce(
      (total, season) => total + (season.episode_count || 0),
      0
    );
  };

  const handleRateSerie = async (ratingString: string, comment?: string) => {
    if (!serieData) {
      // toast.error("Erro", { description: "Dados da série não encontrados." });
      return;
    }

    try {
      const ratingValue = parseFloat(ratingString);

      const updatedRating = await MovieService.rateSerie(
        serieData.id,
        ratingValue,
        serieData.name || "Série Desconhecida",
        serieData.poster_path || "",
        comment
      );

      setUserRating(updatedRating);
    } catch (error) {
      console.error("Erro capturado no Dialog ao submeter avaliação:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/60 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-50 text-2xl font-bold mb-2">
            {serieData.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagem de fundo */}
          {backdropUrl && (
            <div className="relative h-64 rounded-lg overflow-hidden shadow-lg">
              <img
                src={backdropUrl}
                alt={serieData.name}
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
                alt={serieData.name}
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
                    {serieData.vote_average?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-slate-400 text-sm">
                    ({serieData.vote_count || 0} votos)
                  </span>
                </div>

                <div className="flex gap-4">
                  {/* Datas */}
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-300">{getYearRange()}</span>
                  </div>
                  {/* Status */}
                  {serieData.status && (
                    <Badge
                      variant={
                        serieData.status === "Ended"
                          ? "destructive"
                          : "secondary"
                      }
                      className="w-fit backdrop-blur-sm shadow-sm"
                    >
                      {serieData.status === "Ended"
                        ? "Finalizada"
                        : serieData.status === "Returning Series"
                        ? "Em Andamento"
                        : serieData.status}
                    </Badge>
                  )}
                </div>
                {/* Temporadas e episódios */}
                <div className="space-y-2">
                  {serieData.number_of_seasons && (
                    <div className="flex items-center space-x-2">
                      <Tv className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">
                        {serieData.number_of_seasons} temporada
                        {serieData.number_of_seasons > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {getTotalEpisodes() && (
                    <div className="flex items-center space-x-2">
                      <Play className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">
                        {getTotalEpisodes()} episódios
                      </span>
                    </div>
                  )}
                </div>

                {/* Data do último episódio */}
                {serieData.last_air_date && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-300 text-sm">
                      Último episódio:{" "}
                      {new Date(serieData.last_air_date).toLocaleDateString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                )}

                {/* Próximo episódio */}
                {serieData.next_episode_to_air && (
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex items-center space-x-2 mb-2">
                      <ArrowRight className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium text-sm">
                        Próximo Episódio
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-200 font-medium text-sm">
                        {serieData.next_episode_to_air.name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        T{serieData.next_episode_to_air.season_number}E
                        {serieData.next_episode_to_air.episode_number}
                      </p>
                      {serieData.next_episode_to_air.air_date && (
                        <p className="text-slate-400 text-xs">
                          {new Date(
                            serieData.next_episode_to_air.air_date
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detalhes principais */}
            <div className="md:col-span-2 space-y-4">
              {/* Sinopse */}
              {serieData.overview && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">
                    Sinopse
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {serieData.overview}
                  </p>
                </div>
              )}

              <Separator className="bg-slate-700" />

              {/* Gêneros */}
              {serieData.genres && serieData.genres.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">
                    Gêneros
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {serieData.genres.map((genre, index) => (
                      <Badge
                        key={`genre-${genre.id || index}`}
                        variant="outline"
                        className="border-slate-600/60 text-slate-300 bg-slate-700/80 backdrop-blur-sm hover:bg-slate-700/60 transition-all"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Criadores */}
              {serieData.created_by && serieData.created_by.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">
                    Criadores
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {serieData.created_by.map((creator, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{creator.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Redes/Canais */}
              {serieData.networks && serieData.networks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">
                    Exibida em
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {serieData.networks.map((network, index) => (
                      <Badge
                        key={`network-${network.id || index}`}
                        variant="secondary"
                        className="bg-slate-700/80 text-slate-200 backdrop-blur-sm border border-slate-600/30 shadow-sm transition-all"
                      >
                        {network.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Temporadas */}
              {serieData.seasons && serieData.seasons.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-50 mb-2">
                    Temporadas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {serieData.seasons.map((season, index) => (
                      <div
                        key={`season-${season.id || index}`}
                        className="bg-slate-800 p-3 rounded-lg border border-slate-700"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-slate-50 font-medium">
                              {season.name}
                            </h4>
                            {season.air_date && (
                              <p className="text-slate-400 text-sm">
                                {new Date(season.air_date).getFullYear()}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="border-slate-600/60 text-slate-300 bg-slate-700/80 backdrop-blur-sm hover:bg-slate-700/60 transition-all"
                          >
                            {season.episode_count} ep
                            {season.episode_count !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        {season.overview && (
                          <p className="text-slate-300 text-sm mt-2 line-clamp-2">
                            {season.overview}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex space-x-3 pt-4">
                <Button
                  className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg transition-all"
                  onClick={() => setIsRatingOpen(true)}
                  disabled={loadingRating}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {loadingRating
                    ? "Carregando..."
                    : userRating
                    ? "Editar Avaliação"
                    : "Avaliar Série"}
                </Button>
                {serieData.homepage ? (
                  <Button
                    variant="outline"
                    className="border-slate-600/60 text-slate-300 hover:bg-slate-800/80 backdrop-blur-sm transition-all"
                    onClick={() => window.open(serieData.homepage, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Site Oficial
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-slate-600/60 text-slate-400 hover:bg-slate-800/80 backdrop-blur-sm transition-all opacity-50 cursor-not-allowed"
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
                    {userRating.rating}/10
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
          onSubmit={handleRateSerie}
          itemTitle={serieData.name || ""}
          itemType="série"
          itemId={serieData.id}
          currentRating={
            userRating
              ? {
                  myVote: String(userRating.rating), // Converte rating (number) para string
                  comment: userRating.comment,
                }
              : null
          }
        />
      </DialogContent>
    </Dialog>
  );
}
