import {
  ratingMoviesApi,
  favoriteMoviesApi,
  ratingSeriesApi,
  favoriteSeriesApi,
} from "./api";
import { Movie, FavoriteMovie, Serie, FavoriteSerie } from "./types";
import { toast } from "sonner";

class MovieService {
  // Buscar filmes avaliados pelo usuário
  async getUserMovies(): Promise<Movie[]> {
    try {
      return await ratingMoviesApi.getRatedMovies();
    } catch (error: any) {
      throw error;
    }
  }

  // Avaliar um filme
  async rateMovie(
    movieId: string | number,
    rating: string,
    title: string,
    poster_path: string,
    comment?: string
  ): Promise<Movie> {
    try {
      const response = await ratingMoviesApi.rateMovie(
        movieId,
        rating,
        title,
        poster_path,
        comment
      );

      toast.success("Filme avaliado!", {
        description: `Avaliação salva para "${title}"`,
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  // Buscar filmes favoritos
  async getFavoriteMovies(): Promise<FavoriteMovie[]> {
    try {
      return await favoriteMoviesApi.getFavoriteMovies();
    } catch (error: any) {
      throw error;
    }
  }

  // Adicionar/remover filme dos favoritos
  async toggleFavoriteMovie(movieId: string, title?: string): Promise<void> {
    try {
      await favoriteMoviesApi.toggleFavorite(movieId);

      toast.success("Favorito atualizado!", {
        description: title
          ? `"${title}" foi atualizado nos favoritos`
          : "Lista de favoritos atualizada",
      });
    } catch (error: any) {
      throw error;
    }
  }

  // =====================
  // MÉTODOS PARA SÉRIES
  // =====================

  // Buscar séries avaliadas pelo usuário
  async getUserSeries(): Promise<Serie[]> {
    try {
      return await ratingSeriesApi.getRatedSeries();
    } catch (error: any) {
      throw error;
    }
  }

  // Avaliar uma série
  async rateSerie(
    serieId: string | number,
    rating: string,
    title: string,
    poster_path: string,
    comment?: string
  ): Promise<Serie> {
    try {
      const response = await ratingSeriesApi.rateSerie(
        serieId,
        rating,
        title,
        poster_path,
        comment
      );

      toast.success("Série avaliada!", {
        description: `Avaliação salva para "${title}"`,
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  // Buscar séries favoritas
  async getFavoriteSeries(): Promise<FavoriteSerie[]> {
    try {
      return await favoriteSeriesApi.getFavoriteSeries();
    } catch (error: any) {
      throw error;
    }
  }

  // Adicionar/remover série dos favoritos
  async toggleFavoriteSerie(serieId: string, title?: string): Promise<void> {
    try {
      await favoriteSeriesApi.toggleFavorite(serieId);

      toast.success("Favorito atualizado!", {
        description: title
          ? `"${title}" foi atualizado nos favoritos`
          : "Lista de favoritos atualizada",
      });
    } catch (error: any) {
      throw error;
    }
  }
}

export default new MovieService();
