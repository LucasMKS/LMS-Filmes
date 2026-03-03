package com.lucasm.lmsfavorite.controller;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import com.lucasm.lmsfavorite.model.WatchlistSerie;
import com.lucasm.lmsfavorite.service.WatchlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Expõe endpoints de gerenciamento da watchlist (filmes e séries) do usuário autenticado.
 */
@RestController
@RequestMapping("/watchlist")
public class WatchlistController {

    private final WatchlistService watchlistService;

    /**
     * Cria o controller com o serviço de watchlist.
     *
     * @param watchlistService serviço de regras de watchlist.
     */
    public WatchlistController(WatchlistService watchlistService) {
        this.watchlistService = watchlistService;
    }

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /**
     * Lista os filmes presentes na watchlist do usuário autenticado.
     *
     * @return lista de filmes da watchlist.
     */
    @GetMapping("/movies")
    public ResponseEntity<List<WatchlistMovie>> getMovies() {
        return ResponseEntity.ok(watchlistService.getUserWatchlistMovies(getCurrentUserEmail()));
    }

    /**
     * Adiciona ou remove um filme da watchlist do usuário autenticado.
     *
     * @param movieId identificador do filme.
     * @return estado final de presença na watchlist.
     */
    @PostMapping("/movies")
    public ResponseEntity<Map<String, Boolean>> toggleMovie(@RequestParam String movieId) {
        return ResponseEntity.ok(watchlistService.toggleMovieInWatchlist(movieId, getCurrentUserEmail()));
    }

    /**
     * Consulta se um filme está presente na watchlist do usuário autenticado.
     *
     * @param movieId identificador do filme.
     * @return status de presença na watchlist.
     */
    @GetMapping("/movies/status")
    public ResponseEntity<Map<String, Boolean>> getMovieStatus(@RequestParam String movieId) {
        return ResponseEntity.ok(watchlistService.checkMovieStatus(movieId, getCurrentUserEmail()));
    }

    /**
     * Lista as séries presentes na watchlist do usuário autenticado.
     *
     * @return lista de séries da watchlist.
     */
    @GetMapping("/series")
    public ResponseEntity<List<WatchlistSerie>> getSeries() {
        return ResponseEntity.ok(watchlistService.getUserWatchlistSeries(getCurrentUserEmail()));
    }

    /**
     * Adiciona ou remove uma série da watchlist do usuário autenticado.
     *
     * @param serieId identificador da série.
     * @return estado final de presença na watchlist.
     */
    @PostMapping("/series")
    public ResponseEntity<Map<String, Boolean>> toggleSerie(@RequestParam String serieId) {
        return ResponseEntity.ok(watchlistService.toggleSerieInWatchlist(serieId, getCurrentUserEmail()));
    }

    /**
     * Consulta se uma série está presente na watchlist do usuário autenticado.
     *
     * @param serieId identificador da série.
     * @return status de presença na watchlist.
     */
    @GetMapping("/series/status")
    public ResponseEntity<Map<String, Boolean>> getSerieStatus(@RequestParam String serieId) {
        return ResponseEntity.ok(watchlistService.checkSerieStatus(serieId, getCurrentUserEmail()));
    }
}