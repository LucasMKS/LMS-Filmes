package com.lucasm.lmsfilmes.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

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
        long budget,
        long revenue,
        String tagline,
        String title,
        double vote_average,
        int vote_count,
        List<TmdbDTO> results,
        List<ProductionCompany> production_companies,
        List<Genre> genres,
        String media_type,

        Credits credits,
        Videos videos,
        @JsonProperty("watch/providers")
        WatchProviders watch_providers,
        TmdbPageDTO<TmdbDTO> recommendations
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

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Credits(List<Cast> cast, List<Crew> crew) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Cast(Long id, String name, String character, String profile_path) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Crew(Long id, String name, String job, String department, String profile_path) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Videos(List<Video> results) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Video(String id, String key, String name, String site, String type, boolean official) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record WatchProviders(Map<String, ProviderRegion> results) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProviderRegion(String link, List<Provider> flatrate, List<Provider> rent, List<Provider> buy) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Provider(Long provider_id, String provider_name, String logo_path) {}
}