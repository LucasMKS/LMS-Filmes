package com.lucasm.lmsfilmes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.lucasm.lmsfilmes.model.Serie;

@Repository
public interface SerieRepository extends JpaRepository<Serie, String> {
}