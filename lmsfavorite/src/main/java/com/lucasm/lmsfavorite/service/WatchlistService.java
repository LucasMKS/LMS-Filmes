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

/**
 * Implementa regras de negócio da watchlist de filmes e séries por usuário.
 */
@Service
public class WatchlistService {

    private final WatchlistMovieRepository movieRepo;
    private final WatchlistSerieRepository serieRepo;

    /**
     * Cria o serviço com os repositórios de watchlist.
     *
     * @param movieRepo repositório da watchlist de filmes.
     * @param serieRepo repositório da watchlist de séries.
     */
    public WatchlistService(WatchlistMovieRepository movieRepo, WatchlistSerieRepository serieRepo) {
        this.movieRepo = movieRepo;
        this.serieRepo = serieRepo;
    }

    /**
     * Lista os filmes presentes na watchlist do usuário.
     *
     * @param email e-mail do usuário autenticado.
     * @return lista de filmes ordenada pela data de adição.
     */
    @Cacheable(value = "userWatchlistMovies", key = "#email")
    public List<WatchlistMovie> getUserWatchlistMovies(String email) {
        return movieRepo.findByEmailOrderByAddedAtDesc(email);
    }

    /**
     * Adiciona ou remove um filme da watchlist do usuário.
     *
     * @param movieId identificador do filme.
     * @param email e-mail do usuário autenticado.
     * @return mapa contendo o status final de presença na watchlist.
     */
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

    /**
     * Verifica se um filme está presente na watchlist do usuário.
     *
     * @param movieId identificador do filme.
     * @param email e-mail do usuário autenticado.
     * @return mapa contendo o status de presença na watchlist.
     */
    @Cacheable(value = "userWatchlistMovieStatus", key = "#email + '_' + #movieId")
    public Map<String, Boolean> checkMovieStatus(String movieId, String email) {
        boolean exists = movieRepo.existsByEmailAndMovieId(email, movieId);
        return Map.of("inWatchlist", exists);
    }

    /**
     * Lista as séries presentes na watchlist do usuário.
     *
     * @param email e-mail do usuário autenticado.
     * @return lista de séries ordenada pela data de adição.
     */
    @Cacheable(value = "userWatchlistSeries", key = "#email")
    public List<WatchlistSerie> getUserWatchlistSeries(String email) {
        return serieRepo.findByEmailOrderByAddedAtDesc(email);
    }

    /**
     * Adiciona ou remove uma série da watchlist do usuário.
     *
     * @param serieId identificador da série.
     * @param email e-mail do usuário autenticado.
     * @return mapa contendo o status final de presença na watchlist.
     */
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

    /**
     * Verifica se uma série está presente na watchlist do usuário.
     *
     * @param serieId identificador da série.
     * @param email e-mail do usuário autenticado.
     * @return mapa contendo o status de presença na watchlist.
     */
    @Cacheable(value = "userWatchlistSerieStatus", key = "#email + '_' + #serieId")
    public Map<String, Boolean> checkSerieStatus(String serieId, String email) {
        boolean exists = serieRepo.existsByEmailAndSerieId(email, serieId);
        return Map.of("inWatchlist", exists);
    }
}