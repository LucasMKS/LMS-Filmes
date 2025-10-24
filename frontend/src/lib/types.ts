// Tipos para autenticação
export interface AuthDTO {
  email: string;
  password: string;
  name?: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    nickname: string;
    role: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  nickname: string;
  role: string;
}

// Tipos para filmes
export interface Movie {
  id: string;
  title: string;
  movieId: string;
  myVote: string;
  comment?: string;
  nickname: string;
  poster_path: string;
  created_at: string;
}

// Tipo para dados do TMDB
export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview?: string;
  homepage?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: Array<{
    id: number;
    name: string;
  }>;
  adult?: boolean;
  original_language?: string;
  popularity?: number;
  runtime?: number;
  budget?: number;
  revenue?: number;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
}

// Tipo para dados de séries do TMDB
export interface TmdbSerie {
  id: number;
  name: string;
  original_name: string;
  overview?: string;
  homepage?: string;
  poster_path?: string;
  backdrop_path?: string;
  first_air_date?: string;
  last_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  genres?: Array<{
    id: number;
    name: string;
  }>;
  adult?: boolean;
  original_language?: string;
  popularity?: number;
  number_of_episodes?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  status?: string;
  type?: string;
  networks?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
  }>;
  created_by?: Array<{
    id: number;
    name: string;
    profile_path?: string;
  }>;
  last_episode_to_air?: {
    name: string;
    air_date: string;
    episode_number: number;
    season_number: number;
  };
  next_episode_to_air?: {
    name: string;
    air_date: string;
    episode_number: number;
    season_number: number;
  };
  seasons?: Array<{
    id: number;
    name: string;
    overview: string;
    poster_path?: string;
    season_number: number;
    episode_count: number;
    air_date?: string;
  }>;
}

export interface FavoriteMovie {
  id: string;
  movieId: string;
  title: string;
  nickname: string;
  favorite: boolean;
}

// Tipos para séries
export interface Serie {
  id: string;
  title: string;
  serieId: string;
  myVote: string;
  comment?: string;
  nickname: string;
  poster_path: string;
  created_at: string;
}

export interface FavoriteSerie {
  id: string;
  serieId: string;
  title: string;
  nickname: string;
  favorite: boolean;
}

// Tipos de resposta da API com tratamento de erro melhorado
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp?: string;
}

// Tipos para formulários
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  nickname: string;
  password: string;
  confirmPassword: string;
}

// Tipos para favoritos
export interface FavoriteMovie {
  id: string;
  movieId: string;
  email: string;
  favorite: boolean;
}

export interface FavoriteSerie {
  id: string;
  serieId: string;
  email: string;
  favorite: boolean;
}

// Interface para favoritos enriquecidos com dados do TMDB
export interface FavoriteMovieEnriched extends FavoriteMovie {
  tmdbData?: TmdbMovie;
}

export interface FavoriteSerieEnriched extends FavoriteSerie {
  tmdbData?: TmdbSerie;
}

// Tipos para notificações Toast
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  description?: string;
  type: ToastType;
  duration?: number;
}
