package com.lucasm.lmsrating.controller;

import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsrating.dto.SerieRatingRequestDTO;
import com.lucasm.lmsrating.model.Series;
import com.lucasm.lmsrating.service.RateSerieService;

import jakarta.validation.Valid;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/rate/series")
public class RateSerieController {

    private final RateSerieService rateService;

    public RateSerieController(RateSerieService rateService) {
        this.rateService = rateService;
    }
    
    @PostMapping("")
    public ResponseEntity<Series> ratingSeries(
            @Valid @RequestBody SerieRatingRequestDTO request,
            Authentication authentication) {
        
        String email = authentication.getName();
        return ResponseEntity.ok(rateService.rateSerie(request, email));
    }

    // Método para obter as avaliações de uma série.
    @GetMapping("/")
    public ResponseEntity<List<Series>> getUserRatings(Authentication authentication) {
        String email = authentication.getName();
        List<Series> series = rateService.searchRatedSeries(email);
        return ResponseEntity.ok(series);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<Series>> getUserRatingsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        
        String email = authentication.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        // Lembre-se de criar o método correspondente no RateSerieService
        return ResponseEntity.ok(rateService.searchRatedSeriesPaged(email, pageable));
    }

    @GetMapping("/{serieId}")
    public ResponseEntity<Series> getSerieRating(
            @PathVariable String serieId,
            Authentication authentication) {
        
        String email = authentication.getName();
        Series serie = rateService.getSerieRating(serieId, email);
        return ResponseEntity.ok(serie);
    }
    
}
