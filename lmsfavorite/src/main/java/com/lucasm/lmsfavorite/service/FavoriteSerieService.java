package com.lucasm.lmsfavorite.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.lucasm.lmsfavorite.model.FavoriteSerie;
import com.lucasm.lmsfavorite.repository.FavoriteSerieRepository;

@Service
public class FavoriteSerieService {

    private static final Logger logger = LoggerFactory.getLogger(FavoriteSerieService.class);

    private final FavoriteSerieRepository favoriteRepository;

    public FavoriteSerieService(FavoriteSerieRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    @CacheEvict(value = {"userFavoriteSeries", "userFavoriteSerieStatus"}, allEntries = true)
    public void toggleFavoriteSerie(String serieId, String email) {
        
        Optional<FavoriteSerie> optionalFavorite = favoriteRepository.findBySerieIdAndEmail(serieId, email);
        FavoriteSerie favoriteSerie = optionalFavorite.orElseGet(() -> {
            FavoriteSerie fs = new FavoriteSerie();
            fs.setSerieId(serieId);
            fs.setEmail(email);
            return fs;
        });
        
        boolean newStatus = !favoriteSerie.isFavorite();
        favoriteSerie.setFavorite(newStatus);
        
        favoriteRepository.save(favoriteSerie);
    }

    @Cacheable(value = "userFavoriteSerieStatus", key = "#email + '_' + #serieId")
    public boolean isFavoriteSerie(String serieId, String email) {
        Optional<FavoriteSerie> optionalFavorite = favoriteRepository.findBySerieIdAndEmail(serieId, email);
        boolean result = optionalFavorite.map(FavoriteSerie::isFavorite).orElse(false);

        logger.debug("Resultado do favorite: {}", result);
        return result;
    }

    @Cacheable(value = "userFavoriteSeries", key = "#email")
    public List<FavoriteSerie> getAllFavoritesSeries(String email) {
        List<FavoriteSerie> allFavorites = favoriteRepository.findAllByEmail(email)
                .stream()
                .filter(FavoriteSerie::isFavorite)
                .collect(Collectors.toList());

        return allFavorites;
    }
}
