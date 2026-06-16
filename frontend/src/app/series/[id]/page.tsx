import { Metadata } from "next";
import { apiFetch } from "@/lib/api-fetch";
import { TmdbSerie, Serie as UserRatingSerie } from "@/lib/types";
import { SerieClientDetails } from "./SerieClientDetails";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

async function getSerieData(id: string) {
  try {
    return await apiFetch.get<TmdbSerie>("lms-filmes", `/series/${id}?includeRecommendations=true`);
  } catch (error) {
    console.error("Error fetching serie details:", error);
    return null;
  }
}

async function getUserRating(id: string) {
  try {
    return await apiFetch.get<UserRatingSerie>("lms-rating", `/rate/series/${id}`);
  } catch (error) {
    return null;
  }
}

async function getWatchlistStatus(id: string) {
  try {
    return await apiFetch.get<{ inWatchlist: boolean }>("lms-favorite", `/watchlist/series/status?serieId=${id}`);
  } catch (error) {
    return { inWatchlist: false };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const serie = await getSerieData(id);

  if (!serie) {
    return {
      title: "Série não encontrada | LMS Filmes",
    };
  }

  const firstYear = serie.first_air_date ? new Date(serie.first_air_date).getFullYear() : "";
  const title = `${serie.name} ${firstYear ? `(${firstYear})` : ""} | LMS Filmes`;
  const description = serie.overview || `Veja detalhes, avaliações e onde assistir à série ${serie.name}.`;
  const imageUrl = serie.poster_path 
    ? `https://image.tmdb.org/t/p/w780${serie.poster_path}`
    : "https://filmes.lucasmks.com.br/placeholder-movie.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
      type: "video.tv_show",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SeriePage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const isLoggedIn = !!token;

  const serie = await getSerieData(id);

  if (!serie) {
    notFound();
  }

  let userRating: UserRatingSerie | null = null;
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
    <SerieClientDetails
      serie={serie}
      initialUserRating={userRating}
      initialIsInWatchlist={watchlistStatus.inWatchlist}
      isLoggedIn={isLoggedIn}
    />
  );
}
