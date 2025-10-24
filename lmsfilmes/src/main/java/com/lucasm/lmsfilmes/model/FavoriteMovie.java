package com.lucasm.lmsfilmes.model;

import lombok.Data;

@Data
public class FavoriteMovie {
    private String id;
    
    private String movieId;
    
    private String email;

    private boolean favorite;

}
