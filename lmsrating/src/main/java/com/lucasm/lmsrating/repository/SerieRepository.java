package com.lucasm.lmsrating.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.RatingSerie;

@Repository
public interface SerieRepository extends JpaRepository<RatingSerie, Long>  {

    Page<RatingSerie> findAllByUserId(Long userId, Pageable pageable);

    @Query(value = "SELECT r.* FROM ratings_series r JOIN series s ON r.serie_id = s.serie_id WHERE r.user_id = :userId AND LOWER(s.title) LIKE LOWER(CONCAT('%', :title, '%'))",
           countQuery = "SELECT COUNT(r.id) FROM ratings_series r JOIN series s ON r.serie_id = s.serie_id WHERE r.user_id = :userId AND LOWER(s.title) LIKE LOWER(CONCAT('%', :title, '%'))",
           nativeQuery = true)
    Page<RatingSerie> findByUserIdAndTitleContainingIgnoreCase(@Param("userId") Long userId, @Param("title") String title, Pageable pageable);

    @Query(value = "SELECT r.* FROM ratings_series r JOIN series s ON r.serie_id = s.serie_id WHERE r.user_id = :userId AND LOWER(s.title) LIKE LOWER(CONCAT('%', :title, '%')) AND r.rating BETWEEN :minRating AND :maxRating",
           countQuery = "SELECT COUNT(r.id) FROM ratings_series r JOIN series s ON r.serie_id = s.serie_id WHERE r.user_id = :userId AND LOWER(s.title) LIKE LOWER(CONCAT('%', :title, '%')) AND r.rating BETWEEN :minRating AND :maxRating",
           nativeQuery = true)
    Page<RatingSerie> findByUserIdAndTitleAndRatingRange(@Param("userId") Long userId, @Param("title") String title, @Param("minRating") double minRating, @Param("maxRating") double maxRating, Pageable pageable);

    Optional<RatingSerie> findBySerieIdAndUserId(String serieId, Long userId);

    List<RatingSerie> findByUserIdAndSerieIdIn(Long userId, List<String> serieIds);

    List<RatingSerie> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    // Consulta JPQL para buscar por faixa de notas
    @Query("SELECT r FROM RatingSerie r WHERE r.userId = :userId AND r.rating BETWEEN :minRating AND :maxRating")
    Page<RatingSerie> findByUserIdAndRatingRange(@Param("userId") Long userId, @Param("minRating") double minRating, @Param("maxRating") double maxRating, Pageable pageable);
}