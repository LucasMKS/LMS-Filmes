package com.lucasm.lmsfavorite.service;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import com.lucasm.lmsfavorite.model.WatchlistSerie;
import com.lucasm.lmsfavorite.repository.WatchlistMovieRepository;
import com.lucasm.lmsfavorite.repository.WatchlistSerieRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class WatchlistService {

    private final WatchlistMovieRepository movieRepo;
    private final WatchlistSerieRepository serieRepo;

    public WatchlistService(WatchlistMovieRepository movieRepo, WatchlistSerieRepository serieRepo) {
        this.movieRepo = movieRepo;
        this.serieRepo = serieRepo;
    }

    @Cacheable(value = "userWatchlistMovies", key = "#email")
    public List<WatchlistMovie> getUserWatchlistMovies(String email) {
        return movieRepo.findByEmailOrderByAddedAtDesc(email);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userWatchlistMovies", key = "#email"),
        @CacheEvict(value = "userWatchlistMovieStatus", key = "#email + '_' + #movieId")
    })
    public Map<String, Boolean> toggleMovieInWatchlist(String movieId, String email) {
        boolean exists = movieRepo.existsByEmailAndMovieId(email, movieId);

        if (exists) {
            movieRepo.deleteByEmailAndMovieId(email, movieId);
            return Map.of("inWatchlist", false);
        } else {
            WatchlistMovie wlMovie = new WatchlistMovie();
            wlMovie.setEmail(email);
            wlMovie.setMovieId(movieId);
            movieRepo.save(wlMovie);
            return Map.of("inWatchlist", true);
        }
    }

    @Cacheable(value = "userWatchlistMovieStatus", key = "#email + '_' + #movieId")
    public Map<String, Boolean> checkMovieStatus(String movieId, String email) {
        boolean exists = movieRepo.existsByEmailAndMovieId(email, movieId);
        return Map.of("inWatchlist", exists);
    }

    @Cacheable(value = "userWatchlistSeries", key = "#email")
    public List<WatchlistSerie> getUserWatchlistSeries(String email) {
        return serieRepo.findByEmailOrderByAddedAtDesc(email);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userWatchlistSeries", key = "#email"),
        @CacheEvict(value = "userWatchlistSerieStatus", key = "#email + '_' + #serieId")
    })
    public Map<String, Boolean> toggleSerieInWatchlist(String serieId, String email) {
        boolean exists = serieRepo.existsByEmailAndSerieId(email, serieId);

        if (exists) {
            serieRepo.deleteByEmailAndSerieId(email, serieId);
            return Map.of("inWatchlist", false);
        } else {
            WatchlistSerie wlSerie = new WatchlistSerie();
            wlSerie.setEmail(email);
            wlSerie.setSerieId(serieId);
            serieRepo.save(wlSerie);
            return Map.of("inWatchlist", true);
        }
    }

    @Cacheable(value = "userWatchlistSerieStatus", key = "#email + '_' + #serieId")
    public Map<String, Boolean> checkSerieStatus(String serieId, String email) {
        boolean exists = serieRepo.existsByEmailAndSerieId(email, serieId);
        return Map.of("inWatchlist", exists);
    }
}