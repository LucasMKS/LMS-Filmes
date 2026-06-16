package com.lucasm.lmsfavorite.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lucasm.lmsfavorite.model.WatchedEpisode;

@Repository
public interface WatchedEpisodeRepository extends JpaRepository<WatchedEpisode, Long> {
    
    Optional<WatchedEpisode> findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
        Long userId, String serieId, int seasonNumber, int episodeNumber);

    List<WatchedEpisode> findByUserIdAndSerieIdOrderBySeasonNumberAscEpisodeNumberAsc(
        Long userId, String serieId);

    void deleteByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
        Long userId, String serieId, int seasonNumber, int episodeNumber);
}
