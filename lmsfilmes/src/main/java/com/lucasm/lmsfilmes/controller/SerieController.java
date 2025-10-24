package com.lucasm.lmsfilmes.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsfilmes.dto.SeriesDTO;
import com.lucasm.lmsfilmes.service.SerieService;

@RestController
@RequestMapping("/series")
public class SerieController {

    @Autowired
    private SerieService serieService;
 
    // Método para buscar séries por query.
    @GetMapping("/search")
    public ResponseEntity<List<SeriesDTO>> searchSeries(@RequestParam String query) {
        List<SeriesDTO> serie = serieService.searchSeries(query);
        return ResponseEntity.ok(serie);
    }

    // Método para obter detalhes de uma série.
    @GetMapping("/{serieId}")
    public ResponseEntity<SeriesDTO> getSeriesDetails(@PathVariable String serieId) {
        SeriesDTO serie = serieService.getSeriesDetails(serieId);
        return ResponseEntity.ok(serie);
    }

    // Método para obter séries populares.
    @GetMapping("/popular")
    public ResponseEntity<List<SeriesDTO>> seriePopular(@RequestParam(defaultValue = "1") int page) {
        List<SeriesDTO> serie = serieService.seriePopular(page);
        return ResponseEntity.ok(serie);
    }

    // Método para obter séries que estão sendo exibidas hoje.
    @GetMapping("/airing-today")
    public ResponseEntity<List<SeriesDTO>> airingTodaySeries(@RequestParam(defaultValue = "1") int page) {
        List<SeriesDTO> series = serieService.airingTodaySeries(page);
        return ResponseEntity.ok(series);
    }

    // Método para obter séries no ar.
    @GetMapping("/on-the-air")
    public ResponseEntity<List<SeriesDTO>> onTheAirSeries(@RequestParam(defaultValue = "1") int page) {
        List<SeriesDTO> series = serieService.onTheAirSeries(page);
        return ResponseEntity.ok(series);
    }

    // Método para obter séries mais bem avaliadas.
    @GetMapping("/top-rated")
    public ResponseEntity<List<SeriesDTO>> topRatedSeries(@RequestParam(defaultValue = "1") int page) {
        List<SeriesDTO> series = serieService.topRatedSeries(page);
        return ResponseEntity.ok(series);
    }

}
