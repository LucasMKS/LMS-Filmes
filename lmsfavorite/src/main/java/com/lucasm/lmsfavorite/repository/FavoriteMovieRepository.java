package com.lucasm.lmsfavorite.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsfavorite.model.FavoriteMovie;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteMovieRepository extends MongoRepository<FavoriteMovie, String> {

    List<FavoriteMovie> findByEmailAndFavorite(String email, boolean favorite);

    Optional<FavoriteMovie> findByMovieIdAndEmail(String movieId, String email);

}
