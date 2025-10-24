package com.lucasm.lmsfavorite.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsfavorite.model.FavoriteMovie;
import com.lucasm.lmsfavorite.service.FavoriteMovieService;

@RestController
@RequestMapping("/favorite/movies")
public class FavoriteMovieController {

    private static final Logger logger = LoggerFactory.getLogger(FavoriteMovieController.class);

    @Autowired
    private FavoriteMovieService favoriteService;

    // Método para adicionar/remover um filme dos favoritos.
    @PostMapping("")
    public ResponseEntity<String> toggleFavoriteMovie(@RequestParam String movieId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("CONTROLLER FILME: Recebida requisição para toggle favorito - MovieID: {}, Email: {}", movieId, email);

        favoriteService.toggleFavoriteMovie(movieId, email);
        return ResponseEntity.ok("Favorite status updated");
    }

    // Método para verificar se um filme é favorito.
    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatusMovies(@RequestParam String movieId) {
        // Pega o email do usuário logado
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        boolean isFavorite = favoriteService.isFavoriteMovie(movieId, email);
        return ResponseEntity.ok(isFavorite);
    }

    // Método para obter todos os filmes favoritos de um usuário.
    @GetMapping("/")
    public ResponseEntity<?> getAllFavoritesMovies() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<FavoriteMovie> favorites = favoriteService.getAllFavoritesMovies(email);

        if (favorites.isEmpty()) {
            return ResponseEntity
                    .ok(Map.of("message", "Nenhum filme favoritado encontrado", "data", favorites));
        }

        return ResponseEntity
            .ok(Map.of("message", "Filmes favoritados encontrados", "data", favorites));
    }

}