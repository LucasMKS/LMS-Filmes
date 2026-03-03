package com.lucasm.lmsfavorite.controller;

import java.util.List;

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

import java.util.Map;

/**
 * Expõe endpoints de gerenciamento de séries favoritas do usuário autenticado.
 */
@RestController
@RequestMapping("/favorite/series")
public class FavoriteSerieController {

    private final FavoriteSerieService favoriteService;

    /**
     * Cria o controller com o serviço de favoritos de séries.
     *
     * @param favoriteService serviço de regras de favoritos de séries.
     */
    public FavoriteSerieController(FavoriteSerieService favoriteService) {
        this.favoriteService = favoriteService;
    }

    /**
     * Alterna o estado de favorito de uma série para o usuário autenticado.
     *
     * @param serieId identificador da série.
     * @param authentication contexto de autenticação do usuário.
     * @return estado final de favorito para a série informada.
     */
    @PostMapping("")
    public ResponseEntity<FavoriteSerieStatusResponse> toggleFavoriteSerie(
            @RequestParam String serieId,
            Authentication authentication) {

        String email = authentication.getName();
        boolean newStatus = favoriteService.toggleFavoriteSerie(serieId, email);

        return ResponseEntity.ok(new FavoriteSerieStatusResponse(serieId, newStatus));
    }

    /**
     * Consulta se uma série está marcada como favorita pelo usuário autenticado.
     *
     * @param serieId identificador da série.
     * @param authentication contexto de autenticação do usuário.
     * @return indicador booleano de favorito.
     */
    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatusSeries(
            @RequestParam String serieId,
            Authentication authentication) {

        String email = authentication.getName();
        boolean isFavorite = favoriteService.isFavoriteSerie(serieId, email);
        return ResponseEntity.ok(isFavorite);
    }

    /**
     * Consulta, em lote, o status de favoritos de séries do usuário autenticado.
     *
     * @param serieIds lista de identificadores de séries.
     * @param authentication contexto de autenticação do usuário.
     * @return mapa `serieId -> isFavorite`.
     */
    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, Boolean>> getFavoriteStatusSeriesBatch(
            @RequestParam List<String> serieIds,
            Authentication authentication) {

        String email = authentication.getName();
        Map<String, Boolean> statuses = favoriteService.getFavoriteSeriesStatusBatch(serieIds, email);
        return ResponseEntity.ok(statuses);
    }

    /**
     * Lista todas as séries favoritadas do usuário autenticado.
     *
     * @param authentication contexto de autenticação do usuário.
     * @return lista de séries favoritadas com mensagem contextual.
     */
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
