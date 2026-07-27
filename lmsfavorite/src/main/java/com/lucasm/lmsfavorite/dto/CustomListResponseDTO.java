package com.lucasm.lmsfavorite.dto;

import com.lucasm.lmsfavorite.model.CustomList;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
public class CustomListResponseDTO {
    private String id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CustomListItemResponseDTO> items = new ArrayList<>();

    public CustomListResponseDTO(CustomList list) {
        this.id = String.valueOf(list.getId());
        this.name = list.getName();
        this.description = list.getDescription();
        this.createdAt = list.getCreatedAt();
        this.updatedAt = list.getUpdatedAt();
        if (list.getItems() != null) {
            this.items = list.getItems().stream()
                    .map(CustomListItemResponseDTO::new)
                    .collect(Collectors.toList());
        }
    }
}
