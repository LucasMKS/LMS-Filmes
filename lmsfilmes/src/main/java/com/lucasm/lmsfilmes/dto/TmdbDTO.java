package com.lucasm.lmsfilmes.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record TmdbDTO(
        String backdrop_path,
        String homepage,
        Long id,
        String imdb_id,
        String original_title,
        String overview,
        String poster_path,
        String release_date,
        int runtime,
        String tagline,
        String title,
        double vote_average,
        int vote_count,
        // Movies movies,
        List<TmdbDTO> results,
        List<ProductionCompany> production_companies,
        List<Genre> genres,
        String media_type
) {

    public TmdbDTO {
        if (media_type == null) {
            media_type = "movie";
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Genre(Long id, String name) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProductionCompany(String name, String origin_country) {}
}
