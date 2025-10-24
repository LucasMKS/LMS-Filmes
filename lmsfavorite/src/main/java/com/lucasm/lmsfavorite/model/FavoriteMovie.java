package com.lucasm.lmsfavorite.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "favorite_movies")
@CompoundIndex(name = "email_movie_idx", def = "{'email': 1, 'movieId': 1}", unique = true)
public class FavoriteMovie {

    @Id
    private String id;
    
    private String movieId;
    
    private String email;

    private boolean favorite;

}
