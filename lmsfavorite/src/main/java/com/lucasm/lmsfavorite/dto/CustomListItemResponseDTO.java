package com.lucasm.lmsfavorite.dto;

import com.lucasm.lmsfavorite.model.CustomListItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class CustomListItemResponseDTO {
    private String id;
    private String type;
    private String title;
    private String posterPath;
    private String backdropPath;
    private Double voteAverage;
    private String releaseYear;
    private LocalDateTime addedAt;

    public CustomListItemResponseDTO(CustomListItem item) {
        this.id = item.getMediaId();
        this.type = item.getMediaType();
        this.title = item.getTitle();
        this.posterPath = item.getPosterPath();
        this.backdropPath = item.getBackdropPath();
        this.voteAverage = item.getVoteAverage();
        this.releaseYear = item.getReleaseYear();
        this.addedAt = item.getAddedAt();
    }
}
