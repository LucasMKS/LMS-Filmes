package com.lucasm.lmsrating.repository;


import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.Movies;

@Repository
public interface MovieRepository extends MongoRepository<Movies, String> {

    List<Movies> findAllByEmailOrderByCreatedAtDesc(String email);

    Optional<Movies> findByMovieIdAndEmail(String movieId, String email);

}
