package com.lucasm.lmsfavorite.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsfavorite.model.FavoriteMovie;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteMovieRepository extends MongoRepository<FavoriteMovie, String> {

    List<FavoriteMovie> findAllByEmail(String email);

    Optional<FavoriteMovie> findByMovieIdAndEmail(String movieId, String email);

    Optional<FavoriteMovie> findByEmailAndMovieId(String email, String movieId);

    List<FavoriteMovie> findByEmailAndFavorite(String email, boolean favorite);
}
