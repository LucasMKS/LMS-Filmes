package com.lucasm.lmsfavorite.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsfavorite.dto.ApiResponse;
import com.lucasm.lmsfavorite.dto.FavoriteSerieStatusResponse;
import com.lucasm.lmsfavorite.model.FavoriteSerie;
import com.lucasm.lmsfavorite.service.FavoriteSerieService;

@RestController
@RequestMapping("/favorite/series")
public class FavoriteSerieController {

    private static final Logger logger = LoggerFactory.getLogger(FavoriteSerieController.class);

    private final FavoriteSerieService favoriteService;

    public FavoriteSerieController(FavoriteSerieService favoriteService) {
        this.favoriteService = favoriteService;
    }

    // Método para adicionar/remover uma série dos favoritos.
    @PostMapping("")
    public ResponseEntity<FavoriteSerieStatusResponse> toggleFavoriteSerie(
            @RequestParam String serieId,
            Authentication authentication) {

        String email = authentication.getName();
        boolean newStatus = favoriteService.toggleFavoriteSerie(serieId, email);

        return ResponseEntity.ok(new FavoriteSerieStatusResponse(serieId, newStatus));
    }

    // Método para verificar se uma série é favorita.
    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatusSeries(
            @RequestParam String serieId,
            Authentication authentication) {

        String email = authentication.getName();
        boolean isFavorite = favoriteService.isFavoriteSerie(serieId, email);
        return ResponseEntity.ok(isFavorite);
    }

    // Método para obter todas as séries favoritas de um usuário.
    @GetMapping("/")
    public ResponseEntity<ApiResponse<List<FavoriteSerie>>> getAllFavoritesSeries(
            Authentication authentication) {

        String email = authentication.getName();
        List<FavoriteSerie> favorites = favoriteService.getAllFavoritesSeries(email);

        String message = favorites.isEmpty()
                ? "Nenhuma série favoritada encontrada"
                : "Séries favoritadas encontradas";

        return ResponseEntity.ok(new ApiResponse<>(message, favorites));
    }

}
