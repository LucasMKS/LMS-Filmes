package com.lucasm.lmsrating.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.RatingMovie;

@Repository
public interface MovieRepository extends JpaRepository<RatingMovie, Long> {

    Page<RatingMovie> findAllByUserId(Long userId, Pageable pageable);

    // SOLUÇÃO: Busca o título fazendo um JOIN direto no banco de dados
    @Query(value = "SELECT r.* FROM ratings_movies r JOIN movies m ON r.movie_id = m.movie_id WHERE r.user_id = :userId AND LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%'))", nativeQuery = true)
    Page<RatingMovie> findByUserIdAndTitleContainingIgnoreCase(@Param("userId") Long userId, @Param("title") String title, Pageable pageable);

    Optional<RatingMovie> findByMovieIdAndUserId(String movieId, Long userId);

    List<RatingMovie> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    // Consulta JPQL para buscar por faixa de notas
    @Query("SELECT r FROM RatingMovie r WHERE r.userId = :userId AND r.rating BETWEEN :minRating AND :maxRating")
    Page<RatingMovie> findByUserIdAndRatingRange(@Param("userId") Long userId, @Param("minRating") double minRating, @Param("maxRating") double maxRating, Pageable pageable);
}