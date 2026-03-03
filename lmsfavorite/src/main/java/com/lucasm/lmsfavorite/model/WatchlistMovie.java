package com.lucasm.lmsfavorite.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Document(collection = "watchlist_movies")
@CompoundIndex(name = "email_watchlist_movie_idx", def = "{'email': 1, 'movieId': 1}", unique = true)
/**
 * Entidade que representa um filme salvo na watchlist do usuário.
 */
public class WatchlistMovie {
    @Id
    private String id;
    private String email;
    private String movieId;
    private LocalDateTime addedAt = LocalDateTime.now();
}