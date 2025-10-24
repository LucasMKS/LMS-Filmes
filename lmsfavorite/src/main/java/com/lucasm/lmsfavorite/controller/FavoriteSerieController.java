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

import com.lucasm.lmsfavorite.model.FavoriteSerie;
import com.lucasm.lmsfavorite.service.FavoriteSerieService;

@RestController
@RequestMapping("/favorite/series")
public class FavoriteSerieController {

    private static final Logger logger = LoggerFactory.getLogger(FavoriteSerieController.class);

    @Autowired
    private FavoriteSerieService favoriteService;

    // Método para adicionar/remover uma série dos favoritos.
    @PostMapping("/")
    public ResponseEntity<String> toggleFavoriteSerie(@RequestParam String serieId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("CONTROLLER SÉRIE: Recebida requisição para toggle favorito - SerieID: {}, Email: {}", serieId, email);

        favoriteService.toggleFavoriteSerie(serieId, email);
        return ResponseEntity.ok("Favorite status updated");
    }

    // Método para verificar se uma série é favorita.
    @GetMapping("/status")
    public ResponseEntity<Boolean> getFavoriteStatusSeries(@RequestParam String serieId) {
        // Pega o email do usuário logado
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        boolean isFavorite = favoriteService.isFavoriteSerie(serieId, email);
        return ResponseEntity.ok(isFavorite);
    }

    // Método para obter todas as séries favoritas de um usuário.
    @GetMapping("/")
    public ResponseEntity<?> getAllFavoritesSeries() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<FavoriteSerie> favorites = favoriteService.getAllFavoritesSeries(email);

    if (favorites.isEmpty()) {
            return ResponseEntity
                    .ok(Map.of("message", "Nenhum filme favoritado encontrado", "data", favorites));
        }
        
        return ResponseEntity
            .ok(Map.of("message", "Filmes favoritados encontrados", "data", favorites));
    }

    
}
