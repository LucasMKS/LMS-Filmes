package com.lucasm.lmsfilmes.service;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.lucasm.lmsfilmes.dto.CatalogSyncDTO;
import com.lucasm.lmsfilmes.model.Movie;
import com.lucasm.lmsfilmes.model.Serie;
import com.lucasm.lmsfilmes.repository.MovieRepository;
import com.lucasm.lmsfilmes.repository.SerieRepository;

@Component
public class CatalogSyncListener {

    private final MovieRepository movieRepository;
    private final SerieRepository serieRepository;

    public CatalogSyncListener(MovieRepository movieRepository, SerieRepository serieRepository) {
        this.movieRepository = movieRepository;
        this.serieRepository = serieRepository;
    }

    @RabbitListener(queues = "movie.catalog.sync.queue")
    public void syncMovie(CatalogSyncDTO dto) {
        // Se o filme não existir no banco, ele insere
        if (!movieRepository.existsById(dto.getId())) {
            Movie movie = new Movie();
            movie.setMovieId(dto.getId());
            movie.setTitle(dto.getTitle());
            movie.setPosterPath(dto.getPosterPath());
            movieRepository.save(movie);
        }
    }

    @RabbitListener(queues = "serie.catalog.sync.queue")
    public void syncSerie(CatalogSyncDTO dto) {
        if (!serieRepository.existsById(dto.getId())) {
            Serie serie = new Serie();
            serie.setSerieId(dto.getId());
            serie.setTitle(dto.getTitle());
            serie.setPosterPath(dto.getPosterPath());
            serieRepository.save(serie);
        }
    }
}