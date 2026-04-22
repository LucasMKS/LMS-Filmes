package com.lucasm.lmsrating.dto;

public class RatingStatusDTO {

    private String rating;
    private String comment;

    public RatingStatusDTO() {}

    public RatingStatusDTO(String rating, String comment) {
        this.rating = rating;
        this.comment = comment;
    }

    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
