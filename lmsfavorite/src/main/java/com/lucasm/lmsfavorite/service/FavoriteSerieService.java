package com.lucasm.lmsfavorite.service;

import java.util.List;
import java.util.Optional;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lucasm.lmsfavorite.dto.CatalogSyncDTO;
import com.lucasm.lmsfavorite.model.FavoriteSerie;
import com.lucasm.lmsfavorite.repository.FavoriteSerieRepository;

@Service
public class FavoriteSerieService {

    private final FavoriteSerieRepository favoriteRepository;
    private final RabbitMQProducer rabbitMQProducer;
    private final UserLookupService userLookupService;

    public FavoriteSerieService(FavoriteSerieRepository favoriteRepository, RabbitMQProducer rabbitMQProducer, UserLookupService userLookupService) {
        this.favoriteRepository = favoriteRepository;
        this.rabbitMQProducer = rabbitMQProducer;
        this.userLookupService = userLookupService;
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "userFavoriteSeries", key = "#email")
    }, put = {
        @CachePut(value = "userFavoriteSerieStatus", key = "#email + '_' + #serieId")
    })
    public boolean toggleFavoriteSerie(String serieId, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        Optional<FavoriteSerie> optionalFavorite = favoriteRepository.findBySerieIdAndUserId(serieId, userId);

        FavoriteSerie favoriteSerie = optionalFavorite.orElseGet(() -> {
            FavoriteSerie newSerie = new FavoriteSerie();
            newSerie.setSerieId(serieId);
            newSerie.setUserId(userId);
            newSerie.setFavorite(false);

            CatalogSyncDTO syncDTO = new CatalogSyncDTO(serieId, null, null);
            CompletableFuture.runAsync(() -> rabbitMQProducer.sendSerieCatalogSync(syncDTO));

            return newSerie;
        });

        favoriteSerie.setFavorite(!favoriteSerie.isFavorite());
        favoriteRepository.save(favoriteSerie);

        return favoriteSerie.isFavorite();
    }

    @Cacheable(value = "userFavoriteSerieStatus", key = "#email + '_' + #serieId")
    public boolean isFavoriteSerie(String serieId, String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        Optional<FavoriteSerie> optionalFavorite = favoriteRepository.findBySerieIdAndUserId(serieId, userId);
        return optionalFavorite.map(FavoriteSerie::isFavorite).orElse(false);
    }

    @Cacheable(value = "userFavoriteSeries", key = "#email")
    public List<FavoriteSerie> getAllFavoritesSeries(String email) {
        Long userId = userLookupService.getUserIdByEmail(email);
        return favoriteRepository.findByUserIdAndFavorite(userId, true);
    }

    public Map<String, Boolean> getFavoriteSeriesStatusBatch(List<String> serieIds, String email) {
        Map<String, Boolean> statusBySerieId = new LinkedHashMap<>();

        if (serieIds == null || serieIds.isEmpty()) return statusBySerieId;

        List<String> normalizedIds = serieIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .collect(Collectors.toList());

        normalizedIds.forEach(id -> statusBySerieId.put(id, false));

        if (normalizedIds.isEmpty()) return statusBySerieId;

        Long userId = userLookupService.getUserIdByEmail(email);
        List<FavoriteSerie> favorites = favoriteRepository.findByUserIdAndSerieIdInAndFavorite(userId, normalizedIds, true);
        favorites.forEach(favorite -> statusBySerieId.put(favorite.getSerieId(), true));

        return statusBySerieId;
    }
}
