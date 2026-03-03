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

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementa regras de negócio para favoritos de séries por usuário.
 */
@Service
public class FavoriteSerieService {

    private final FavoriteSerieRepository favoriteRepository;

    /**
     * Cria o serviço com acesso ao repositório de favoritos de séries.
     *
     * @param favoriteRepository repositório de persistência de favoritos de séries.
     */
    public FavoriteSerieService(FavoriteSerieRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    /**
     * Alterna o estado de favorito de uma série para um usuário.
     *
     * @param serieId identificador da série.
     * @param email e-mail do usuário autenticado.
     * @return `true` se a série ficar favoritada após a operação; caso contrário, `false`.
     */
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

    /**
     * Verifica se uma série está marcada como favorita por um usuário.
     *
     * @param serieId identificador da série.
     * @param email e-mail do usuário autenticado.
     * @return `true` quando estiver favoritada; caso contrário, `false`.
     */
    @Cacheable(value = "userFavoriteSerieStatus", key = "#email + '_' + #serieId")
    public boolean isFavoriteSerie(String serieId, String email) {
        Optional<FavoriteSerie> optionalFavorite = favoriteRepository.findBySerieIdAndEmail(serieId, email);
        boolean result = optionalFavorite.map(FavoriteSerie::isFavorite).orElse(false);

        return result;
    }

    /**
     * Lista todas as séries favoritadas de um usuário.
     *
     * @param email e-mail do usuário autenticado.
     * @return lista de séries favoritadas.
     */
    @Cacheable(value = "userFavoriteSeries", key = "#email")
    public List<FavoriteSerie> getAllFavoritesSeries(String email) {
        List<FavoriteSerie> allFavorites = favoriteRepository.findByEmailAndFavorite(email, true);
        
        return allFavorites;
    }

    /**
     * Consulta por lote o status de favoritos de séries para um usuário.
     *
     * @param serieIds identificadores de séries a consultar.
     * @param email e-mail do usuário autenticado.
     * @return mapa `serieId -> isFavorite` para todos os IDs recebidos.
     */
    public Map<String, Boolean> getFavoriteSeriesStatusBatch(List<String> serieIds, String email) {
        Map<String, Boolean> statusBySerieId = new LinkedHashMap<>();

        if (serieIds == null || serieIds.isEmpty()) {
            return statusBySerieId;
        }

        List<String> normalizedIds = serieIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .collect(Collectors.toList());

        normalizedIds.forEach(id -> statusBySerieId.put(id, false));

        if (normalizedIds.isEmpty()) {
            return statusBySerieId;
        }

        List<FavoriteSerie> favorites = favoriteRepository.findByEmailAndSerieIdInAndFavorite(email, normalizedIds, true);
        favorites.forEach(favorite -> statusBySerieId.put(favorite.getSerieId(), true));

        return statusBySerieId;
    }
}
