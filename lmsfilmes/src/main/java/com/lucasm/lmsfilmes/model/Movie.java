package com.lucasm.lmsfilmes.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "movies")
public class Movie {
    @Id
    @Column(name = "movie_id", length = 50)
    private String movieId; // O ID do TMDB

    @Column(nullable = false)
    private String title;

    @Column(name = "poster_path", columnDefinition = "TEXT")
    private String posterPath;
}

