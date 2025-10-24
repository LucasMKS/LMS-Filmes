package com.lucasm.lmsrating.service;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.lucasm.lmsrating.dto.SerieRatingRequestDTO;
import com.lucasm.lmsrating.exceptions.MovieServiceException;
import com.lucasm.lmsrating.exceptions.ResourceNotFoundException;
import com.lucasm.lmsrating.model.Series;
import com.lucasm.lmsrating.repository.SerieRepository;

@Service
public class RateSerieService {

    private static final Logger logger = LoggerFactory.getLogger(RateSerieService.class);

    private final SerieRepository serieRepository;

    public RateSerieService(SerieRepository serieRepository) {
        this.serieRepository = serieRepository;
    }

    @CacheEvict(value = "userRatedSeries", key = "#email")
    public Series rateSerie(SerieRatingRequestDTO request, String email) {
        try {
            Series serie = serieRepository.findBySerieIdAndEmail(request.getSerieId(), email)
                .orElse(new Series());

            serie.setSerieId(request.getSerieId());
            serie.setEmail(email);
            serie.setRating(request.getRating());
            serie.setComment(request.getComment());
            serie.setTitle(request.getTitle());
            serie.setPoster_path(request.getPoster_path());
            
            return serieRepository.save(serie);

        } catch (Exception e) {
            logger.error("Erro ao salvar avaliação da série {}: {}", request.getSerieId(), e.getMessage(), e);
            throw new MovieServiceException("Erro ao salvar avaliação da série: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "userRatedSeries", key = "#email")
    public List<Series> searchRatedSeries(String email) {
        try {
            List<Series> result = serieRepository.findAllByEmailOrderByCreatedAtDesc(email);
            return result.isEmpty() ? Collections.emptyList() : result;
        } catch (Exception e) {
            logger.error("Erro ao buscar séries avaliadas para o usuário {}: {}", email, e.getMessage(), e);
            throw new MovieServiceException("Erro ao buscar séries avaliadas: " + e.getMessage(), e);
        }
    }

    public Series getSerieRating(String serieId, String email) {
        return serieRepository.findBySerieIdAndEmail(serieId, email)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Avaliação não encontrada para a série " + serieId + " e usuário " + email
            ));
    }
}
