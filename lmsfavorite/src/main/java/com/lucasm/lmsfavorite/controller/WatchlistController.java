package com.lucasm.lmsfavorite.controller;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import com.lucasm.lmsfavorite.model.WatchlistSerie;
import com.lucasm.lmsfavorite.service.WatchlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/watchlist")
public class WatchlistController {

    private final WatchlistService watchlistService;

    public WatchlistController(WatchlistService watchlistService) {
        this.watchlistService = watchlistService;
    }

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/movies")
    public ResponseEntity<List<WatchlistMovie>> getMovies() {
        return ResponseEntity.ok(watchlistService.getUserWatchlistMovies(getCurrentUserEmail()));
    }

    @PostMapping("/movies")
    public ResponseEntity<Map<String, Boolean>> toggleMovie(@RequestParam String movieId) {
        return ResponseEntity.ok(watchlistService.toggleMovieInWatchlist(movieId, getCurrentUserEmail()));
    }

    @GetMapping("/movies/status")
    public ResponseEntity<Map<String, Boolean>> getMovieStatus(@RequestParam String movieId) {
        return ResponseEntity.ok(watchlistService.checkMovieStatus(movieId, getCurrentUserEmail()));
    }

    @GetMapping("/series")
    public ResponseEntity<List<WatchlistSerie>> getSeries() {
        return ResponseEntity.ok(watchlistService.getUserWatchlistSeries(getCurrentUserEmail()));
    }

    @PostMapping("/series")
    public ResponseEntity<Map<String, Boolean>> toggleSerie(@RequestParam String serieId) {
        return ResponseEntity.ok(watchlistService.toggleSerieInWatchlist(serieId, getCurrentUserEmail()));
    }

    @GetMapping("/series/status")
    public ResponseEntity<Map<String, Boolean>> getSerieStatus(@RequestParam String serieId) {
        return ResponseEntity.ok(watchlistService.checkSerieStatus(serieId, getCurrentUserEmail()));
    }
}