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

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementa regras de negócio para favoritos de filmes por usuário.
 */
@Service
public class FavoriteMovieService {

    private final FavoriteMovieRepository favoriteRepository;

    /**
     * Cria o serviço com acesso ao repositório de favoritos de filmes.
     *
     * @param favoriteRepository repositório de persistência de favoritos de filmes.
     */
    public FavoriteMovieService(FavoriteMovieRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    /**
         * Alterna o estado de favorito de um filme para um usuário.
     *
         * @param movieId identificador do filme.
         * @param email e-mail do usuário autenticado.
         * @return `true` se o filme ficar favoritado após a operação; caso contrário, `false`.
     */
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

    /**
     * Verifica se um filme está marcado como favorito por um usuário.
     *
     * @param movieId identificador do filme.
     * @param email e-mail do usuário autenticado.
     * @return `true` quando estiver favoritado; caso contrário, `false`.
     */
    @Cacheable(value = "userFavoriteMovieStatus", key = "#email + '_' + #movieId")
    public boolean isFavoriteMovie(String movieId, String email) {
        Optional<FavoriteMovie> optionalFavorite = favoriteRepository.findByMovieIdAndEmail(movieId, email);
        boolean result = optionalFavorite.map(FavoriteMovie::isFavorite).orElse(false);

        return result;
    }

    /**
     * Lista todos os filmes favoritados de um usuário.
     *
     * @param email e-mail do usuário autenticado.
     * @return lista de filmes favoritados.
     */
    @Cacheable(value = "userFavoriteMovies", key = "#email")
    public List<FavoriteMovie> getAllFavoritesMovies(String email) {
        List<FavoriteMovie> allFavorites = favoriteRepository.findByEmailAndFavorite(email, true);

        return allFavorites;
    }

    /**
     * Consulta por lote o status de favoritos de filmes para um usuário.
     *
     * @param movieIds identificadores de filmes a consultar.
     * @param email e-mail do usuário autenticado.
     * @return mapa `movieId -> isFavorite` para todos os IDs recebidos.
     */
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

        List<FavoriteMovie> favorites = favoriteRepository.findByEmailAndMovieIdInAndFavorite(email, normalizedIds, true);
        favorites.forEach(favorite -> statusByMovieId.put(favorite.getMovieId(), true));

        return statusByMovieId;
    }
}