package com.lucasm.lmsfilmes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lucasm.lmsfilmes.model.Movie;

@Repository
public interface MovieRepository extends JpaRepository<Movie, String> {
}