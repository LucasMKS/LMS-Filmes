package com.lucasm.lmsfilmes.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsfilmes.model.FavoriteSerie;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteSerieRepository extends MongoRepository<FavoriteSerie, String> {

    List<FavoriteSerie> findAllByEmail(String email);

    Optional<FavoriteSerie> findBySerieIdAndEmail(String serieId, String email);

    List<FavoriteSerie> findByEmailAndFavorite(String email, boolean favorite);
}
