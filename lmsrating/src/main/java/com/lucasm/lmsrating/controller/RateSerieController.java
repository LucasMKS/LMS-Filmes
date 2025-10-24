package com.lucasm.lmsrating.controller;

import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsrating.model.Series;
import com.lucasm.lmsrating.service.RateSerieService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/rate/series")
public class RateSerieController {

    @Autowired
    private RateSerieService rateService;

    // Método para avaliar uma série.
    @PostMapping("")
    public ResponseEntity<Series> ratingSeries(
            @RequestParam String serieId, 
            @RequestParam String rating, 
            @RequestParam String title, 
            @RequestParam String poster_path,
            @RequestParam(required = false) String comment) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return ResponseEntity.ok(rateService.rateSerie(serieId, email, rating, title, poster_path, comment));
    }

    // Método para obter as avaliações de uma série.
    @GetMapping("/")
    public ResponseEntity<List<Series>> searchRatedSeries() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        List<Series> series = rateService.searchRatedSeries(email);
        return ResponseEntity.ok(series);
    }

    @GetMapping("/rate")
    public ResponseEntity<Series> getSerieRating(@RequestParam String serieId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        Series serie = rateService.getSerieRating(serieId, email);
        return ResponseEntity.ok(serie);
    }
    
}
