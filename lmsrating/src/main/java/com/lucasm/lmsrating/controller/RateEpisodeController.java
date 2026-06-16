package com.lucasm.lmsrating.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.lucasm.lmsrating.dto.EpisodeRatingRequestDTO;
import com.lucasm.lmsrating.model.RatingEpisode;
import com.lucasm.lmsrating.service.RateEpisodeService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/rate/episodes")
public class RateEpisodeController {

    private final RateEpisodeService rateEpisodeService;

    public RateEpisodeController(RateEpisodeService rateEpisodeService) {
        this.rateEpisodeService = rateEpisodeService;
    }

    @PostMapping("")
    public ResponseEntity<RatingEpisode> rateEpisode(
            @Valid @RequestBody EpisodeRatingRequestDTO request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(rateEpisodeService.rateEpisode(request, email));
    }

    @GetMapping("/serie/{serieId}")
    public ResponseEntity<List<RatingEpisode>> getRatedEpisodes(
            @PathVariable String serieId,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(rateEpisodeService.getRatedEpisodesBySerie(serieId, email));
    }
}
