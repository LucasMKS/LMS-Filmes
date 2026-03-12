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

/**
 * Expõe endpoints de criação e consulta de avaliações de séries do usuário autenticado.
 */
@RestController
@RequestMapping("/rate/series")
public class RateSerieController {

    private final RateSerieService rateService;

    /**
     * Cria o controller com o serviço de avaliações de séries.
     *
     * @param rateService serviço de regras de avaliação de séries.
     */
    public RateSerieController(RateSerieService rateService) {
        this.rateService = rateService;
    }
    
    /**
     * Cria ou atualiza a avaliação de uma série para o usuário autenticado.
     *
     * @param request payload com nota e metadados da série.
     * @param authentication contexto de autenticação do usuário.
     * @return avaliação persistida.
     */
    @PostMapping("")
    public ResponseEntity<Series> ratingSeries(
            @Valid @RequestBody SerieRatingRequestDTO request,
            Authentication authentication) {
        
        String email = authentication.getName();
        return ResponseEntity.ok(rateService.rateSerie(request, email));
    }

    /**
     * Lista todas as avaliações de séries do usuário autenticado.
     *
     * @param authentication contexto de autenticação do usuário.
     * @return lista de avaliações de séries.
     */
    @GetMapping("/")
    public ResponseEntity<List<Series>> getUserRatings(Authentication authentication) {
        String email = authentication.getName();
        List<Series> series = rateService.searchRatedSeries(email);
        return ResponseEntity.ok(series);
    }

    /**
     * Lista avaliações de séries com paginação para o usuário autenticado.
     *
     * @param page número da página.
     * @param size quantidade de itens por página.
     * @param authentication contexto de autenticação do usuário.
     * @return página de avaliações de séries.
     */
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
    public ResponseEntity<Page<Series>> getUserRatingsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double maxRating,
            Authentication authentication) {
        
        String email = authentication.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        if (minRating != null && maxRating != null) {
            return ResponseEntity.ok(rateService.searchRatedSeriesByRatingRange(email, minRating, maxRating, pageable));
        }
        
        return ResponseEntity.ok(rateService.searchRatedSeriesPaged(email, pageable));
    }

    /**
     * Obtém a avaliação de uma série específica do usuário autenticado.
     *
     * @param serieId identificador da série.
     * @param authentication contexto de autenticação do usuário.
     * @return avaliação da série solicitada.
     */
    @GetMapping("/{serieId}")
    public ResponseEntity<Series> getSerieRating(
            @PathVariable String serieId,
            Authentication authentication) {
        
        String email = authentication.getName();
        Series serie = rateService.getSerieRating(serieId, email);
        return ResponseEntity.ok(serie);
    }
    
}
