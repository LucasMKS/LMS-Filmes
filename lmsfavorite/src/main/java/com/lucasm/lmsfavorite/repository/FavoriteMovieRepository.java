package com.lucasm.lmsfavorite.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lucasm.lmsfavorite.model.FavoriteMovie;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteMovieRepository extends JpaRepository<FavoriteMovie, Long> {

    List<FavoriteMovie> findByUserIdAndFavorite(Long userId, boolean favorite);

    Optional<FavoriteMovie> findByMovieIdAndUserId(String movieId, Long userId);

    List<FavoriteMovie> findByUserIdAndMovieIdInAndFavorite(Long userId, List<String> movieIds, boolean favorite);
}