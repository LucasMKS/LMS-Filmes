package com.lucasm.lmsfavorite.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lucasm.lmsfavorite.model.FavoriteSerie;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteSerieRepository extends JpaRepository<FavoriteSerie, Long> {

    List<FavoriteSerie> findAllByUserId(Long userId);

    Optional<FavoriteSerie> findBySerieIdAndUserId(String serieId, Long userId);

    List<FavoriteSerie> findByUserIdAndFavorite(Long userId, boolean favorite);

    List<FavoriteSerie> findByUserIdAndSerieIdInAndFavorite(Long userId, List<String> serieIds, boolean favorite);
}