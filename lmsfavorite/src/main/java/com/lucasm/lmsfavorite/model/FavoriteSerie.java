package com.lucasm.lmsfavorite.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "favorite_series")
@CompoundIndex(name = "email_serie_idx", def = "{'email' : 1, 'serieId' : 1}", unique = true)
public class FavoriteSerie {

    @Id
    private String id;
    
    private String serieId;

    private String email;

    private boolean favorite;
    
}
