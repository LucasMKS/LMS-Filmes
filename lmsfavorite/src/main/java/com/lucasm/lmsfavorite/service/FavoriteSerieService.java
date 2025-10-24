package com.lucasm.lmsfavorite.service;

import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import com.lucasm.lmsfavorite.model.FavoriteSerie;
import com.lucasm.lmsfavorite.repository.FavoriteSerieRepository;

@Service
public class FavoriteSerieService {

    private final FavoriteSerieRepository favoriteRepository;

    public FavoriteSerieService(FavoriteSerieRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    @Caching(
        evict = {
            @CacheEvict(value = "userFavoriteSeries", key = "#email")
        },
        put = {
            @CachePut(value = "userFavoriteSerieStatus", key = "#email + '_' + #serieId")
        }
    )
    public boolean toggleFavoriteSerie(String serieId, String email) {
        
        Optional<FavoriteSerie> optionalFavorite = favoriteRepository.findBySerieIdAndEmail(serieId, email);
        
        FavoriteSerie favoriteSerie = optionalFavorite.orElseGet(() -> {
            FavoriteSerie newSerie = new FavoriteSerie();
            newSerie.setSerieId(serieId);
            newSerie.setEmail(email);
            newSerie.setFavorite(false);
            return newSerie;
        });
        
        favoriteSerie.setFavorite(!favoriteSerie.isFavorite());
        
        favoriteRepository.save(favoriteSerie);

        return favoriteSerie.isFavorite();
    }

    @Cacheable(value = "userFavoriteSerieStatus", key = "#email + '_' + #serieId")
    public boolean isFavoriteSerie(String serieId, String email) {
        Optional<FavoriteSerie> optionalFavorite = favoriteRepository.findBySerieIdAndEmail(serieId, email);
        boolean result = optionalFavorite.map(FavoriteSerie::isFavorite).orElse(false);

        return result;
    }

    @Cacheable(value = "userFavoriteSeries", key = "#email")
    public List<FavoriteSerie> getAllFavoritesSeries(String email) {
        List<FavoriteSerie> allFavorites = favoriteRepository.findByEmailAndFavorite(email, true);
        
        return allFavorites;
    }
}
