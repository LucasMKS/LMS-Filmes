package com.lucasm.lmsfavorite.dto;

public record FavoriteSerieStatusResponse(
    String serieId,
    boolean isFavorite
) {}