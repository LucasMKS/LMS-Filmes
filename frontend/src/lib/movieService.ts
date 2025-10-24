import {
  ratingMoviesApi,
  favoriteMoviesApi,
  ratingSeriesApi,
  favoriteSeriesApi,
} from "../lib/api";
import {
  Movie,
  FavoriteMovie,
  Serie,
  FavoriteSerie,
  FavoriteStatusResponse,
  FavoriteSerieStatusResponse,
} from "../lib/types";
import { toast } from "sonner";

class MovieService {
  async getUserMovies(): Promise<Movie[]> {
    try {
      return await ratingMoviesApi.getRatedMovies();
    } catch (error: any) {
      throw error;
    }
  }

  async rateMovie(
    movieId: string | number,
    rating: number,
    title: string,
    poster_path: string,
    comment?: string
  ): Promise<Movie> {
    try {
      const payload = {
        movieId: String(movieId),
        rating,
        title,
        poster_path,
        comment,
      };
      const response = await ratingMoviesApi.rateMovie(payload);

      toast.success("Filme avaliado!", {
        description: `Avaliação salva para "${title}"`,
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async getFavoriteMovies(): Promise<FavoriteMovie[]> {
    try {
      return await favoriteMoviesApi.getFavoriteMovies();
    } catch (error: any) {
      throw error;
    }
  }

  async toggleFavoriteMovie(
    movieId: string,
    title?: string
  ): Promise<FavoriteStatusResponse> {
    try {
      const response = await favoriteMoviesApi.toggleFavorite(movieId);

      const action = response.isFavorite ? "adicionado aos" : "removido dos";
      toast.success("Favorito atualizado!", {
        description: title
          ? `"${title}" foi ${action} favoritos.`
          : "Lista de favoritos atualizada.",
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  // =====================
  // MÉTODOS PARA SÉRIES
  // =====================

  async getUserSeries(): Promise<Serie[]> {
    try {
      return await ratingSeriesApi.getRatedSeries();
    } catch (error: any) {
      throw error;
    }
  }

  async rateSerie(
    serieId: string | number,
    rating: number,
    title: string,
    poster_path: string,
    comment?: string
  ): Promise<Serie> {
    try {
      const payload = {
        serieId: String(serieId),
        rating,
        title,
        poster_path,
        comment,
      };

      console.log(
        "Enviando payload para /rate/series:",
        JSON.stringify(payload, null, 2)
      );

      const response = await ratingSeriesApi.rateSerie(payload);

      toast.success("Série avaliada!", {
        description: `Avaliação salva para "${title}"`,
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  async getFavoriteSeries(): Promise<FavoriteSerie[]> {
    try {
      return await favoriteSeriesApi.getFavoriteSeries();
    } catch (error: any) {
      throw error;
    }
  }

  async toggleFavoriteSerie(
    serieId: string,
    title?: string
  ): Promise<FavoriteSerieStatusResponse> {
    try {
      const response = await favoriteSeriesApi.toggleFavorite(serieId);

      const action = response.isFavorite ? "adicionada aos" : "removida dos";
      toast.success("Favorito atualizado!", {
        description: title
          ? `"${title}" foi ${action} favoritos.`
          : "Lista de favoritos atualizada.",
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }
}

export default new MovieService();
