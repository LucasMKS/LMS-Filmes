package com.lucasm.lmsfavorite.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.lucasm.lmsfavorite.model.FavoriteMovie;
import com.lucasm.lmsfavorite.repository.FavoriteMovieRepository;

@Service
public class FavoriteMovieService {

    private static final Logger logger = LoggerFactory.getLogger(FavoriteMovieService.class);

    private final FavoriteMovieRepository favoriteRepository;

    public FavoriteMovieService(FavoriteMovieRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    @CacheEvict(value = {"userFavoriteMovies", "userFavoriteMovieStatus"}, allEntries = true)
    public void toggleFavoriteMovie(String movieId, String email) {
        Optional<FavoriteMovie> optionalFavorite = favoriteRepository.findByMovieIdAndEmail(movieId, email);
        FavoriteMovie favoriteMovie = optionalFavorite.orElseGet(() -> new FavoriteMovie());
        favoriteMovie.setMovieId(movieId);
        favoriteMovie.setEmail(email);
        favoriteMovie.setFavorite(!favoriteMovie.isFavorite());
        favoriteRepository.save(favoriteMovie);
        logger.info("Filme {} favorito atualizado para {} pelo usuário {}", movieId, favoriteMovie.isFavorite(), email);
    }

    @Cacheable(value = "userFavoriteMovieStatus", key = "#email + '_' + #movieId")
    public boolean isFavoriteMovie(String movieId, String email) {
        Optional<FavoriteMovie> optionalFavorite = favoriteRepository.findByMovieIdAndEmail(movieId, email);
        boolean result = optionalFavorite.map(FavoriteMovie::isFavorite).orElse(false);

        logger.debug("Resultado do favorite: {}", result);
        return result;
    }

    @Cacheable(value = "userFavoriteMovies", key = "#email")
    public List<FavoriteMovie> getAllFavoritesMovies(String email) {
        List<FavoriteMovie> allFavorites = favoriteRepository.findAllByEmail(email)
                .stream()
                .filter(FavoriteMovie::isFavorite)
                .collect(Collectors.toList());
        
        return allFavorites;
    }
}
