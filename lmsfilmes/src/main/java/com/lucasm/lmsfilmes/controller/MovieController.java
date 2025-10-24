package com.lucasm.lmsfilmes.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsfilmes.dto.TmdbDTO;
import com.lucasm.lmsfilmes.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.service.MovieService;

@RestController
@RequestMapping("/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping("/search")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> searchMovies(@RequestParam String query, @RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<TmdbDTO> movies = movieService.searchMovies(query, page);
        return ResponseEntity.ok(movies);
    }

    @GetMapping("/{movieId}")
    public ResponseEntity<TmdbDTO> getMoviesDetails(@PathVariable String movieId) {
        TmdbDTO movie = movieService.getMovieDetails(movieId); 
        return ResponseEntity.ok(movie);
    }
    @GetMapping("/popular")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getPopularMovies(@RequestParam(defaultValue = "1") int page) { 
        TmdbPageDTO<TmdbDTO> movies = movieService.getPopularMovies(page); 
        return ResponseEntity.ok(movies);
    }

    @GetMapping("/now-playing")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getNowPlayingMovies(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<TmdbDTO> movies = movieService.getNowPlayingMovies(page);
        return ResponseEntity.ok(movies);
    }

    @GetMapping("/top-rated")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getTopRatedMovies(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<TmdbDTO> movies = movieService.getTopRatedMovies(page);
        return ResponseEntity.ok(movies);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getUpcomingMovies(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<TmdbDTO> movies = movieService.getUpcomingMovies(page);
        return ResponseEntity.ok(movies);
    }
}