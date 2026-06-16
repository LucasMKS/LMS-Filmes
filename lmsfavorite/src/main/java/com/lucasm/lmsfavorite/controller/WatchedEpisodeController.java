package com.lucasm.lmsfavorite.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.lucasm.lmsfavorite.dto.WatchedEpisodeRequestDTO;
import com.lucasm.lmsfavorite.model.WatchedEpisode;
import com.lucasm.lmsfavorite.service.WatchedEpisodeService;

@RestController
@RequestMapping("/watched/episodes")
public class WatchedEpisodeController {

    private final WatchedEpisodeService watchedEpisodeService;

    public WatchedEpisodeController(WatchedEpisodeService watchedEpisodeService) {
        this.watchedEpisodeService = watchedEpisodeService;
    }

    @PostMapping("")
    public ResponseEntity<WatchedEpisode> markAsWatched(
            @RequestBody WatchedEpisodeRequestDTO request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(watchedEpisodeService.markAsWatched(
            request.getSerieId(), request.getSeasonNumber(), request.getEpisodeNumber(), email));
    }

    @DeleteMapping("")
    public ResponseEntity<Void> unmarkAsWatched(
            @RequestBody WatchedEpisodeRequestDTO request,
            Authentication authentication) {
        String email = authentication.getName();
        watchedEpisodeService.unmarkAsWatched(
            request.getSerieId(), request.getSeasonNumber(), request.getEpisodeNumber(), email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/serie/{serieId}")
    public ResponseEntity<List<WatchedEpisode>> getWatchedEpisodes(
            @PathVariable String serieId,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(watchedEpisodeService.getWatchedEpisodesBySerie(serieId, email));
    }
}
