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
import com.lucasm.lmsfavorite.dto.FavoriteStatusResponse;
import com.lucasm.lmsfavorite.model.FavoriteMovie;
import com.lucasm.lmsfavorite.service.FavoriteMovieService;

import java.util.Map;

/**
 * Expõe endpoints de gerenciamento de filmes favoritos do usuário autenticado.
 */
@RestController
@RequestMapping("/favorite/movies")
public class FavoriteMovieController {

    private final FavoriteMovieService favoriteService;

    /**
     * Cria o controller com o serviço de favoritos de filmes.
     *
     * @param favoriteService serviço de regras de favoritos de filmes.
     */
    public FavoriteMovieController(FavoriteMovieService favoriteService) {
        this.favoriteService = favoriteService;
    }

    /**
     * Alterna o estado de favorito de um filme para o usuário autenticado.
     *
     * @param movieId identificador do filme.
     * @param authentication contexto de autenticação do usuário.
     * @return estado final de favorito para o filme informado.
     */
    @PostMapping("")
    public ResponseEntity<FavoriteStatusResponse> toggleFavoriteMovie(
            @RequestParam String movieId, 
            Authentication authentication) {
        
        String email = authentication.getName();

        boolean newStatus = favoriteService.toggleFavoriteMovie(movieId, email);
        
        return ResponseEntity.ok(new FavoriteStatusResponse(movieId, newStatus));
    }

    /**
     * Consulta se um filme está marcado como favorito pelo usuário autenticado.
     *
     * @param movieId identificador do filme.
     * @param authentication contexto de autenticação do usuário.
     * @return indicador booleano de favorito.
     */
    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatusMovies(
            @RequestParam String movieId, 
            Authentication authentication) {
        
        String email = authentication.getName();
        boolean isFavorite = favoriteService.isFavoriteMovie(movieId, email);
        return ResponseEntity.ok(isFavorite);
    }

    /**
     * Consulta, em lote, o status de favoritos de filmes do usuário autenticado.
     *
     * @param movieIds lista de identificadores de filmes.
     * @param authentication contexto de autenticação do usuário.
     * @return mapa `movieId -> isFavorite`.
     */
    @GetMapping("/status/batch")
    public ResponseEntity<Map<String, Boolean>> getFavoriteStatusMoviesBatch(
            @RequestParam List<String> movieIds,
            Authentication authentication) {

        String email = authentication.getName();
        Map<String, Boolean> statuses = favoriteService.getFavoriteMoviesStatusBatch(movieIds, email);
        return ResponseEntity.ok(statuses);
    }

    /**
     * Lista todos os filmes favoritados do usuário autenticado.
     *
     * @param authentication contexto de autenticação do usuário.
     * @return lista de filmes favoritados com mensagem contextual.
     */
    @GetMapping("/")
    public ResponseEntity<ApiResponse<List<FavoriteMovie>>> getAllFavoritesMovies(
            Authentication authentication) {
            
        String email = authentication.getName();
        List<FavoriteMovie> favorites = favoriteService.getAllFavoritesMovies(email);

        String message = favorites.isEmpty() 
            ? "Nenhum filme favoritado encontrado" 
            : "Filmes favoritados encontrados";

        return ResponseEntity.ok(new ApiResponse<>(message, favorites));
    }

}