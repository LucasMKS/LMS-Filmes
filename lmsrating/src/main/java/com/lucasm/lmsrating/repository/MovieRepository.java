package com.lucasm.lmsrating.repository;


import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.lucasm.lmsrating.model.Movies;

@Repository
public interface MovieRepository extends MongoRepository<Movies, String> {

    Page<Movies> findAllByEmail(String email, Pageable pageable);

    Page<Movies> findByEmailAndTitleContainingIgnoreCase(String email, String title, Pageable pageable);

    Optional<Movies> findByMovieIdAndEmail(String movieId, String email);

    List<Movies> findAllByEmailOrderByCreatedAtDesc(String email);

}
