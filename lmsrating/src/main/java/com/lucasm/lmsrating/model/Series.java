package com.lucasm.lmsrating.model;

import java.util.Date;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "ratings_series")
/**
 * Entidade que representa uma avaliação de série persistida no MongoDB.
 */
public class Series {

    @Id
    private String id;

    private String title;

    private String serieId;

    private Double rating;

    private String comment;

    private String email;

    private String poster_path;

    @CreatedDate
    private Date createdAt;

    @LastModifiedDate
    private Date modifiedAt;
}
