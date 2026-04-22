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
import com.lucasm.lmsrating.dto.RatingMovieResponseDTO;
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

    public Page<RatingMovieResponseDTO> searchRatedMoviesPaged(String email, String title, Double minRating, Double maxRating, Pageable pageable) {
        Long userId = userLookupService.getUserIdByEmail(email);
        boolean hasTitle = title != null && !title.isBlank();
        boolean hasRange = minRating != null && maxRating != null;

        Page<RatingMovie> ratings;
        if (hasTitle && hasRange) {
            ratings = movieRepository.findByUserIdAndTitleAndRatingRange(userId, title, minRating, maxRating, pageable);
        } else if (hasTitle) {
            ratings = movieRepository.findByUserIdAndTitleContainingIgnoreCase(userId, title, pageable);
        } else if (hasRange) {
            ratings = movieRepository.findByUserIdAndRatingRange(userId, minRating, maxRating, pageable);
        } else {
            ratings = movieRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        if (ratings.isEmpty()) return ratings.map(r -> null);

        List<String> movieIds = ratings.getContent().stream().map(RatingMovie::getMovieId).toList();
        Map<String, CatalogEntry> catalog = loadCatalogBatch(movieIds);

        return ratings.map(r -> {
            CatalogEntry c = catalog.get(r.getMovieId());
            return new RatingMovieResponseDTO(
                r.getId(),
                r.getMovieId(),
                c != null ? c.title : null,
                c != null ? c.posterPath : null,
                r.getRating(),
                r.getComment(),
                r.getCreatedAt(),
                r.getModifiedAt()
            );
        });
    }

    private Map<String, CatalogEntry> loadCatalogBatch(List<String> movieIds) {
        if (movieIds.isEmpty()) return Map.of();
        String placeholders = String.join(",", Collections.nCopies(movieIds.size(), "?"));
        String sql = "SELECT movie_id, title, poster_path FROM movies WHERE movie_id IN (" + placeholders + ")";
        Map<String, CatalogEntry> result = new HashMap<>();
        jdbcTemplate.query(sql, movieIds.toArray(), rs -> {
            result.put(rs.getString("movie_id"), new CatalogEntry(
                rs.getString("title"),
                rs.getString("poster_path")
            ));
        });
        return result;
    }

    private record CatalogEntry(String title, String posterPath) {}

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
