package com.lucasm.lmsfilmes.dto;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CatalogSyncDTO implements Serializable {
    private String id;
    private String title;
    private String posterPath;
}