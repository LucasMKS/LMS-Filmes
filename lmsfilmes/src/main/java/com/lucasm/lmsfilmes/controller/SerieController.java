package com.lucasm.lmsfilmes.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsfilmes.dto.SeriesDTO;
import com.lucasm.lmsfilmes.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.service.SerieService;

/**
 * Controller REST para endpoints de consulta de séries.
 */
@RestController
@RequestMapping("/series")
public class SerieController {

    private final SerieService serieService;

    /**
     * Inicializa uma nova instância de SerieController.
     *
        * @param serieService serviço usado para consultar dados de séries.
     */
    public SerieController(SerieService serieService) {
        this.serieService = serieService;
    }
 
    /**
     * Pesquisa séries por texto.
     *
     * @param query termo de busca.
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de séries encontradas.
     */
    @GetMapping("/search")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> searchSeries(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page) { 
        TmdbPageDTO<SeriesDTO> serie = serieService.searchSeries(query, page);
        return ResponseEntity.ok(serie);
    }

    /**
     * Retorna os detalhes de uma série específica.
     *
     * @param serieId identificador da série no TMDB.
     * @return resposta HTTP com os detalhes da série.
     */
    @GetMapping("/{serieId}")
    public ResponseEntity<SeriesDTO> getSeriesDetails(@PathVariable String serieId) {
        SeriesDTO serie = serieService.getSeriesDetails(serieId);
        return ResponseEntity.ok(serie);
    }

    /**
     * Lista séries populares da semana.
     *
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de séries populares.
     */
    @GetMapping("/popular")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getPopularSeries(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<SeriesDTO> serie = serieService.getPopularSeries(page); 
        return ResponseEntity.ok(serie);
    }

    /**
     * Lista séries exibidas hoje.
     *
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de séries exibidas hoje.
     */
    @GetMapping("/airing-today")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getAiringTodaySeries(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<SeriesDTO> series = serieService.getAiringTodaySeries(page);
        return ResponseEntity.ok(series);
    }

    /**
     * Lista séries que estão no ar.
     *
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de séries no ar.
     */
    @GetMapping("/on-the-air")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getOnTheAirSeries(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<SeriesDTO> series = serieService.getOnTheAirSeries(page);
        return ResponseEntity.ok(series);
    }

    /**
     * Lista séries mais bem avaliadas.
     *
     * @param page número da página de resultados.
     * @return resposta HTTP com a página de séries mais bem avaliadas.
     */
    @GetMapping("/top-rated")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getTopRatedSeries(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<SeriesDTO> series = serieService.getTopRatedSeries(page);
        return ResponseEntity.ok(series);
    }
}