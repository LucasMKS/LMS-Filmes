package com.lucasm.lmsfavorite.dto;
/**
 * DTO de saída com o status de favorito para séries.
 */

public record FavoriteSerieStatusResponse(
    String serieId,
    boolean isFavorite
) {}