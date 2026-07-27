package com.lucasm.lmsfavorite.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCustomListDTO {
    @NotBlank(message = "O nome da lista não pode ser vazio")
    private String name;
    private String description;
}
