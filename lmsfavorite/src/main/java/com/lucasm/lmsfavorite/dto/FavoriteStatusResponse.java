package com.lucasm.lmsfavorite.dto;

public record FavoriteStatusResponse(
    String movieId,
    boolean isFavorite
) {}