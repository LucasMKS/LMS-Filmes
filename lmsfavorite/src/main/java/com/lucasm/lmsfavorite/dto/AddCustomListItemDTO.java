package com.lucasm.lmsfavorite.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddCustomListItemDTO {
    @NotBlank(message = "O ID da mídia é obrigatório")
    private String id; // mediaId

    @NotBlank(message = "O tipo da mídia (movie/serie) é obrigatório")
    private String type; // "movie" or "serie"

    private String title;
    private String posterPath;
    private String backdropPath;
    private Double voteAverage;
    private String releaseYear;
}
