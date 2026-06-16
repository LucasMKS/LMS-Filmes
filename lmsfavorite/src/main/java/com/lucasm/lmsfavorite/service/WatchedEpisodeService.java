package com.lucasm.lmsfavorite.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.lucasm.lmsfavorite.model.WatchedEpisode;
import com.lucasm.lmsfavorite.repository.WatchedEpisodeRepository;

@Service
public class WatchedEpisodeService {

    private final WatchedEpisodeRepository watchedEpisodeRepository;
    private final UserLookupService userLookupService;

    public WatchedEpisodeService(WatchedEpisodeRepository watchedEpisodeRepository, UserLookupService userLookupService) {
        this.watchedEpisodeRepository = watchedEpisodeRepository;
        this.userLookupService = userLookupService;
    }

    @Transactional
    public WatchedEpisode markAsWatched(String serieId, int seasonNumber, int episodeNumber, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);

        return watchedEpisodeRepository.findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            userId, serieId, seasonNumber, episodeNumber)
            .orElseGet(() -> {
                WatchedEpisode watched = new WatchedEpisode();
                watched.setUserId(userId);
                watched.setSerieId(serieId);
                watched.setSeasonNumber(seasonNumber);
                watched.setEpisodeNumber(episodeNumber);
                return watchedEpisodeRepository.save(watched);
            });
    }

    @Transactional
    public void unmarkAsWatched(String serieId, int seasonNumber, int episodeNumber, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        watchedEpisodeRepository.deleteByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
            userId, serieId, seasonNumber, episodeNumber);
    }

    public List<WatchedEpisode> getWatchedEpisodesBySerie(String serieId, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return watchedEpisodeRepository.findByUserIdAndSerieIdOrderBySeasonNumberAscEpisodeNumberAsc(userId, serieId);
    }
}
