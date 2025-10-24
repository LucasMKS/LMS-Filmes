package com.lucasm.lmsrating.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RatingRequestDTO {

    @NotBlank(message = "O ID do filme é obrigatório")
    private String movieId;

    @NotNull(message = "A nota é obrigatória")
    @DecimalMin(value = "0.5", message = "A nota deve ser no mínimo 0.5")
    @DecimalMax(value = "10.0", message = "A nota deve ser no máximo 10.0")
    private Double rating;

    @NotBlank(message = "O título é obrigatório")
    private String title;

    @NotBlank(message = "O caminho do poster é obrigatório")
    private String poster_path;

    private String comment;
}
