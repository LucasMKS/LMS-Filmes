package com.lucasm.lmsfavorite.controller;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import com.lucasm.lmsfavorite.model.WatchlistSerie;
import com.lucasm.lmsfavorite.model.WatchlistStatus;
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
     * @param status status inicial opcional.
     * @return estado final de presença na watchlist.
     */
    @PostMapping("/movies")
    public ResponseEntity<Map<String, Object>> toggleMovie(
            @RequestParam String movieId,
            @RequestParam(required = false) WatchlistStatus status) {
        return ResponseEntity.ok(watchlistService.toggleMovieInWatchlist(movieId, getCurrentUserEmail(), status));
    }

    /**
     * Atualiza o status de um filme na watchlist do usuário autenticado.
     *
     * @param movieId identificador do filme.
     * @param status novo status.
     * @return estado final na watchlist.
     */
    @PatchMapping("/movies/status")
    public ResponseEntity<Map<String, Object>> updateMovieStatus(
            @RequestParam String movieId,
            @RequestParam WatchlistStatus status) {
        return ResponseEntity.ok(watchlistService.updateMovieStatus(movieId, getCurrentUserEmail(), status));
    }

    /**
     * Consulta se um filme está presente na watchlist do usuário autenticado.
     *
     * @param movieId identificador do filme.
     * @return status de presença na watchlist.
     */
    @GetMapping("/movies/status")
    public ResponseEntity<Map<String, Object>> getMovieStatus(@RequestParam String movieId) {
        return ResponseEntity.ok(watchlistService.checkMovieStatus(movieId, getCurrentUserEmail()));
    }

    /**
     * Consulta, em lote, o status de watchlist de filmes do usuário autenticado.
     *
     * @param movieIds lista de identificadores de filmes.
     * @return mapa `movieId -> statusInfo`.
     */
    @GetMapping("/movies/status/batch")
    public ResponseEntity<Map<String, Object>> getMovieStatusBatch(@RequestParam List<String> movieIds) {
        return ResponseEntity.ok(watchlistService.getMovieWatchlistStatusBatch(movieIds, getCurrentUserEmail()));
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
     * @param status status inicial opcional.
     * @return estado final de presença na watchlist.
     */
    @PostMapping("/series")
    public ResponseEntity<Map<String, Object>> toggleSerie(
            @RequestParam String serieId,
            @RequestParam(required = false) WatchlistStatus status) {
        return ResponseEntity.ok(watchlistService.toggleSerieInWatchlist(serieId, getCurrentUserEmail(), status));
    }

    /**
     * Atualiza o status de uma série na watchlist do usuário autenticado.
     *
     * @param serieId identificador da série.
     * @param status novo status.
     * @return estado final na watchlist.
     */
    @PatchMapping("/series/status")
    public ResponseEntity<Map<String, Object>> updateSerieStatus(
            @RequestParam String serieId,
            @RequestParam WatchlistStatus status) {
        return ResponseEntity.ok(watchlistService.updateSerieStatus(serieId, getCurrentUserEmail(), status));
    }

    /**
     * Consulta se uma série está presente na watchlist do usuário autenticado.
     *
     * @param serieId identificador da série.
     * @return status de presença na watchlist.
     */
    @GetMapping("/series/status")
    public ResponseEntity<Map<String, Object>> getSerieStatus(@RequestParam String serieId) {
        return ResponseEntity.ok(watchlistService.checkSerieStatus(serieId, getCurrentUserEmail()));
    }

    /**
     * Consulta, em lote, o status de watchlist de séries do usuário autenticado.
     *
     * @param serieIds lista de identificadores de séries.
     * @return mapa `serieId -> statusInfo`.
     */
    @GetMapping("/series/status/batch")
    public ResponseEntity<Map<String, Object>> getSerieStatusBatch(@RequestParam List<String> serieIds) {
        return ResponseEntity.ok(watchlistService.getSerieWatchlistStatusBatch(serieIds, getCurrentUserEmail()));
    }
}