package com.lucasm.lmsfilmes.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TmdbPageDTO<T>(
    
    @JsonProperty("page")
    int page,

    @JsonProperty("results")
    List<T> results,

    @JsonProperty("total_pages")
    int totalPages,

    @JsonProperty("total_results")
    int totalResults
) {}