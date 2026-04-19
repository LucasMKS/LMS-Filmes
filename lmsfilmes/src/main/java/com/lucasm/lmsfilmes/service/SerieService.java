package com.lucasm.lmsfilmes.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucasm.lmsfilmes.dto.SeriesDTO;
import com.lucasm.lmsfilmes.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.exceptions.ResourceNotFoundException;
import com.lucasm.lmsfilmes.exceptions.TmdbApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import reactor.core.publisher.Mono;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class SerieService {

    private static final Logger logger = LoggerFactory.getLogger(SerieService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public SerieService(WebClient tmdbWebClient, ObjectMapper objectMapper) {
        this.webClient = tmdbWebClient;
        this.objectMapper = objectMapper;
    }

    private String withLanguage(String path) {
        return path + (path.contains("?") ? "&" : "?") + "language=pt-BR";
    }

    private TmdbPageDTO<SeriesDTO> fetchPaginatedData(String path) {
        try {
            String body = webClient.get()
                    .uri(withLanguage(path))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar dados de séries: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readValue(body, new TypeReference<TmdbPageDTO<SeriesDTO>>() {});
        } catch (TmdbApiException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao buscar dados de séries do TMDB ({}): {}", path, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar dados de séries: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "searchSeries", key = "#query + '_' + #page")
    public TmdbPageDTO<SeriesDTO> searchSeries(String query, int page) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String path = "/search/tv?query=" + encodedQuery + "&include_adult=false&page=" + page;
        return fetchPaginatedData(path);
    }

    @Cacheable(value = "seriesDetails", key = "#serieId + '_' + #includeRecommendations")
    public SeriesDTO getSeriesDetails(String serieId, boolean includeRecommendations) {
        try {
            String appendTo = includeRecommendations
                    ? "credits,videos,watch/providers,recommendations"
                    : "credits,videos,watch/providers";
            String path = withLanguage("/tv/" + serieId + "?append_to_response=" + appendTo);

            String body = webClient.get()
                    .uri(path)
                    .retrieve()
                    .onStatus(status -> status.value() == 404, response ->
                            Mono.error(new ResourceNotFoundException("Série não encontrada: " + serieId)))
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar detalhes da série: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readValue(body, SeriesDTO.class);
        } catch (ResourceNotFoundException | TmdbApiException e) {
            throw e;
        } catch (WebClientResponseException e) {
            logger.error("Erro HTTP ao buscar detalhes da série {}: {}", serieId, e.getMessage());
            throw new TmdbApiException("Erro ao buscar detalhes da série: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Erro ao buscar detalhes da série {}: {}", serieId, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar detalhes da série: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "seriesPopular", key = "#page")
    public TmdbPageDTO<SeriesDTO> getPopularSeries(int page) {
        return fetchPaginatedData("/trending/tv/week?page=" + page);
    }

    @Cacheable(value = "seriesAiringToday", key = "#page")
    public TmdbPageDTO<SeriesDTO> getAiringTodaySeries(int page) {
        return fetchPaginatedData("/tv/airing_today?page=" + page + "&timezone=America%2FSao_Paulo");
    }

    @Cacheable(value = "seriesOnTheAir", key = "#page")
    public TmdbPageDTO<SeriesDTO> getOnTheAirSeries(int page) {
        return fetchPaginatedData("/tv/on_the_air?page=" + page + "&timezone=America%2FSao_Paulo");
    }

    @Cacheable(value = "seriesTopRated", key = "#page")
    public TmdbPageDTO<SeriesDTO> getTopRatedSeries(int page) {
        return fetchPaginatedData("/tv/top_rated?page=" + page);
    }
}
