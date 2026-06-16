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
  WatchlistMovie,
  WatchlistSerie,
  RatedMovieResponse,
  RatedSerieResponse,
  TmdbSeason,
  RatingEpisode,
  WatchedEpisode,
} from "./types";

export interface PagedResponse<T> {
  content: T[];
  last: boolean;
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  empty: boolean;
}

const resolveApiGatewayUrl = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.startsWith("filmes")
      ? hostname.replace("filmes", "api-filmes")
      : hostname;

    return `${protocol}//${apiHostname}`;
  }

  return "https://api-filmes.lucasmks.com.br";
};

const API_GATEWAY_URL = resolveApiGatewayUrl();

async function fetcher<T>(
  service: "lms-filmes" | "lms-rating" | "lms-favorite",
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = Cookies.get("auth_token");
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_GATEWAY_URL}/${service}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        Cookies.remove("auth_token", { domain: ".lucasmks.com.br", path: "/" });
        Cookies.remove("user_data", { domain: ".lucasmks.com.br", path: "/" });

        if (typeof window !== "undefined") {
          window.localStorage.removeItem("session_active");
          
          toast.error("Sessão expirada", {
            description: "Por favor, faça login novamente.",
          });

          if (window.location.pathname !== "/filmes") {
            window.location.href = "/filmes";
          }
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw ErrorHandler.createApiError({ response: { status: response.status, data: errorData } });
    }

    return response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Requisição cancelada por timeout");
    }
    throw error;
  }
}

const buildBatchQuery = (paramName: string, ids: string[]): string => {
  const params = new URLSearchParams();
  ids.forEach((id) => params.append(paramName, id));
  return params.toString();
};

export const authApi = {
  login: (payload: AuthDTO): Promise<AuthResponse> =>
    fetcher("lms-filmes", "/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  register: (payload: AuthDTO): Promise<AuthResponse> =>
    fetcher("lms-filmes", "/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  requestPasswordReset: (email: string): Promise<SimpleApiResponse> =>
    fetcher("lms-filmes", "/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  resetPassword: (
    token: string,
    newPassword: string,
  ): Promise<SimpleApiResponse> =>
    fetcher("lms-filmes", "/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) }),
};

export const moviesApi = {
  getPopularMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    fetcher("lms-filmes", `/movies/popular?page=${page}`),

  getNowPlayingMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    fetcher("lms-filmes", `/movies/now-playing?page=${page}`),

  getTopRatedMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    fetcher("lms-filmes", `/movies/top-rated?page=${page}`),

  getUpcomingMovies: (page: number = 1): Promise<TmdbPage<TmdbMovie>> =>
    fetcher("lms-filmes", `/movies/upcoming?page=${page}`),

  searchMovies: (
    query: string,
    page: number = 1,
  ): Promise<TmdbPage<TmdbMovie>> =>
    fetcher("lms-filmes", `/movies/search?query=${encodeURIComponent(query)}&page=${page}`),

  getMovieDetails: (movieId: string | number, includeRecommendations = false): Promise<TmdbMovie> =>
    fetcher("lms-filmes", `/movies/${movieId}${includeRecommendations ? "?includeRecommendations=true" : ""}`),

  getMoviesBatch: (ids: string[]): Promise<Record<string, TmdbMovie>> => {
    if (ids.length === 0) return Promise.resolve({});
    const query = buildBatchQuery("ids", ids);
    return fetcher("lms-filmes", `/movies/batch?${query}`);
  },
};

export const seriesApi = {
  getPopularSeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    fetcher("lms-filmes", `/series/popular?page=${page}`),

  getAiringTodaySeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    fetcher("lms-filmes", `/series/airing-today?page=${page}`),

  getOnTheAirSeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    fetcher("lms-filmes", `/series/on-the-air?page=${page}`),

  getTopRatedSeries: (page: number = 1): Promise<TmdbPage<TmdbSerie>> =>
    fetcher("lms-filmes", `/series/top-rated?page=${page}`),

  searchSeries: (
    query: string,
    page: number = 1,
  ): Promise<TmdbPage<TmdbSerie>> =>
    fetcher("lms-filmes", `/series/search?query=${encodeURIComponent(query)}&page=${page}`),

  getSerieDetails: (serieId: string | number, includeRecommendations = false): Promise<TmdbSerie> =>
    fetcher("lms-filmes", `/series/${serieId}${includeRecommendations ? "?includeRecommendations=true" : ""}`),

  getSeriesBatch: (ids: string[]): Promise<Record<string, TmdbSerie>> => {
    if (ids.length === 0) return Promise.resolve({});
    const query = buildBatchQuery("ids", ids);
    return fetcher("lms-filmes", `/series/batch?${query}`);
  },

  getSeasonDetails: (serieId: string | number, seasonNumber: number): Promise<TmdbSeason> =>
    fetcher("lms-filmes", `/series/${serieId}/season/${seasonNumber}`),
};

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

export type RatingStatus = { rating: string; comment?: string };

export const ratingMoviesApi = {
  rateMovie: (payload: RateMoviePayload): Promise<Movie> => {
    return fetcher("lms-rating", "/rate/movies", { method: "POST", body: JSON.stringify(payload) });
  },

  getRatingStatuses: (movieIds: string[]): Promise<Record<string, RatingStatus>> => {
    if (movieIds.length === 0) return Promise.resolve({});
    const query = buildBatchQuery("movieIds", movieIds);
    return fetcher("lms-rating", `/rate/movies/status/batch?${query}`);
  },

  getRatedMovies: (): Promise<Movie[]> =>
    fetcher("lms-rating", "/rate/movies/"),

  getRatedMoviesPaged: (
    page: number = 0,
    size: number = 20,
    minRating?: number,
    maxRating?: number,
    title?: string,
  ): Promise<PagedResponse<RatedMovieResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (minRating !== undefined) params.append("minRating", minRating.toString());
    if (maxRating !== undefined) params.append("maxRating", maxRating.toString());
    if (title?.trim()) params.append("title", title.trim());

    return fetcher("lms-rating", `/rate/movies/paged?${params.toString()}`);
  },

  getMovieRating: (movieId: string): Promise<Movie> =>
    fetcher("lms-rating", `/rate/movies/${movieId}`),
};

export const ratingSeriesApi = {
  rateSerie: (payload: RateSeriePayload): Promise<Serie> => {
    return fetcher("lms-rating", "/rate/series", { method: "POST", body: JSON.stringify(payload) });
  },

  getRatingStatuses: (serieIds: string[]): Promise<Record<string, RatingStatus>> => {
    if (serieIds.length === 0) return Promise.resolve({});
    const query = buildBatchQuery("serieIds", serieIds);
    return fetcher("lms-rating", `/rate/series/status/batch?${query}`);
  },

  getRatedSeries: (): Promise<Serie[]> =>
    fetcher("lms-rating", "/rate/series/"),

  getRatedSeriesPaged: (
    page: number = 0,
    size: number = 20,
    minRating?: number,
    maxRating?: number,
    title?: string,
  ): Promise<PagedResponse<RatedSerieResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (minRating !== undefined) params.append("minRating", minRating.toString());
    if (maxRating !== undefined) params.append("maxRating", maxRating.toString());
    if (title?.trim()) params.append("title", title.trim());

    return fetcher("lms-rating", `/rate/series/paged?${params.toString()}`);
  },

  getSerieRating: (serieId: string): Promise<Serie> =>
    fetcher("lms-rating", `/rate/series/${serieId}`),

  rateEpisode: (payload: { serieId: string; seasonNumber: number; episodeNumber: number; rating: number; comment?: string }): Promise<RatingEpisode> =>
    fetcher("lms-rating", "/rate/episodes", { method: "POST", body: JSON.stringify(payload) }),

  getRatedEpisodes: (serieId: string): Promise<RatingEpisode[]> =>
    fetcher("lms-rating", `/rate/episodes/serie/${serieId}`),
};

export const favoriteMoviesApi = {
  toggleFavorite: (movieId: string): Promise<{ isFavorite: boolean }> =>
    fetcher("lms-favorite", `/favorite/movies?movieId=${movieId}`, { method: "POST" }),
  getFavoriteStatus: (movieId: string): Promise<boolean> =>
    fetcher("lms-favorite", `/favorite/movies/status?movieId=${movieId}`),
  getFavoriteStatuses: (
    movieIds: string[],
  ): Promise<Record<string, boolean>> => {
    if (movieIds.length === 0) {
      return Promise.resolve({});
    }

    const query = buildBatchQuery("movieIds", movieIds);
    return fetcher("lms-favorite", `/favorite/movies/status/batch?${query}`);
  },
  getFavoriteMovies: () =>
    fetcher("lms-favorite", "/favorite/movies/").then((res: any) => res.data),
};

export const favoriteSeriesApi = {
  toggleFavorite: (serieId: string): Promise<{ isFavorite: boolean }> =>
    fetcher("lms-favorite", `/favorite/series?serieId=${serieId}`, { method: "POST" }),
  getFavoriteStatus: (serieId: string): Promise<boolean> =>
    fetcher("lms-favorite", `/favorite/series/status?serieId=${serieId}`),
  getFavoriteStatuses: (
    serieIds: string[],
  ): Promise<Record<string, boolean>> => {
    if (serieIds.length === 0) {
      return Promise.resolve({});
    }

    const query = buildBatchQuery("serieIds", serieIds);
    return fetcher("lms-favorite", `/favorite/series/status/batch?${query}`);
  },
  getFavoriteSeries: () =>
    fetcher("lms-favorite", "/favorite/series/").then((res: any) => res.data),

  markAsWatched: (payload: { serieId: string; seasonNumber: number; episodeNumber: number }): Promise<WatchedEpisode> =>
    fetcher("lms-favorite", "/watched/episodes", { method: "POST", body: JSON.stringify(payload) }),

  unmarkAsWatched: (payload: { serieId: string; seasonNumber: number; episodeNumber: number }): Promise<void> =>
    fetcher("lms-favorite", "/watched/episodes", { method: "DELETE", body: JSON.stringify(payload) }),

  getWatchedEpisodes: (serieId: string): Promise<WatchedEpisode[]> =>
    fetcher("lms-favorite", `/watched/episodes/serie/${serieId}`),
};

export const watchlistMoviesApi = {
  toggleWatchlist: (movieId: string): Promise<{ inWatchlist: boolean }> =>
    fetcher("lms-favorite", `/watchlist/movies?movieId=${movieId}`, { method: "POST" }),
  getWatchlistStatus: (movieId: string): Promise<{ inWatchlist: boolean }> =>
    fetcher("lms-favorite", `/watchlist/movies/status?movieId=${movieId}`),
  getWatchlistStatuses: (movieIds: string[]): Promise<Record<string, boolean>> => {
    if (movieIds.length === 0) return Promise.resolve({});
    const query = buildBatchQuery("movieIds", movieIds);
    return fetcher("lms-favorite", `/watchlist/movies/status/batch?${query}`);
  },
  getWatchlistMovies: (): Promise<WatchlistMovie[]> =>
    fetcher("lms-favorite", "/watchlist/movies"),
};

export const watchlistSeriesApi = {
  toggleWatchlist: (serieId: string): Promise<{ inWatchlist: boolean }> =>
    fetcher("lms-favorite", `/watchlist/series?serieId=${serieId}`, { method: "POST" }),
  getWatchlistStatus: (serieId: string): Promise<{ inWatchlist: boolean }> =>
    fetcher("lms-favorite", `/watchlist/series/status?serieId=${serieId}`),
  getWatchlistStatuses: (serieIds: string[]): Promise<Record<string, boolean>> => {
    if (serieIds.length === 0) return Promise.resolve({});
    const query = buildBatchQuery("serieIds", serieIds);
    return fetcher("lms-favorite", `/watchlist/series/status/batch?${query}`);
  },
  getWatchlistSeries: (): Promise<WatchlistSerie[]> =>
    fetcher("lms-favorite", "/watchlist/series"),
};
