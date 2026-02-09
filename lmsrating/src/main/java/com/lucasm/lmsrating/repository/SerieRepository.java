package com.lucasm.lmsrating.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.Series;

@Repository
public interface SerieRepository extends MongoRepository<Series, String>  {

    Page<Series> findAllByEmail(String email, Pageable pageable);

    Page<Series> findByEmailAndTitleContainingIgnoreCase(String email, String title, Pageable pageable);

    Optional<Series> findBySerieIdAndEmail(String serieId, String email);

    List<Series> findAllByEmailOrderByCreatedAtDesc(String email);

}
