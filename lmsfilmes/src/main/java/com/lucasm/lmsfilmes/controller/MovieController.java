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

/**
 * Controller REST para endpoints de consulta de filmes.
 */
@RestController
@RequestMapping("/movies")
public class MovieController {

    private final MovieService movieService;

    /**
     * Inicializa uma nova instância de MovieController.
     *
        * @param movieService serviço usado para consultar dados de filmes.
     */
    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    /**
     * Pesquisa filmes por texto.
     *
     * @param query termo de busca.
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de filmes encontrados.
     */
    @GetMapping("/search")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> searchMovies(@RequestParam String query, @RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<TmdbDTO> movies = movieService.searchMovies(query, page);
        return ResponseEntity.ok(movies);
    }

    /**
     * Retorna os detalhes de um filme específico.
     *
     * @param movieId identificador do filme no TMDB.
     * @return resposta HTTP com os detalhes do filme.
     */
    @GetMapping("/{movieId}")
    public ResponseEntity<TmdbDTO> getMoviesDetails(@PathVariable String movieId) {
        TmdbDTO movie = movieService.getMovieDetails(movieId); 
        return ResponseEntity.ok(movie);
    }
    /**
     * Lista filmes populares.
     *
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de filmes populares.
     */
    @GetMapping("/popular")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getPopularMovies(@RequestParam(defaultValue = "1") int page) { 
        TmdbPageDTO<TmdbDTO> movies = movieService.getPopularMovies(page); 
        return ResponseEntity.ok(movies);
    }

    /**
     * Lista filmes em cartaz.
     *
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de filmes em cartaz.
     */
    @GetMapping("/now-playing")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getNowPlayingMovies(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<TmdbDTO> movies = movieService.getNowPlayingMovies(page);
        return ResponseEntity.ok(movies);
    }

    /**
     * Lista filmes mais bem avaliados.
     *
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de filmes mais bem avaliados.
     */
    @GetMapping("/top-rated")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getTopRatedMovies(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<TmdbDTO> movies = movieService.getTopRatedMovies(page);
        return ResponseEntity.ok(movies);
    }

    /**
     * Lista próximos lançamentos de filmes.
     *
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de próximos lançamentos.
     */
    @GetMapping("/upcoming")
    public ResponseEntity<TmdbPageDTO<TmdbDTO>> getUpcomingMovies(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<TmdbDTO> movies = movieService.getUpcomingMovies(page);
        return ResponseEntity.ok(movies);
    }
}