package com.lucasm.lmsrating.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.Series;

@Repository
public interface SerieRepository extends MongoRepository<Series, String>  {

    List<Series> findAllByEmail(String email);

    Optional<Series> findBySerieIdAndEmail(String serieId, String email);
}
