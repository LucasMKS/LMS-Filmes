package com.lucasm.lmsrating.model;

import java.util.Date;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "ratings_movies")
public class Movies {

    @Id
    private String id;

    private String title;

    private String movieId;

    private Double rating;

    private String comment;

    private String email;

    private String poster_path;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date modifiedAt;
}
