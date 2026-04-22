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
import com.lucasm.lmsrating.dto.RatingRequestDTO;
import com.lucasm.lmsrating.dto.RatingStatusDTO;
import com.lucasm.lmsrating.exceptions.MovieServiceException;
import com.lucasm.lmsrating.exceptions.ResourceNotFoundException;
import com.lucasm.lmsrating.model.RatingMovie;
import com.lucasm.lmsrating.repository.MovieRepository;

@Service
public class RateMovieService {

    private static final Logger logger = LoggerFactory.getLogger(RateMovieService.class);

    private final MovieRepository movieRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RabbitMQProducer rabbitMQProducer;
    private final UserLookupService userLookupService;

    public RateMovieService(MovieRepository movieRepository, JdbcTemplate jdbcTemplate, RabbitMQProducer rabbitMQProducer, UserLookupService userLookupService) {
        this.movieRepository = movieRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.rabbitMQProducer = rabbitMQProducer;
        this.userLookupService = userLookupService;
    }

    @Transactional
    @CacheEvict(value = "userRatedMovies", key = "#email")
    public RatingMovie rateMovie(RatingRequestDTO request, String email) {
        try {
            Long userId = userLookupService.getUserIdByEmail(email);

            RatingMovie movie = movieRepository.findByMovieIdAndUserId(request.getMovieId(), userId)
                .orElse(new RatingMovie());

            movie.setMovieId(request.getMovieId());
            movie.setUserId(userId);
            movie.setRating(request.getRating());
            movie.setComment(request.getComment());

            jdbcTemplate.update(
                "INSERT INTO movies (movie_id, title, poster_path) VALUES (?, ?, ?) ON CONFLICT (movie_id) DO NOTHING",
                request.getMovieId(), request.getTitle(), request.getPoster_path()
            );

            RatingMovie saved = movieRepository.save(movie);

            String movieId = request.getMovieId();
            CatalogSyncDTO syncDTO = new CatalogSyncDTO(movieId, request.getTitle(), request.getPoster_path());
            CompletableFuture.runAsync(() -> rabbitMQProducer.sendMovieCatalogSync(syncDTO))
                .exceptionally(e -> { logger.warn("Falha ao sincronizar catálogo para filme {}: {}", movieId, e.getMessage()); return null; });

            return saved;

        } catch (Exception e) {
            throw new MovieServiceException("Erro ao salvar avaliação do filme: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "userRatedMovies", key = "#email")
    public List<RatingMovie> searchRatedMovies(String email) {
        try {
            Long userId = userLookupService.getUserIdByEmail(email);
            List<RatingMovie> result = movieRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
            return result.isEmpty() ? Collections.emptyList() : result;
        } catch (Exception e) {
            logger.error("Erro ao buscar filmes avaliados para o usuário {}: {}", email, e.getMessage(), e);
            throw new MovieServiceException("Erro ao buscar filmes avaliados: " + e.getMessage(), e);
        }
    }

    public Page<RatingMovie> searchRatedMoviesPaged(String email, Pageable pageable) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return movieRepository.findAllByUserId(userId, pageable);
    }

    public Page<RatingMovie> searchRatedMoviesByRatingRange(String email, double minRating, double maxRating, Pageable pageable) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return movieRepository.findByUserIdAndRatingRange(userId, minRating, maxRating, pageable);
    }

    public Page<RatingMovie> searchRatedMoviesByTitle(String email, String title, Pageable pageable) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return movieRepository.findByUserIdAndTitleContainingIgnoreCase(userId, title, pageable);
    }

    public RatingMovie getMovieRating(String movieId, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return movieRepository.findByMovieIdAndUserId(movieId, userId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Avaliação não encontrada para o filme " + movieId
            ));
    }

    public Map<String, RatingStatusDTO> getRatingStatusBatch(List<String> movieIds, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        List<RatingMovie> ratings = movieRepository.findByUserIdAndMovieIdIn(userId, movieIds);
        Map<String, RatingStatusDTO> result = new HashMap<>();
        for (RatingMovie r : ratings) {
            result.put(r.getMovieId(), new RatingStatusDTO(String.valueOf(r.getRating()), r.getComment()));
        }
        return result;
    }
}
