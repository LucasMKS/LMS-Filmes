package com.lucasm.lmsfavorite.repository;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
/**
 * Repositório de acesso a dados para watchlist de filmes.
 */

public interface WatchlistMovieRepository extends MongoRepository<WatchlistMovie, String> {
    /**
     * Lista os filmes da watchlist de um usuário ordenados por data de adição.
     *
     * @param email e-mail do usuário.
     * @return lista de filmes da watchlist.
     */
    List<WatchlistMovie> findByEmailOrderByAddedAtDesc(String email);
    /**
     * Busca um item específico de watchlist de filmes por usuário e filme.
     *
     * @param email e-mail do usuário.
     * @param movieId identificador do filme.
     * @return item encontrado, quando existir.
     */
    Optional<WatchlistMovie> findByEmailAndMovieId(String email, String movieId);
    /**
     * Verifica se um filme já está presente na watchlist do usuário.
     *
     * @param email e-mail do usuário.
     * @param movieId identificador do filme.
     * @return `true` quando existir na watchlist; caso contrário, `false`.
     */
    boolean existsByEmailAndMovieId(String email, String movieId);
    /**
     * Remove um filme da watchlist de um usuário.
     *
     * @param email e-mail do usuário.
     * @param movieId identificador do filme.
     */
    void deleteByEmailAndMovieId(String email, String movieId);
}