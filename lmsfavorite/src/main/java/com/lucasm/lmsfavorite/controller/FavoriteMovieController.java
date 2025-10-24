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
import com.lucasm.lmsfavorite.dto.FavoriteStatusResponse;
import com.lucasm.lmsfavorite.model.FavoriteMovie;
import com.lucasm.lmsfavorite.service.FavoriteMovieService;

@RestController
@RequestMapping("/favorite/movies")
public class FavoriteMovieController {

    private static final Logger logger = LoggerFactory.getLogger(FavoriteMovieController.class);

    private final FavoriteMovieService favoriteService;

    public FavoriteMovieController(FavoriteMovieService favoriteService) {
        this.favoriteService = favoriteService;
    }

    // Método para adicionar/remover um filme dos favoritos.
    @PostMapping("")
    public ResponseEntity<FavoriteStatusResponse> toggleFavoriteMovie(
            @RequestParam String movieId, 
            Authentication authentication) {
        
        String email = authentication.getName();

        boolean newStatus = favoriteService.toggleFavoriteMovie(movieId, email);
        
        return ResponseEntity.ok(new FavoriteStatusResponse(movieId, newStatus));
    }

    // Método para verificar se um filme é favorito.
    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatusMovies(
            @RequestParam String movieId, 
            Authentication authentication) {
        
        String email = authentication.getName();
        boolean isFavorite = favoriteService.isFavoriteMovie(movieId, email);
        return ResponseEntity.ok(isFavorite);
    }

    // Método para obter todos os filmes favoritos de um usuário.
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