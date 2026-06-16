package com.lucasm.lmsfilmes.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record SeasonDTO(
    int _id,
    String air_date,
    List<EpisodeDTO> episodes,
    String name,
    String overview,
    int id,
    String poster_path,
    int season_number,
    double vote_average
) {
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EpisodeDTO(
        String air_date,
        int episode_number,
        int id,
        String name,
        String overview,
        String production_code,
        int runtime,
        int season_number,
        int show_id,
        String still_path,
        double vote_average,
        int vote_count
    ) {}
}
