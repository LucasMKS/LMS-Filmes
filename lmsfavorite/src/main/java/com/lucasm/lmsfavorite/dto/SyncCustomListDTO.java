package com.lucasm.lmsfavorite.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class SyncCustomListDTO {
    private String name;
    private String description;
    private List<AddCustomListItemDTO> items = new ArrayList<>();
}
