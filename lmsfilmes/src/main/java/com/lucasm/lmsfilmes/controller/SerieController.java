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

@RestController
@RequestMapping("/series")
public class SerieController {

    private final SerieService serieService;

    public SerieController(SerieService serieService) {
        this.serieService = serieService;
    }
 
    @GetMapping("/search")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> searchSeries(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page) { 
        TmdbPageDTO<SeriesDTO> serie = serieService.searchSeries(query, page);
        return ResponseEntity.ok(serie);
    }

    @GetMapping("/{serieId}")
    public ResponseEntity<SeriesDTO> getSeriesDetails(@PathVariable String serieId) {
        SeriesDTO serie = serieService.getSeriesDetails(serieId);
        return ResponseEntity.ok(serie);
    }

    @GetMapping("/popular")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getPopularSeries(@RequestParam(defaultValue = "1") int page) {
        // 3. Nome do método padronizado
        TmdbPageDTO<SeriesDTO> serie = serieService.getPopularSeries(page); 
        return ResponseEntity.ok(serie);
    }

    @GetMapping("/airing-today")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getAiringTodaySeries(@RequestParam(defaultValue = "1") int page) {
        // 3. Nome do método padronizado
        TmdbPageDTO<SeriesDTO> series = serieService.getAiringTodaySeries(page);
        return ResponseEntity.ok(series);
    }

    @GetMapping("/on-the-air")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getOnTheAirSeries(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<SeriesDTO> series = serieService.getOnTheAirSeries(page);
        return ResponseEntity.ok(series);
    }

    @GetMapping("/top-rated")
    public ResponseEntity<TmdbPageDTO<SeriesDTO>> getTopRatedSeries(@RequestParam(defaultValue = "1") int page) {
        TmdbPageDTO<SeriesDTO> series = serieService.getTopRatedSeries(page);
        return ResponseEntity.ok(series);
    }
}