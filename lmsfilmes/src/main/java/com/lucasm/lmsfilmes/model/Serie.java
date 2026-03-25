package com.lucasm.lmsfilmes.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "series")
public class Serie {
    @Id
    @Column(name = "serie_id", length = 50)
    private String serieId; // O ID do TMDB

    @Column(nullable = false)
    private String title;

    @Column(name = "poster_path", columnDefinition = "TEXT")
    private String posterPath;
}