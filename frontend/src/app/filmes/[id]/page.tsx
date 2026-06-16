import { Metadata } from "next";
import { apiFetch } from "@/lib/api-fetch";
import { TmdbMovie, Movie as UserRatingMovie } from "@/lib/types";
import { MovieClientDetails } from "./MovieClientDetails";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

async function getMovieData(id: string) {
  try {
    return await apiFetch.get<TmdbMovie>("lms-filmes", `/movies/${id}?includeRecommendations=true`);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
}

async function getUserRating(id: string) {
  try {
    return await apiFetch.get<UserRatingMovie>("lms-rating", `/rate/movies/${id}`);
  } catch (error) {
    // 404 is expected if not rated
    return null;
  }
}

async function getWatchlistStatus(id: string) {
  try {
    return await apiFetch.get<{ inWatchlist: boolean }>("lms-favorite", `/watchlist/movies/status?movieId=${id}`);
  } catch (error) {
    return { inWatchlist: false };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieData(id);

  if (!movie) {
    return {
      title: "Filme não encontrado | LMS Filmes",
    };
  }

  const title = `${movie.title} (${new Date(movie.release_date || "").getFullYear()}) | LMS Filmes`;
  const description = movie.overview || `Veja detalhes, avaliações e onde assistir ao filme ${movie.title}.`;
  const imageUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : "https://filmes.lucasmks.com.br/placeholder-movie.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      type: "video.movie",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function MoviePage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const isLoggedIn = !!token;

  const movie = await getMovieData(id);

  if (!movie) {
    notFound();
  }

  // Paralelizar buscas de status do usuário se logado
  let userRating: UserRatingMovie | null = null;
  let watchlistStatus = { inWatchlist: false };

  if (isLoggedIn) {
    const [rating, watchlist] = await Promise.all([
      getUserRating(id),
      getWatchlistStatus(id),
    ]);
    userRating = rating;
    watchlistStatus = watchlist;
  }

  return (
    <MovieClientDetails
      movie={movie}
      initialUserRating={userRating}
      initialIsInWatchlist={watchlistStatus.inWatchlist}
      isLoggedIn={isLoggedIn}
    />
  );
}
