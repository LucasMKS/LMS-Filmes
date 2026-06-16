"use client"
// Wait, I should not use "use client" for actions.ts if I want them to be server actions.
// But wait, the prompt said "use functions more modern". Server Actions are marked with "use server".

"use server"

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api-fetch";

export async function toggleFavoriteAction(movieId: string, type: "movie" | "serie") {
  const service = "lms-favorite";
  const endpoint = `/favorite/${type === "movie" ? "movies" : "series"}`;
  
  try {
    const result = await apiFetch.post<{ isFavorite: boolean }>(
      service, 
      `${endpoint}?${type === "movie" ? "movieId" : "serieId"}=${movieId}`
    );
    
    revalidatePath("/favoritos");
    revalidatePath(`/${type === "movie" ? "filmes" : "series"}`);
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleWatchlistAction(movieId: string, type: "movie" | "serie") {
  const service = "lms-favorite";
  const endpoint = `/watchlist/${type === "movie" ? "movies" : "series"}`;
  
  try {
    const result = await apiFetch.post<{ inWatchlist: boolean }>(
      service, 
      `${endpoint}?${type === "movie" ? "movieId" : "serieId"}=${movieId}`
    );
    
    revalidatePath("/watchlist");
    revalidatePath(`/${type === "movie" ? "filmes" : "series"}`);
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rateMediaAction(
  mediaId: string, 
  type: "movie" | "serie", 
  payload: { rating: number; title: string; poster_path: string; comment?: string }
) {
  const service = "lms-rating";
  const endpoint = `/rate/${type === "movie" ? "movies" : "series"}`;
  
  const body = {
    [type === "movie" ? "movieId" : "serieId"]: mediaId,
    ...payload
  };

  try {
    const result = await apiFetch.post(service, endpoint, body);
    
    revalidatePath("/avaliacoes");
    revalidatePath(`/${type === "movie" ? "filmes" : "series"}`);
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
