package com.lucasm.lmsrating.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsrating.dto.RatingRequestDTO;
import com.lucasm.lmsrating.model.Movies;
import com.lucasm.lmsrating.service.RateMovieService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/rate/movies")
public class RateMovieController {

    @Autowired
    private RateMovieService rateService;

    @PostMapping("")
    public ResponseEntity<Movies> ratingMovies(
            @Valid @RequestBody RatingRequestDTO request,
            Authentication authentication) {
        
        String email = authentication.getName();
        return ResponseEntity.ok(rateService.rateMovie(request, email));
    }

    @GetMapping("/")
    public ResponseEntity<List<Movies>> getUserRatings(Authentication authentication) {
        String email = authentication.getName();
        List<Movies> movies = rateService.searchRatedMovies(email);
        return ResponseEntity.ok(movies);
    }

    @GetMapping("/{movieId}")
    public ResponseEntity<Movies> getMovieRating(
            @PathVariable String movieId,
            Authentication authentication) {
        
        String email = authentication.getName();
        Movies movie = rateService.getMovieRating(movieId, email);
        return ResponseEntity.ok(movie);
    }
}