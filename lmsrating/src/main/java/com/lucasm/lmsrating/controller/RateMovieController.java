package com.lucasm.lmsrating.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsrating.dto.RatingRequestDTO;
import com.lucasm.lmsrating.model.RatingMovie;
import com.lucasm.lmsrating.service.RateMovieService;

import jakarta.validation.Valid;

/**
 * Expõe endpoints de criação e consulta de avaliações de filmes do usuário autenticado.
 */
@RestController
@RequestMapping("/rate/movies")
public class RateMovieController {

    @Autowired
    private RateMovieService rateService;

    /**
     * Cria ou atualiza a avaliação de um filme para o usuário autenticado.
     *
     * @param request payload com nota e metadados do filme.
     * @param authentication contexto de autenticação do usuário.
     * @return avaliação persistida.
     */
    @PostMapping("")
    public ResponseEntity<RatingMovie> ratingMovies(
            @Valid @RequestBody RatingRequestDTO request,
            Authentication authentication) {
        
        String email = authentication.getName();
        return ResponseEntity.ok(rateService.rateMovie(request, email));
    }

    /**
     * Lista todas as avaliações de filmes do usuário autenticado.
     *
     * @param authentication contexto de autenticação do usuário.
     * @return lista de avaliações de filmes.
     */
    @GetMapping("/")
    public ResponseEntity<List<RatingMovie>> getUserRatings(Authentication authentication) {
        String email = authentication.getName();
        List<RatingMovie> movies = rateService.searchRatedMovies(email);
        return ResponseEntity.ok(movies);
    }

    /**
     * Lista avaliações de filmes com paginação para o usuário autenticado, permitindo filtro por nota.
     *
     * @param page número da página.
     * @param size quantidade de itens por página.
     * @param minRating nota mínima para o filtro (opcional).
     * @param maxRating nota máxima para o filtro (opcional).
     * @param authentication contexto de autenticação do usuário.
     * @return página de avaliações de filmes.
     */
    @GetMapping("/paged")
    public ResponseEntity<Page<RatingMovie>> getUserRatingsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double maxRating,
            Authentication authentication) {
        
        String email = authentication.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        if (minRating != null && maxRating != null) {
            return ResponseEntity.ok(rateService.searchRatedMoviesByRatingRange(email, minRating, maxRating, pageable));
        }
        
        return ResponseEntity.ok(rateService.searchRatedMoviesPaged(email, pageable));
    }

    /**
     * Obtém a avaliação de um filme específico do usuário autenticado.
     *
     * @param movieId identificador do filme.
     * @param authentication contexto de autenticação do usuário.
     * @return avaliação do filme solicitado.
     */
    @GetMapping("/{movieId}")
    public ResponseEntity<RatingMovie> getMovieRating(
            @PathVariable String movieId,
            Authentication authentication) {
        
        String email = authentication.getName();
        RatingMovie movie = rateService.getMovieRating(movieId, email);
        return ResponseEntity.ok(movie);
    }
}