package com.lucasm.lmsfavorite.dto;
/**
 * DTO de saída com o status de favorito para filmes.
 */

public record FavoriteStatusResponse(
    String movieId,
    boolean isFavorite
) {}