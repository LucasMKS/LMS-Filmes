package com.lucasm.lmsfavorite.repository;

import com.lucasm.lmsfavorite.model.WatchlistMovie;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface WatchlistMovieRepository extends MongoRepository<WatchlistMovie, String> {
    List<WatchlistMovie> findByEmailOrderByAddedAtDesc(String email);
    Optional<WatchlistMovie> findByEmailAndMovieId(String email, String movieId);
    boolean existsByEmailAndMovieId(String email, String movieId);
    void deleteByEmailAndMovieId(String email, String movieId);
}