package com.lucasm.lmsfavorite.model;

import lombok.Data;

@Data
public class FavoriteSerie {
    private String id;
    
    private String serieId;

    private String email;

    private boolean favorite;
    
}
