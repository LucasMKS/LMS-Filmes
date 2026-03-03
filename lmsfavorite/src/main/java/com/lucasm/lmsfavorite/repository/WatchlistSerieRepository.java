package com.lucasm.lmsfavorite.repository;

import com.lucasm.lmsfavorite.model.WatchlistSerie;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
/**
 * Repositório de acesso a dados para watchlist de séries.
 */

public interface WatchlistSerieRepository extends MongoRepository<WatchlistSerie, String> {
    /**
     * Lista as séries da watchlist de um usuário ordenadas por data de adição.
     *
     * @param email e-mail do usuário.
     * @return lista de séries da watchlist.
     */
    List<WatchlistSerie> findByEmailOrderByAddedAtDesc(String email);
    /**
     * Busca um item específico de watchlist de séries por usuário e série.
     *
     * @param email e-mail do usuário.
     * @param serieId identificador da série.
     * @return item encontrado, quando existir.
     */
    Optional<WatchlistSerie> findByEmailAndSerieId(String email, String serieId);
    /**
     * Verifica se uma série já está presente na watchlist do usuário.
     *
     * @param email e-mail do usuário.
     * @param serieId identificador da série.
     * @return `true` quando existir na watchlist; caso contrário, `false`.
     */
    boolean existsByEmailAndSerieId(String email, String serieId);
    /**
     * Remove uma série da watchlist de um usuário.
     *
     * @param email e-mail do usuário.
     * @param serieId identificador da série.
     */
    void deleteByEmailAndSerieId(String email, String serieId);
}