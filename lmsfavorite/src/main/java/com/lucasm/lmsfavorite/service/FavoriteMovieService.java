package com.lucasm.lmsfavorite.service;

import java.util.List;
import java.util.Optional;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lucasm.lmsfavorite.dto.CatalogSyncDTO;
import com.lucasm.lmsfavorite.model.FavoriteMovie;
import com.lucasm.lmsfavorite.repository.FavoriteMovieRepository;

@Service
public class FavoriteMovieService {

    private final FavoriteMovieRepository favoriteRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RabbitMQProducer rabbitMQProducer; 

    public FavoriteMovieService(FavoriteMovieRepository favoriteRepository, JdbcTemplate jdbcTemplate, RabbitMQProducer rabbitMQProducer) {
        this.favoriteRepository = favoriteRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.rabbitMQProducer = rabbitMQProducer;
    }

    private Long getUserIdByEmail(String email) {
        String sql = "SELECT id FROM users WHERE email = ?";
        return jdbcTemplate.queryForObject(sql, Long.class, email);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userFavoriteMovies", key = "#email")
    }, put = {
        @CachePut(value = "userFavoriteMovieStatus", key = "#email + '_' + #movieId")
    })
    public boolean toggleFavoriteMovie(String movieId, String email) {
        Long userId = getUserIdByEmail(email);

        Optional<FavoriteMovie> optionalFavorite = favoriteRepository.findByMovieIdAndUserId(movieId, userId);

        FavoriteMovie favoriteMovie = optionalFavorite.orElseGet(() -> {
            FavoriteMovie newMovie = new FavoriteMovie();
            newMovie.setMovieId(movieId);
            newMovie.setUserId(userId);
            newMovie.setFavorite(false);
            
            CatalogSyncDTO syncDTO = new CatalogSyncDTO(movieId, null, null);
            rabbitMQProducer.sendMovieCatalogSync(syncDTO);
            
            return newMovie;
        });

        favoriteMovie.setFavorite(!favoriteMovie.isFavorite());
        favoriteRepository.save(favoriteMovie);

        return favoriteMovie.isFavorite();
    }

    @Cacheable(value = "userFavoriteMovieStatus", key = "#email + '_' + #movieId")
    public boolean isFavoriteMovie(String movieId, String email) {
        Long userId = getUserIdByEmail(email);
        Optional<FavoriteMovie> optionalFavorite = favoriteRepository.findByMovieIdAndUserId(movieId, userId);
        return optionalFavorite.map(FavoriteMovie::isFavorite).orElse(false);
    }

    @Cacheable(value = "userFavoriteMovies", key = "#email")
    public List<FavoriteMovie> getAllFavoritesMovies(String email) {
        Long userId = getUserIdByEmail(email);
        return favoriteRepository.findByUserIdAndFavorite(userId, true);
    }

    public Map<String, Boolean> getFavoriteMoviesStatusBatch(List<String> movieIds, String email) {
        Map<String, Boolean> statusByMovieId = new LinkedHashMap<>();

        if (movieIds == null || movieIds.isEmpty()) {
            return statusByMovieId;
        }

        List<String> normalizedIds = movieIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .collect(Collectors.toList());

        normalizedIds.forEach(id -> statusByMovieId.put(id, false));

        if (normalizedIds.isEmpty()) {
            return statusByMovieId;
        }

        Long userId = getUserIdByEmail(email);
        List<FavoriteMovie> favorites = favoriteRepository.findByUserIdAndMovieIdInAndFavorite(userId, normalizedIds, true);
        favorites.forEach(favorite -> statusByMovieId.put(favorite.getMovieId(), true));

        return statusByMovieId;
    }
}