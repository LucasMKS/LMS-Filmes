package com.lucasm.lmsrating.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.RatingEpisode;

@Repository
public interface EpisodeRepository extends JpaRepository<RatingEpisode, Long> {

    Optional<RatingEpisode> findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
        Long userId, String serieId, int seasonNumber, int episodeNumber);

    List<RatingEpisode> findByUserIdAndSerieIdOrderBySeasonNumberAscEpisodeNumberAsc(
        Long userId, String serieId);
}
