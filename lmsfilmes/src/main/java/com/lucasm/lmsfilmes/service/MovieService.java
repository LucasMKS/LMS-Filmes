package com.lucasm.lmsfilmes.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucasm.lmsfilmes.dto.TmdbDTO;
import com.lucasm.lmsfilmes.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.exceptions.ResourceNotFoundException;
import com.lucasm.lmsfilmes.exceptions.TmdbApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;

@Service
public class MovieService {

    private static final Logger logger = LoggerFactory.getLogger(MovieService.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String tmdbApiUrl;
    private final String apiKey;

    public MovieService(ObjectMapper objectMapper, @Value("${tmdb.api.url}") String tmdbApiUrl, @Value("${tmdb.api.key}") String apiKey) {
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

    private TmdbPageDTO<TmdbDTO> fetchPaginatedData(String path, String cacheKey) {
        try {
            HttpRequest request = buildRequest(path);
            
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                // Usamos TypeReference para desserializar a resposta genérica TmdbPageDTO<TmdbDTO>
                return objectMapper.readValue(response.body(), new TypeReference<TmdbPageDTO<TmdbDTO>>() {});
            } else {
                logger.error("Erro ao buscar dados do TMDB ({}): status {}", path, response.statusCode());
                throw new TmdbApiException("Erro ao buscar dados do TMDB: status " + response.statusCode());
            }

        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro de sistema ao buscar dados do TMDB ({}): {}", path, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar dados do TMDB: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "searchMovies", key = "#query + '_' + #page")
    public TmdbPageDTO<TmdbDTO> searchMovies(String query, int page) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8.toString());
            String path = "/search/movie?query=" + encodedQuery + "&include_adult=false&page=" + page;
            return fetchPaginatedData(path, "searchMovies::" + query + "::" + page);
        } catch (java.io.UnsupportedEncodingException e) {
             logger.error("Erro ao encodar query: {}", query, e);
             throw new TmdbApiException("Query de busca inválida.", e);
        }
    }

    @Cacheable(value = "movieDetails", key = "#movieId")
    public TmdbDTO getMovieDetails(String movieId) {
        try {
            String path = "/movie/" + movieId;
            HttpRequest request = buildRequest(path);

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), TmdbDTO.class);
            } else if (response.statusCode() == 404) {
                logger.warn("Filme com ID {} não encontrado", movieId);
                throw new ResourceNotFoundException("Filme não encontrado: " + movieId);
            } else {
                logger.error("Erro ao buscar detalhes do filme {}: status {}", movieId, response.statusCode());
                throw new TmdbApiException("Erro ao buscar detalhes do filme: status " + response.statusCode());
            }
        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro ao buscar detalhes do filme {}: {}", movieId, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar detalhes do filme: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "moviePopular", key = "#page")
    public TmdbPageDTO<TmdbDTO> getPopularMovies(int page) {
        String path = "/movie/popular?page=" + page + "&region=BR";
        return fetchPaginatedData(path, "moviePopular::" + page);
    }

    @Cacheable(value = "moviesNowPlaying", key = "#page")
    public TmdbPageDTO<TmdbDTO> getNowPlayingMovies(int page) {
        String path = "/movie/now_playing?page=" + page + "&region=BR";
        return fetchPaginatedData(path, "moviesNowPlaying::" + page);
    }

    @Cacheable(value = "moviesTopRated", key = "#page")
    public TmdbPageDTO<TmdbDTO> getTopRatedMovies(int page) {
        String path = "/movie/top_rated?page=" + page; // Top Rated é global, remover region=BR
        return fetchPaginatedData(path, "moviesTopRated::" + page);
    }

    @Cacheable(value = "moviesUpcoming", key = "#page")
    public TmdbPageDTO<TmdbDTO> getUpcomingMovies(int page) {
        String path = "/movie/upcoming?page=" + page + "&region=BR";
        return fetchPaginatedData(path, "moviesUpcoming::" + page);
    }

}
