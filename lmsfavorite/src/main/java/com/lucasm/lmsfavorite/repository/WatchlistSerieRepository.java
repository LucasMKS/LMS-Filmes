package com.lucasm.lmsfavorite.repository;

import com.lucasm.lmsfavorite.model.WatchlistSerie;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface WatchlistSerieRepository extends MongoRepository<WatchlistSerie, String> {
    List<WatchlistSerie> findByEmailOrderByAddedAtDesc(String email);
    Optional<WatchlistSerie> findByEmailAndSerieId(String email, String serieId);
    boolean existsByEmailAndSerieId(String email, String serieId);
    void deleteByEmailAndSerieId(String email, String serieId);
}