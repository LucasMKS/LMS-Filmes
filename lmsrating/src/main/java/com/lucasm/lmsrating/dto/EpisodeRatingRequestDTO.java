package com.lucasm.lmsrating.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EpisodeRatingRequestDTO {

    @NotBlank(message = "O ID da série é obrigatório")
    private String serieId;

    @NotNull(message = "O número da temporada é obrigatório")
    private Integer seasonNumber;

    @NotNull(message = "O número do episódio é obrigatório")
    private Integer episodeNumber;

    @NotNull(message = "A nota é obrigatória")
    @Min(value = 0, message = "A nota mínima é 0")
    @Max(value = 10, message = "A nota máxima é 10")
    private Double rating;

    private String comment;
}
