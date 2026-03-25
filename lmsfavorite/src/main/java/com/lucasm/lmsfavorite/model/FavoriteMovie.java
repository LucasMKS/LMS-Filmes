package com.lucasm.lmsfavorite.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "favorite_movies", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "movie_id"})
})
public class FavoriteMovie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "movie_id", nullable = false)
    private String movieId;

    @Column(name = "is_favorite")
    private boolean favorite = true;

    @Column(name = "mongo_id")
    private String mongoId;
}