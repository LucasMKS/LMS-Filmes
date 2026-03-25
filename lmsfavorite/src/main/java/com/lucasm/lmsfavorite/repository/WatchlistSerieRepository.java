package com.lucasm.lmsfavorite.repository;

import com.lucasm.lmsfavorite.model.WatchlistSerie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistSerieRepository extends JpaRepository<WatchlistSerie, Long> {

    List<WatchlistSerie> findByUserIdOrderByAddedAtDesc(Long userId);

    Optional<WatchlistSerie> findByUserIdAndSerieId(Long userId, String serieId);

    boolean existsByUserIdAndSerieId(Long userId, String serieId);

    void deleteByUserIdAndSerieId(Long userId, String serieId);
}