package com.lucasm.lmsfilmes.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucasm.lmsfilmes.dto.SeriesDTO;
import com.lucasm.lmsfilmes.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.exceptions.ResourceNotFoundException;
import com.lucasm.lmsfilmes.exceptions.TmdbApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.net.URLEncoder;

@Service
public class SerieService {

    private static final Logger logger = LoggerFactory.getLogger(SerieService.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String tmdbApiUrl;
    private final String apiKey;

    public SerieService(ObjectMapper objectMapper,
            @Value("${tmdb.api.url}") String tmdbApiUrl,
            @Value("${tmdb.api.key}") String apiKey) {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = objectMapper;
        this.tmdbApiUrl = tmdbApiUrl;
        this.apiKey = apiKey;
    }

    private HttpRequest buildRequest(String path) throws URISyntaxException {
        URI uri = new URI(tmdbApiUrl + path + (path.contains("?") ? "&" : "?") + "language=pt-BR");

        return HttpRequest.newBuilder()
                .uri(uri)
                .header("Authorization", "Bearer " + apiKey)
                .header("Accept", "application/json")
                .GET()
                .build();
    }

    private TmdbPageDTO<SeriesDTO> fetchPaginatedData(String path) {
        try {
            HttpRequest request = buildRequest(path);
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), new TypeReference<TmdbPageDTO<SeriesDTO>>() {});
            } else {
                logger.error("Erro ao buscar dados de séries do TMDB ({}): status {}", path, response.statusCode());
                throw new TmdbApiException("Erro ao buscar dados de séries: status " + response.statusCode());
            }

        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro de sistema ao buscar dados de séries ({}): {}", path, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar dados de séries: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "searchSeries", key = "#query + '_' + #page")
    public TmdbPageDTO<SeriesDTO> searchSeries(String query, int page) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8.toString());
            String path = "/search/tv?query=" + encodedQuery + "&include_adult=false&page=" + page;
            return fetchPaginatedData(path);
        } catch (UnsupportedEncodingException e) {
            logger.error("Erro ao encodar query de série: {}", query, e);
            throw new TmdbApiException("Query de busca inválida.", e);
        }
    }

    @Cacheable(value = "seriesDetails", key = "#serieId")
    public SeriesDTO getSeriesDetails(String serieId) {
        try {
            String path = "/tv/" + serieId + "?append_to_response=credits,videos,watch/providers,recommendations";
            HttpRequest request = buildRequest(path);

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), SeriesDTO.class);
            } else if (response.statusCode() == 404) {
                logger.warn("Série com ID {} não encontrada", serieId);
                throw new ResourceNotFoundException("Série não encontrada: " + serieId);
            } else {
                logger.error("Erro ao buscar detalhes da série {}: status {}", serieId, response.statusCode());
                throw new TmdbApiException("Erro ao buscar detalhes da série: status " + response.statusCode());
            }
        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro ao buscar detalhes da série {}: {}", serieId, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar detalhes da série: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "seriesPopular", key = "#page")
    public TmdbPageDTO<SeriesDTO> getPopularSeries(int page) {
        String path = "/trending/tv/week?page=" + page;
        return fetchPaginatedData(path);
    }

    @Cacheable(value = "seriesAiringToday", key = "#page")
    public TmdbPageDTO<SeriesDTO> getAiringTodaySeries(int page) {
        String path = "/tv/airing_today?page=" + page + "&timezone=America%2FSao_Paulo";
        return fetchPaginatedData(path);
    }

    @Cacheable(value = "seriesOnTheAir", key = "#page")
    public TmdbPageDTO<SeriesDTO> getOnTheAirSeries(int page) {
        String path = "/tv/on_the_air?page=" + page + "&timezone=America%2FSao_Paulo";
        return fetchPaginatedData(path);
    }

    @Cacheable(value = "seriesTopRated", key = "#page")
    public TmdbPageDTO<SeriesDTO> getTopRatedSeries(int page) {
        String path = "/tv/top_rated?page=" + page;
        return fetchPaginatedData(path);
    }
}
