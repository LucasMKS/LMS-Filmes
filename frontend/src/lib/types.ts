// Tipos para autenticação
export interface AuthDTO {
  email: string;
  password: string;
  name?: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  nickname: string;
  role: string;
}

// --------------------
// Tipos de Avaliação (Rating)
// --------------------

export interface Movie {
  id: string;
  title: string;
  movieId: string;
  rating: number;
  comment?: string;
  email: string;
  poster_path: string;
  createdAt: string;
  modifiedAt?: string;
}
export interface Serie {
  id: string;
  title: string;
  serieId: string;
  rating: number;
  comment?: string;
  email: string;
  poster_path: string;
  createdAt: string;
  modifiedAt?: string;
}

// --------------------
// Tipos de Favoritos
// --------------------

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

export interface FavoriteStatusResponse {
  movieId: string;
  isFavorite: boolean;
}

export interface FavoriteSerieStatusResponse {
  serieId: string;
  isFavorite: boolean;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TmdbWatchProviders {
  results: {
    BR?: {
      link: string;
      flatrate?: TmdbProvider[];
      rent?: TmdbProvider[];
      buy?: TmdbProvider[];
    };
  };
}

export interface TmdbCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

// --------------------
// Tipos do TMDB (Externo)
// --------------------

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
  credits?: { cast: TmdbCast[] };
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: TmdbWatchProviders;
  recommendations?: { results: any[] };
  tagline?: string;
}

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
  credits?: { cast: TmdbCast[] };
  videos?: { results: TmdbVideo[] };
  "watch/providers"?: TmdbWatchProviders;
  recommendations?: { results: any[] };
  tagline?: string;
}

// --------------------
// Tipos de UI
// --------------------

export interface FavoriteMovieEnriched extends FavoriteMovie {
  tmdbData?: TmdbMovie;
}

export interface FavoriteSerieEnriched extends FavoriteSerie {
  tmdbData?: TmdbSerie;
}

export interface AppApiResponse<T> {
  data: T;
  message: string;
}

export interface SimpleApiResponse {
  message: string;
}

export interface TmdbPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
  timestamp?: string;
}

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
