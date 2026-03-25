package com.lucasm.lmsrating.service;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lucasm.lmsrating.dto.CatalogSyncDTO;
import com.lucasm.lmsrating.dto.SerieRatingRequestDTO;
import com.lucasm.lmsrating.exceptions.MovieServiceException;
import com.lucasm.lmsrating.exceptions.ResourceNotFoundException;
import com.lucasm.lmsrating.model.RatingSerie;
import com.lucasm.lmsrating.repository.SerieRepository;

@Service
public class RateSerieService {

    private final RabbitMQProducer rabbitMQProducer;

    private static final Logger logger = LoggerFactory.getLogger(RateSerieService.class);

    private final SerieRepository serieRepository;
    private final JdbcTemplate jdbcTemplate;
    // private final RabbitMQProducer rabbitMQProducer;

    public RateSerieService(SerieRepository serieRepository, JdbcTemplate jdbcTemplate, RabbitMQProducer rabbitMQProducer) {
        this.serieRepository = serieRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.rabbitMQProducer = rabbitMQProducer;
    }

    private Long getUserIdByEmail(String email) {
        String sql = "SELECT id FROM users WHERE email = ?";
        return jdbcTemplate.queryForObject(sql, Long.class, email);
    }

    @Transactional
    @CacheEvict(value = "userRatedSeries", allEntries = true)
    public RatingSerie rateSerie(SerieRatingRequestDTO request, String email) {
        try {
            Long userId = getUserIdByEmail(email);

            RatingSerie serie = serieRepository.findBySerieIdAndUserId(request.getSerieId(), userId)
                .orElse(new RatingSerie());

            serie.setSerieId(request.getSerieId());
            serie.setUserId(userId);
            serie.setRating(request.getRating());
            serie.setComment(request.getComment());
            
            CatalogSyncDTO syncDTO = new CatalogSyncDTO(request.getSerieId(), request.getTitle(), request.getPoster_path());
            rabbitMQProducer.sendSerieCatalogSync(syncDTO);
            
            return serieRepository.save(serie);

        } catch (Exception e) {
            logger.error("Erro ao salvar avaliação da série {}: {}", request.getSerieId(), e.getMessage(), e);
            throw new MovieServiceException("Erro ao salvar avaliação da série: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "userRatedSeries", key = "#email")
    public List<RatingSerie> searchRatedSeries(String email) {
        try {
            Long userId = getUserIdByEmail(email);
            List<RatingSerie> result = serieRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
            return result.isEmpty() ? Collections.emptyList() : result;
        } catch (Exception e) {
            logger.error("Erro ao buscar séries avaliadas para o usuário {}: {}", email, e.getMessage(), e);
            throw new MovieServiceException("Erro ao buscar séries avaliadas: " + e.getMessage(), e);
        }
    }

    public Page<RatingSerie> searchRatedSeriesPaged(String email, Pageable pageable) {
        try {
            Long userId = getUserIdByEmail(email);
            return serieRepository.findAllByUserId(userId, pageable);
        } catch (Exception e) {
            logger.error("Erro ao buscar séries paginadas para o usuário {}: {}", email, e.getMessage());
            throw new MovieServiceException("Erro ao buscar séries avaliadas", e);
        }
    }

    public Page<RatingSerie> searchRatedSeriesByRatingRange(String email, double minRating, double maxRating, Pageable pageable) {
        Long userId = getUserIdByEmail(email);
        return serieRepository.findByUserIdAndRatingRange(userId, minRating, maxRating, pageable);
    }

    public Page<RatingSerie> searchRatedSeriesByTitle(String email, String title, Pageable pageable) {
        try {
            Long userId = getUserIdByEmail(email);
            return serieRepository.findByUserIdAndTitleContainingIgnoreCase(userId, title, pageable);
        } catch (Exception e) {
            logger.error("Erro na busca por título para o usuário {}: {}", email, e.getMessage());
            throw new MovieServiceException("Erro ao buscar séries por título", e);
        }
    }

    public RatingSerie getSerieRating(String serieId, String email) {
        Long userId = getUserIdByEmail(email);
        return serieRepository.findBySerieIdAndUserId(serieId, userId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Avaliação não encontrada para a série " + serieId
            ));
    }
}