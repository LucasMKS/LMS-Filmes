package com.lucasm.lmsfavorite.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCustomListDTO {
    @NotBlank(message = "O nome da lista é obrigatório")
    private String name;
    private String description;
}
