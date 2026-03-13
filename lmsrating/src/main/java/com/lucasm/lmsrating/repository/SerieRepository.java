package com.lucasm.lmsrating.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.Series;

/**
 * Repositório de acesso a dados para avaliações de séries.
 */
@Repository
public interface SerieRepository extends MongoRepository<Series, String>  {

    /**
     * Lista avaliações de séries de um usuário com paginação.
     *
     * @param email e-mail do usuário.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações de séries.
     */
    Page<Series> findAllByEmail(String email, Pageable pageable);

    /**
     * Busca avaliações de séries por termo de título (case-insensitive) com paginação.
     *
     * @param email e-mail do usuário.
     * @param title termo de busca no título.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações filtradas.
     */
    Page<Series> findByEmailAndTitleContainingIgnoreCase(String email, String title, Pageable pageable);

    /**
     * Busca a avaliação de uma série específica para um usuário.
     *
     * @param serieId identificador da série.
     * @param email e-mail do usuário.
     * @return avaliação encontrada, quando existir.
     */
    Optional<Series> findBySerieIdAndEmail(String serieId, String email);

    /**
     * Lista avaliações de séries de um usuário ordenadas da mais recente para a mais antiga.
     *
     * @param email e-mail do usuário.
     * @return lista de avaliações ordenadas por criação.
     */
    List<Series> findAllByEmailOrderByCreatedAtDesc(String email);

    /**
     * Busca avaliações de séries de um usuário filtrando por uma faixa exata de notas.
     * @param email e-mail do usuário.
     * @param minRating nota mínima (inclusiva >=).
     * @param maxRating nota máxima (inclusiva <=).
     * @param pageable parâmetros de paginação.
     * @return página de avaliações.
     */
    @Query("{ 'email': ?0, 'rating': { $gte: ?1, $lte: ?2 } }")
    Page<Series> findByEmailAndRatingRange(String email, double minRating, double maxRating, Pageable pageable);
}
