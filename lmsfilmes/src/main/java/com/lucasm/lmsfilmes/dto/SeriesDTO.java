package com.lucasm.lmsfilmes.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SeriesDTO {
 
    private String backdrop_path;
    private List<CreatedByDTO> created_by;
    private String first_air_date;
    private List<GenreDTO> genres;
    private String homepage;
    private int id;
    private boolean in_production;
    private String last_air_date;
    private EpisodeDTO last_episode_to_air;
    private String name;
    private EpisodeDTO next_episode_to_air;
    private List<NetworkDTO> networks;
    private int number_of_episodes;
    private int number_of_seasons;
    private String overview;
    private String poster_path;
    private String status;
    private String tagline;
    private String media_type = "tv";
    private double vote_average;
    private int vote_count;

    @Data
    public static class CreatedByDTO {
        private int id;
        private String name;
        private String profilePath;
    }
    
    @Data
    public static class GenreDTO {
        private int id;
        private String name;
    }
    
    @Data
    public static class EpisodeDTO{
        private String name;
        private String overview;
        private String air_date;
        private String episode_number;
        private String season_number;
    }

    @Data
    public static class NetworkDTO {
        private int id;
        private String name;
        private String logo_path;
        private String origin_country;
    }

}

