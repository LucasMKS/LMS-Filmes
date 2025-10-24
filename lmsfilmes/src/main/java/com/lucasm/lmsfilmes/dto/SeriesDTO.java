package com.lucasm.lmsfilmes.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record SeriesDTO(
    String backdrop_path,
    List<CreatedByDTO> created_by,
    String first_air_date,
    List<GenreDTO> genres,
    String homepage,
    int id,
    boolean in_production,
    String last_air_date,
    EpisodeDTO last_episode_to_air,
    String name,
    EpisodeDTO next_episode_to_air,
    List<NetworkDTO> networks,
    int number_of_episodes,
    int number_of_seasons,
    String overview,
    String poster_path,
    String status,
    String tagline,
    String media_type,
    double vote_average,
    int vote_count
) {

    // Construtor compacto para definir o default
    public SeriesDTO {
        if (media_type == null) {
            media_type = "tv";
        }
    }
    
    // --- Classes Aninhadas como Records ---

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CreatedByDTO(
        int id,
        String name,
        String profilePath
    ) {}
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GenreDTO(
        int id,
        String name
    ) {}
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EpisodeDTO(
        String name,
        String overview,
        String air_date,
        String episode_number,
        String season_number
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NetworkDTO(
        int id,
        String name,
        String logo_path,
        String origin_country
    ) {}
}