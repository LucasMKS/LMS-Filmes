package com.lucasm.lmsfavorite.service;

import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.lucasm.lmsfavorite.model.FavoriteMovie;
import com.lucasm.lmsfavorite.repository.FavoriteMovieRepository;

@Service
public class FavoriteMovieService {

    private final FavoriteMovieRepository favoriteRepository;

    public FavoriteMovieService(FavoriteMovieRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    @Caching(evict = {
            @CacheEvict(value = "userFavoriteMovies", key = "#email")
    }, put = {
            @CachePut(value = "userFavoriteMovieStatus", key = "#email + '_' + #movieId")
    })
    public boolean toggleFavoriteMovie(String movieId, String email) {
        Optional<FavoriteMovie> optionalFavorite = favoriteRepository.findByMovieIdAndEmail(movieId, email);

        FavoriteMovie favoriteMovie = optionalFavorite.orElseGet(() -> {
            FavoriteMovie newMovie = new FavoriteMovie();
            newMovie.setMovieId(movieId);
            newMovie.setEmail(email);
            newMovie.setFavorite(false);
            return newMovie;
        });

        favoriteMovie.setFavorite(!favoriteMovie.isFavorite());

        favoriteRepository.save(favoriteMovie);

        return favoriteMovie.isFavorite();
    }

    @Cacheable(value = "userFavoriteMovieStatus", key = "#email + '_' + #movieId")
    public boolean isFavoriteMovie(String movieId, String email) {
        Optional<FavoriteMovie> optionalFavorite = favoriteRepository.findByMovieIdAndEmail(movieId, email);
        boolean result = optionalFavorite.map(FavoriteMovie::isFavorite).orElse(false);

        return result;
    }

    @Cacheable(value = "userFavoriteMovies", key = "#email")
    public List<FavoriteMovie> getAllFavoritesMovies(String email) {
        List<FavoriteMovie> allFavorites = favoriteRepository.findByEmailAndFavorite(email, true);

        return allFavorites;
    }
}