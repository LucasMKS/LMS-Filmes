package com.lucasm.lmsrating.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

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
import com.lucasm.lmsrating.dto.RatingSerieResponseDTO;
import com.lucasm.lmsrating.dto.RatingStatusDTO;
import com.lucasm.lmsrating.dto.SerieRatingRequestDTO;
import com.lucasm.lmsrating.exceptions.MovieServiceException;
import com.lucasm.lmsrating.exceptions.ResourceNotFoundException;
import com.lucasm.lmsrating.model.RatingSerie;
import com.lucasm.lmsrating.repository.SerieRepository;

@Service
public class RateSerieService {

    private static final Logger logger = LoggerFactory.getLogger(RateSerieService.class);

    private final SerieRepository serieRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RabbitMQProducer rabbitMQProducer;
    private final UserLookupService userLookupService;

    public RateSerieService(SerieRepository serieRepository, JdbcTemplate jdbcTemplate, RabbitMQProducer rabbitMQProducer, UserLookupService userLookupService) {
        this.serieRepository = serieRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.rabbitMQProducer = rabbitMQProducer;
        this.userLookupService = userLookupService;
    }

    @Transactional
    @CacheEvict(value = "userRatedSeries", key = "#email")
    public RatingSerie rateSerie(SerieRatingRequestDTO request, String email) {
        try {
            Long userId = userLookupService.getUserIdByEmail(email);

            RatingSerie serie = serieRepository.findBySerieIdAndUserId(request.getSerieId(), userId)
                .orElse(new RatingSerie());

            serie.setSerieId(request.getSerieId());
            serie.setUserId(userId);
            serie.setRating(request.getRating());
            serie.setComment(request.getComment());

            jdbcTemplate.update(
                "INSERT INTO series (serie_id, title, poster_path) VALUES (?, ?, ?) ON CONFLICT (serie_id) DO NOTHING",
                request.getSerieId(), request.getTitle(), request.getPoster_path()
            );

            RatingSerie saved = serieRepository.save(serie);

            String serieId = request.getSerieId();
            CatalogSyncDTO syncDTO = new CatalogSyncDTO(serieId, request.getTitle(), request.getPoster_path());
            CompletableFuture.runAsync(() -> rabbitMQProducer.sendSerieCatalogSync(syncDTO))
                .exceptionally(e -> { logger.warn("Falha ao sincronizar catálogo para série {}: {}", serieId, e.getMessage()); return null; });

            return saved;

        } catch (Exception e) {
            logger.error("Erro ao salvar avaliação da série {}: {}", request.getSerieId(), e.getMessage(), e);
            throw new MovieServiceException("Erro ao salvar avaliação da série: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "userRatedSeries", key = "#email")
    public List<RatingSerie> searchRatedSeries(String email) {
        try {
            Long userId = userLookupService.getUserIdByEmail(email);
            List<RatingSerie> result = serieRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
            return result.isEmpty() ? Collections.emptyList() : result;
        } catch (Exception e) {
            logger.error("Erro ao buscar séries avaliadas para o usuário {}: {}", email, e.getMessage(), e);
            throw new MovieServiceException("Erro ao buscar séries avaliadas: " + e.getMessage(), e);
        }
    }

    public Page<RatingSerieResponseDTO> searchRatedSeriesPaged(String email, String title, Double minRating, Double maxRating, Pageable pageable) {
        Long userId = userLookupService.getUserIdByEmail(email);
        boolean hasTitle = title != null && !title.isBlank();
        boolean hasRange = minRating != null && maxRating != null;

        Page<RatingSerie> ratings;
        if (hasTitle && hasRange) {
            ratings = serieRepository.findByUserIdAndTitleAndRatingRange(userId, title, minRating, maxRating, pageable);
        } else if (hasTitle) {
            ratings = serieRepository.findByUserIdAndTitleContainingIgnoreCase(userId, title, pageable);
        } else if (hasRange) {
            ratings = serieRepository.findByUserIdAndRatingRange(userId, minRating, maxRating, pageable);
        } else {
            ratings = serieRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        if (ratings.isEmpty()) return ratings.map(r -> null);

        List<String> serieIds = ratings.getContent().stream().map(RatingSerie::getSerieId).toList();
        Map<String, CatalogEntry> catalog = loadCatalogBatch(serieIds);

        return ratings.map(r -> {
            CatalogEntry c = catalog.get(r.getSerieId());
            return new RatingSerieResponseDTO(
                r.getId(),
                r.getSerieId(),
                c != null ? c.title : null,
                c != null ? c.posterPath : null,
                r.getRating(),
                r.getComment(),
                r.getCreatedAt(),
                r.getModifiedAt()
            );
        });
    }

    private Map<String, CatalogEntry> loadCatalogBatch(List<String> serieIds) {
        if (serieIds.isEmpty()) return Map.of();
        String placeholders = String.join(",", Collections.nCopies(serieIds.size(), "?"));
        String sql = "SELECT serie_id, title, poster_path FROM series WHERE serie_id IN (" + placeholders + ")";
        Map<String, CatalogEntry> result = new HashMap<>();
        jdbcTemplate.query(sql, serieIds.toArray(), rs -> {
            result.put(rs.getString("serie_id"), new CatalogEntry(
                rs.getString("title"),
                rs.getString("poster_path")
            ));
        });
        return result;
    }

    private record CatalogEntry(String title, String posterPath) {}

    public RatingSerie getSerieRating(String serieId, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return serieRepository.findBySerieIdAndUserId(serieId, userId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Avaliação não encontrada para a série " + serieId
            ));
    }

    public Map<String, RatingStatusDTO> getRatingStatusBatch(List<String> serieIds, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        List<RatingSerie> ratings = serieRepository.findByUserIdAndSerieIdIn(userId, serieIds);
        Map<String, RatingStatusDTO> result = new HashMap<>();
        for (RatingSerie r : ratings) {
            result.put(r.getSerieId(), new RatingStatusDTO(String.valueOf(r.getRating()), r.getComment()));
        }
        return result;
    }
}
