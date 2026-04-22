package com.lucasm.lmsrating.dto;

import java.time.LocalDateTime;

public class RatingSerieResponseDTO {

    private Long id;
    private String serieId;
    private String title;
    private String posterPath;
    private Double rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    public RatingSerieResponseDTO() {}

    public RatingSerieResponseDTO(Long id, String serieId, String title, String posterPath,
                                   Double rating, String comment,
                                   LocalDateTime createdAt, LocalDateTime modifiedAt) {
        this.id = id;
        this.serieId = serieId;
        this.title = title;
        this.posterPath = posterPath;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSerieId() { return serieId; }
    public void setSerieId(String serieId) { this.serieId = serieId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPosterPath() { return posterPath; }
    public void setPosterPath(String posterPath) { this.posterPath = posterPath; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getModifiedAt() { return modifiedAt; }
    public void setModifiedAt(LocalDateTime modifiedAt) { this.modifiedAt = modifiedAt; }
}
