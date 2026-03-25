package com.lucasm.lmsfavorite.service;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import com.lucasm.lmsfavorite.model.WatchlistSerie;
import com.lucasm.lmsfavorite.repository.WatchlistMovieRepository;
import com.lucasm.lmsfavorite.repository.WatchlistSerieRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class WatchlistService {

    private final WatchlistMovieRepository movieRepo;
    private final WatchlistSerieRepository serieRepo;
    private final JdbcTemplate jdbcTemplate;

    public WatchlistService(WatchlistMovieRepository movieRepo, WatchlistSerieRepository serieRepo, JdbcTemplate jdbcTemplate) {
        this.movieRepo = movieRepo;
        this.serieRepo = serieRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    private Long getUserIdByEmail(String email) {
        String sql = "SELECT id FROM users WHERE email = ?";
        return jdbcTemplate.queryForObject(sql, Long.class, email);
    }

    @Cacheable(value = "userWatchlistMovies", key = "#email")
    public List<WatchlistMovie> getUserWatchlistMovies(String email) {
        Long userId = getUserIdByEmail(email);
        return movieRepo.findByUserIdOrderByAddedAtDesc(userId);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userWatchlistMovies", key = "#email"),
        @CacheEvict(value = "userWatchlistMovieStatus", key = "#email + '_' + #movieId")
    })
    public Map<String, Boolean> toggleMovieInWatchlist(String movieId, String email) {
        Long userId = getUserIdByEmail(email);
        boolean exists = movieRepo.existsByUserIdAndMovieId(userId, movieId);

        if (exists) {
            movieRepo.deleteByUserIdAndMovieId(userId, movieId);
            return Map.of("inWatchlist", false);
        } else {
            WatchlistMovie wlMovie = new WatchlistMovie();
            wlMovie.setUserId(userId);
            wlMovie.setMovieId(movieId);
            
            // rabbitMQProducer.sendMovieCatalogSync(movieId);
            
            movieRepo.save(wlMovie);
            return Map.of("inWatchlist", true);
        }
    }

    @Cacheable(value = "userWatchlistMovieStatus", key = "#email + '_' + #movieId")
    public Map<String, Boolean> checkMovieStatus(String movieId, String email) {
        Long userId = getUserIdByEmail(email);
        boolean exists = movieRepo.existsByUserIdAndMovieId(userId, movieId);
        return Map.of("inWatchlist", exists);
    }

    @Cacheable(value = "userWatchlistSeries", key = "#email")
    public List<WatchlistSerie> getUserWatchlistSeries(String email) {
        Long userId = getUserIdByEmail(email);
        return serieRepo.findByUserIdOrderByAddedAtDesc(userId);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userWatchlistSeries", key = "#email"),
        @CacheEvict(value = "userWatchlistSerieStatus", key = "#email + '_' + #serieId")
    })
    public Map<String, Boolean> toggleSerieInWatchlist(String serieId, String email) {
        Long userId = getUserIdByEmail(email);
        boolean exists = serieRepo.existsByUserIdAndSerieId(userId, serieId);

        if (exists) {
            serieRepo.deleteByUserIdAndSerieId(userId, serieId);
            return Map.of("inWatchlist", false);
        } else {
            WatchlistSerie wlSerie = new WatchlistSerie();
            wlSerie.setUserId(userId);
            wlSerie.setSerieId(serieId);
            
            // rabbitMQProducer.sendSerieCatalogSync(serieId);
            
            serieRepo.save(wlSerie);
            return Map.of("inWatchlist", true);
        }
    }

    @Cacheable(value = "userWatchlistSerieStatus", key = "#email + '_' + #serieId")
    public Map<String, Boolean> checkSerieStatus(String serieId, String email) {
        Long userId = getUserIdByEmail(email);
        boolean exists = serieRepo.existsByUserIdAndSerieId(userId, serieId);
        return Map.of("inWatchlist", exists);
    }
}