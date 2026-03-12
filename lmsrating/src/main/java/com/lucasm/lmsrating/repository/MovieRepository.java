package com.lucasm.lmsrating.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.Movies;

/**
 * Repositório de acesso a dados para avaliações de filmes.
 */
@Repository
public interface MovieRepository extends MongoRepository<Movies, String> {

    /**
     * Lista avaliações de filmes de um usuário com paginação.
     *
     * @param email e-mail do usuário.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações de filmes.
     */
    Page<Movies> findAllByEmail(String email, Pageable pageable);

    /**
     * Busca avaliações de filmes por termo de título (case-insensitive) com paginação.
     *
     * @param email e-mail do usuário.
     * @param title termo de busca no título.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações filtradas.
     */
    Page<Movies> findByEmailAndTitleContainingIgnoreCase(String email, String title, Pageable pageable);

    /**
     * Busca a avaliação de um filme específico para um usuário.
     *
     * @param movieId identificador do filme.
     * @param email e-mail do usuário.
     * @return avaliação encontrada, quando existir.
     */
    Optional<Movies> findByMovieIdAndEmail(String movieId, String email);

    /**
     * Lista avaliações de filmes de um usuário ordenadas da mais recente para a mais antiga.
     *
     * @param email e-mail do usuário.
     * @return lista de avaliações ordenadas por criação.
     */
    List<Movies> findAllByEmailOrderByCreatedAtDesc(String email);

    /**
     * Busca avaliações de filmes de um usuário filtrando por uma faixa exata de notas.
     * @param email e-mail do usuário.
     * @param minRating nota mínima (inclusiva >=).
     * @param maxRating nota máxima (inclusiva <=).
     * @param pageable parâmetros de paginação.
     * @return página de avaliações.
     */
    Page<Movies> findByEmailAndRatingGreaterThanEqualAndRatingLessThanEqualOrderByCreatedAtDesc(String email, double minRating, double maxRating, Pageable pageable);
}
