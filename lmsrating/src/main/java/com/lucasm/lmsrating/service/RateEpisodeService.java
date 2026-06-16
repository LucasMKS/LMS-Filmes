package com.lucasm.lmsrating.service;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lucasm.lmsrating.dto.EpisodeRatingRequestDTO;
import com.lucasm.lmsrating.exceptions.MovieServiceException;
import com.lucasm.lmsrating.model.RatingEpisode;
import com.lucasm.lmsrating.repository.EpisodeRepository;

@Service
public class RateEpisodeService {

    private static final Logger logger = LoggerFactory.getLogger(RateEpisodeService.class);

    private final EpisodeRepository episodeRepository;
    private final UserLookupService userLookupService;

    public RateEpisodeService(EpisodeRepository episodeRepository, UserLookupService userLookupService) {
        this.episodeRepository = episodeRepository;
        this.userLookupService = userLookupService;
    }

    @Transactional
    public RatingEpisode rateEpisode(EpisodeRatingRequestDTO request, String email) {
        try {
            Long userId = userLookupService.getUserIdByEmail(email);

            RatingEpisode episode = episodeRepository.findByUserIdAndSerieIdAndSeasonNumberAndEpisodeNumber(
                userId, request.getSerieId(), request.getSeasonNumber(), request.getEpisodeNumber())
                .orElse(new RatingEpisode());

            episode.setUserId(userId);
            episode.setSerieId(request.getSerieId());
            episode.setSeasonNumber(request.getSeasonNumber());
            episode.setEpisodeNumber(request.getEpisodeNumber());
            episode.setRating(request.getRating());
            episode.setComment(request.getComment());

            return episodeRepository.save(episode);
        } catch (Exception e) {
            logger.error("Erro ao salvar avaliação do episódio {} da temporada {} da série {}: {}", 
                request.getEpisodeNumber(), request.getSeasonNumber(), request.getSerieId(), e.getMessage());
            throw new MovieServiceException("Erro ao salvar avaliação do episódio: " + e.getMessage(), e);
        }
    }

    public List<RatingEpisode> getRatedEpisodesBySerie(String serieId, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return episodeRepository.findByUserIdAndSerieIdOrderBySeasonNumberAscEpisodeNumberAsc(userId, serieId);
    }
}
