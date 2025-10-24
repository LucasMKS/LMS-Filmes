import axios from "axios";
import Cookies from "js-cookie";
import { ErrorHandler } from "./errorHandler";
import { toast } from "sonner";
import {
  Movie,
  Serie,
  TmdbMovie,
  TmdbSerie,
  TmdbPage,
  AuthDTO,
  AuthResponse,
  SimpleApiResponse,
} from "./types";

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const apiLmsFilmes = axios.create({
  baseURL: `${API_GATEWAY_URL}/lms-filmes`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

const apiLmsRating = axios.create({
  baseURL: `${API_GATEWAY_URL}/lms-rating`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

const apiLmsFavorite = axios.create({
  baseURL: `${API_GATEWAY_URL}/lms-favorite`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

const attachAuthInterceptor = (apiInstance: any) => {
  apiInstance.interceptors.request.use(
    (config: any) => {
      const publicEndpoints = ["/auth/login", "/auth/register"];
      const isPublic = publicEndpoints.some((endpoint) =>
        config.url?.includes(endpoint)
      );
      if (!isPublic) {
        const token = Cookies.get("auth_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => Promise.reject(ErrorHandler.createApiError(error))
  );

  apiInstance.interceptors.response.use(
    (res: any) => res,
    (error: any) => {
      const apiError = ErrorHandler.createApiError(error);

      if (error.response?.status === 401) {
        Cookies.remove("auth_token");
        Cookies.remove("user_data");
        toast.error("Sessão expirada", { description: "Faça login novamente" });
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(apiError);
    }
  );
};

apiLmsFavorite.interceptors.request.use((config) => {
  console.log("Axios Favorite Request:", config.baseURL, config.url);
  return config;
});

[apiLmsFilmes, apiLmsRating, apiLmsFavorite].forEach(attachAuthInterceptor);

// --------------------
// LMS-FILMES (Autenticação)
// --------------------
export const authApi = {
  login: (payload: AuthDTO): Promise<AuthResponse> =>
    apiLmsFilmes.post("/auth/login", payload).then((res) => res.data),

  register: (payload: AuthDTO): Promise<AuthResponse> =>
    apiLmsFilmes.post("/auth/register", payload).then((res) => res.data),

  requestPasswordReset: (email: string): Promise<SimpleApiResponse> =>
    apiLmsFilmes
      .post("/auth/forgot-password", { email })
      .then((res) => res.data),

  resetPassword: (
    token: string,
    newPassword: string
  ): Promise<SimpleApiResponse> =>
    apiLmsFilmes
      .post("/auth/reset-password", { token, newPassword })
      .then((res) => res.data),
};

// --------------------
// LMS-FILMES (filmes e séries)
// --------------------
export const moviesApi = {
  getPopularMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    apiLmsFilmes.get(`/movies/popular?page=${page}`).then((res) => res.data),

  getNowPlayingMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    apiLmsFilmes
      .get(`/movies/now-playing?page=${page}`)
      .then((res) => res.data),

  getTopRatedMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    apiLmsFilmes.get(`/movies/top-rated?page=${page}`).then((res) => res.data),

  getUpcomingMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    apiLmsFilmes.get(`/movies/upcoming?page=${page}`).then((res) => res.data),

  searchMovies: (
    query: string,
    page: number = 1
  ): Promise<TmdbPage<TmdbMovie>> =>
    apiLmsFilmes
      .get(`/movies/search?query=${encodeURIComponent(query)}&page=${page}`)
      .then((res) => res.data),

  getMovieDetails: (movieId: string | number): Promise<TmdbMovie> =>
    apiLmsFilmes.get(`/movies/${movieId}`).then((res) => res.data),
};

export const seriesApi = {
  getPopularSeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    apiLmsFilmes.get(`/series/popular?page=${page}`).then((res) => res.data),

  getAiringTodaySeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    apiLmsFilmes
      .get(`/series/airing-today?page=${page}`)
      .then((res) => res.data),

  getOnTheAirSeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    apiLmsFilmes.get(`/series/on-the-air?page=${page}`).then((res) => res.data),

  getTopRatedSeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    apiLmsFilmes.get(`/series/top-rated?page=${page}`).then((res) => res.data),

  searchSeries: (
    query: string,
    page: number = 1
  ): Promise<TmdbPage<TmdbSerie>> =>
    apiLmsFilmes
      .get(`/series/search?query=${encodeURIComponent(query)}&page=${page}`)
      .then((res) => res.data),

  getSerieDetails: (serieId: string | number): Promise<TmdbSerie> =>
    apiLmsFilmes.get(`/series/${serieId}`).then((res) => res.data),
};
// --------------------
// LMS-RATING (avaliações)
// --------------------

// Tipos de Payload para DTOs do backend
interface RateMoviePayload {
  movieId: string;
  rating: number;
  title: string;
  poster_path: string;
  comment?: string;
}

interface RateSeriePayload {
  serieId: string;
  rating: number;
  title: string;
  poster_path: string;
  comment?: string;
}

export const ratingMoviesApi = {
  rateMovie: (payload: RateMoviePayload): Promise<Movie> => {
    return apiLmsRating.post("/rate/movies", payload).then((res) => res.data);
  },

  getRatedMovies: (): Promise<Movie[]> =>
    apiLmsRating.get("/rate/movies/").then((res) => res.data),

  getMovieRating: (movieId: string): Promise<Movie> =>
    apiLmsRating.get(`/rate/movies/${movieId}`).then((res) => res.data),
};

export const ratingSeriesApi = {
  rateSerie: (payload: RateSeriePayload): Promise<Serie> => {
    return apiLmsRating.post("/rate/series", payload).then((res) => res.data);
  },

  getRatedSeries: (): Promise<Serie[]> =>
    apiLmsRating.get("/rate/series/").then((res) => res.data),

  /**
   * REATORADO: Busca a avaliação usando um path parameter (/{serieId}).
   */
  getSerieRating: (serieId: string): Promise<Serie> =>
    apiLmsRating.get(`/rate/series/${serieId}`).then((res) => res.data),
};

// --------------------
// LMS-FAVORITE (favoritos)
// --------------------
export const favoriteMoviesApi = {
  toggleFavorite: (movieId: string) =>
    apiLmsFavorite
      .post("/favorite/movies", null, { params: { movieId } })
      .then((res) => res.data),
  getFavoriteStatus: (movieId: string) =>
    apiLmsFavorite
      .get("/favorite/movies/status", { params: { movieId } })
      .then((res) => res.data),
  getFavoriteMovies: () =>
    apiLmsFavorite.get("/favorite/movies/").then((res) => res.data.data),
};

export const favoriteSeriesApi = {
  toggleFavorite: (serieId: string) =>
    apiLmsFavorite
      .post("/favorite/series", null, { params: { serieId } })
      .then((res) => res.data),
  getFavoriteStatus: (serieId: string) =>
    apiLmsFavorite
      .get("/favorite/series/status", { params: { serieId } })
      .then((res) => res.data),
  getFavoriteSeries: () =>
    apiLmsFavorite.get("/favorite/series/").then((res) => res.data.data),
};

export { apiLmsFilmes, apiLmsRating, apiLmsFavorite };
