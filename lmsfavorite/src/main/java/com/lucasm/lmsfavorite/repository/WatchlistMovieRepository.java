package com.lucasm.lmsfavorite.repository;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistMovieRepository extends JpaRepository<WatchlistMovie, Long> {

    List<WatchlistMovie> findByUserIdOrderByAddedAtDesc(Long userId);

    Optional<WatchlistMovie> findByUserIdAndMovieId(Long userId, String movieId);

    boolean existsByUserIdAndMovieId(Long userId, String movieId);

    void deleteByUserIdAndMovieId(Long userId, String movieId);
}