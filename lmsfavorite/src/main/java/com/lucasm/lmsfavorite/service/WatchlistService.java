package com.lucasm.lmsfavorite.service;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import com.lucasm.lmsfavorite.model.WatchlistSerie;
import com.lucasm.lmsfavorite.model.WatchlistStatus;
import com.lucasm.lmsfavorite.repository.WatchlistMovieRepository;
import com.lucasm.lmsfavorite.repository.WatchlistSerieRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class WatchlistService {

    private final WatchlistMovieRepository movieRepo;
    private final WatchlistSerieRepository serieRepo;
    private final UserLookupService userLookupService;

    public WatchlistService(WatchlistMovieRepository movieRepo, WatchlistSerieRepository serieRepo, UserLookupService userLookupService) {
        this.movieRepo = movieRepo;
        this.serieRepo = serieRepo;
        this.userLookupService = userLookupService;
    }

    @Cacheable(value = "userWatchlistMovies", key = "#email")
    public List<WatchlistMovie> getUserWatchlistMovies(String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return movieRepo.findByUserIdOrderByAddedAtDesc(userId);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userWatchlistMovies", key = "#email"),
        @CacheEvict(value = "userWatchlistMovieStatus", key = "#email + '_' + #movieId")
    })
    public Map<String, Object> toggleMovieInWatchlist(String movieId, String email, WatchlistStatus status) {
        Long userId = userLookupService.getUserIdByEmail(email);

        Optional<WatchlistMovie> existing = movieRepo.findByUserIdAndMovieId(userId, movieId);
        if (existing.isPresent()) {
            movieRepo.delete(existing.get());
            Map<String, Object> result = new HashMap<>();
            result.put("inWatchlist", false);
            return result;
        }

        WatchlistMovie wlMovie = new WatchlistMovie();
        wlMovie.setUserId(userId);
        wlMovie.setMovieId(movieId);
        wlMovie.setStatus(status != null ? status : WatchlistStatus.PLAN_TO_WATCH);
        movieRepo.save(wlMovie);
        Map<String, Object> result = new HashMap<>();
        result.put("inWatchlist", true);
        result.put("status", wlMovie.getStatus());
        return result;
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userWatchlistMovies", key = "#email"),
        @CacheEvict(value = "userWatchlistMovieStatus", key = "#email + '_' + #movieId")
    })
    public Map<String, Object> updateMovieStatus(String movieId, String email, WatchlistStatus status) {
        Long userId = userLookupService.getUserIdByEmail(email);
        WatchlistMovie wlMovie = movieRepo.findByUserIdAndMovieId(userId, movieId)
                .orElseGet(() -> {
                    WatchlistMovie movie = new WatchlistMovie();
                    movie.setUserId(userId);
                    movie.setMovieId(movieId);
                    return movie;
                });
        wlMovie.setStatus(status);
        movieRepo.save(wlMovie);
        Map<String, Object> result = new HashMap<>();
        result.put("inWatchlist", true);
        result.put("status", wlMovie.getStatus());
        return result;
    }

    @Cacheable(value = "userWatchlistMovieStatus", key = "#email + '_' + #movieId")
    public Map<String, Object> checkMovieStatus(String movieId, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        Optional<WatchlistMovie> movie = movieRepo.findByUserIdAndMovieId(userId, movieId);
        Map<String, Object> result = new HashMap<>();
        result.put("inWatchlist", movie.isPresent());
        movie.ifPresent(m -> result.put("status", m.getStatus()));
        return result;
    }

    public Map<String, Object> getMovieWatchlistStatusBatch(List<String> movieIds, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        Map<String, Object> results = new HashMap<>();
        for (String movieId : movieIds) {
            Optional<WatchlistMovie> movie = movieRepo.findByUserIdAndMovieId(userId, movieId);
            if (movie.isPresent()) {
                Map<String, Object> statusMap = new HashMap<>();
                statusMap.put("inWatchlist", true);
                statusMap.put("status", movie.get().getStatus());
                results.put(movieId, statusMap);
            } else {
                results.put(movieId, Map.of("inWatchlist", false));
            }
        }
        return results;
    }

    @Cacheable(value = "userWatchlistSeries", key = "#email")
    public List<WatchlistSerie> getUserWatchlistSeries(String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return serieRepo.findByUserIdOrderByAddedAtDesc(userId);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userWatchlistSeries", key = "#email"),
        @CacheEvict(value = "userWatchlistSerieStatus", key = "#email + '_' + #serieId")
    })
    public Map<String, Object> toggleSerieInWatchlist(String serieId, String email, WatchlistStatus status) {
        Long userId = userLookupService.getUserIdByEmail(email);

        Optional<WatchlistSerie> existing = serieRepo.findByUserIdAndSerieId(userId, serieId);
        if (existing.isPresent()) {
            serieRepo.delete(existing.get());
            Map<String, Object> result = new HashMap<>();
            result.put("inWatchlist", false);
            return result;
        }

        WatchlistSerie wlSerie = new WatchlistSerie();
        wlSerie.setUserId(userId);
        wlSerie.setSerieId(serieId);
        wlSerie.setStatus(status != null ? status : WatchlistStatus.PLAN_TO_WATCH);
        serieRepo.save(wlSerie);
        Map<String, Object> result = new HashMap<>();
        result.put("inWatchlist", true);
        result.put("status", wlSerie.getStatus());
        return result;
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userWatchlistSeries", key = "#email"),
        @CacheEvict(value = "userWatchlistSerieStatus", key = "#email + '_' + #serieId")
    })
    public Map<String, Object> updateSerieStatus(String serieId, String email, WatchlistStatus status) {
        Long userId = userLookupService.getUserIdByEmail(email);
        WatchlistSerie wlSerie = serieRepo.findByUserIdAndSerieId(userId, serieId)
                .orElseGet(() -> {
                    WatchlistSerie serie = new WatchlistSerie();
                    serie.setUserId(userId);
                    serie.setSerieId(serieId);
                    return serie;
                });
        wlSerie.setStatus(status);
        serieRepo.save(wlSerie);
        Map<String, Object> result = new HashMap<>();
        result.put("inWatchlist", true);
        result.put("status", wlSerie.getStatus());
        return result;
    }

    @Cacheable(value = "userWatchlistSerieStatus", key = "#email + '_' + #serieId")
    public Map<String, Object> checkSerieStatus(String serieId, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        Optional<WatchlistSerie> serie = serieRepo.findByUserIdAndSerieId(userId, serieId);
        Map<String, Object> result = new HashMap<>();
        result.put("inWatchlist", serie.isPresent());
        serie.ifPresent(s -> result.put("status", s.getStatus()));
        return result;
    }

    public Map<String, Object> getSerieWatchlistStatusBatch(List<String> serieIds, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        Map<String, Object> results = new HashMap<>();
        for (String serieId : serieIds) {
            Optional<WatchlistSerie> serie = serieRepo.findByUserIdAndSerieId(userId, serieId);
            if (serie.isPresent()) {
                Map<String, Object> statusMap = new HashMap<>();
                statusMap.put("inWatchlist", true);
                statusMap.put("status", serie.get().getStatus());
                results.put(serieId, statusMap);
            } else {
                results.put(serieId, Map.of("inWatchlist", false));
            }
        }
        return results;
    }
}
