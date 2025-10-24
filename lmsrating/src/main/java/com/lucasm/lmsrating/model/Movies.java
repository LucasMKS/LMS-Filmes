package com.lucasm.lmsrating.model;

import java.util.Date;

import lombok.Data;

@Data
public class Movies {

    private String id;

    private String title;

    private String movieId;

    private String myVote;

    private String comment;

    private String email;

    private String poster_path;

    private Date created_at ;

    public void onCreate() {
        this.created_at = new Date();
    }
}
