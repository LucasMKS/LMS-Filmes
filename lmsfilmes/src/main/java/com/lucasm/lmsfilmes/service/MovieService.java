package com.lucasm.lmsfilmes.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucasm.lmsfilmes.dto.TmdbDTO;
import com.lucasm.lmsfilmes.exceptions.ResourceNotFoundException;

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
import java.util.List;
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

    @Cacheable(value = "searchMovies", key = "#query + '_' + #page")
    public List<TmdbDTO> searchMovies(String query, int page) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8.toString());
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(tmdbApiUrl + "/search/movie?query=" + encodedQuery + "&include_adult=false&language=pt-BR&page=" + page))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                MovieSearchResponse searchResponse = objectMapper.readValue(response.body(), MovieSearchResponse.class);
                return searchResponse.results();
            } else {
                logger.warn("Nenhum filme encontrado para a query '{}', status code {}", query, response.statusCode());
                throw new ResourceNotFoundException("Nenhum filme encontrado para a busca: " + query);
            }

        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro ao buscar filmes: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar filmes: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "movieDetails", key = "#movieId")
    public TmdbDTO getMoviesDetails(String movieId) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(tmdbApiUrl + "/movie/" + movieId + "?language=pt-BR"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), TmdbDTO.class);
            } else if (response.statusCode() == 404) {
                logger.warn("Filme com ID {} não encontrado", movieId);
                throw new ResourceNotFoundException("Filme não encontrado: " + movieId);
            } else {
                logger.error("Erro ao buscar detalhes do filme {}: status {}", movieId, response.statusCode());
                throw new RuntimeException("Erro ao buscar detalhes do filme: status " + response.statusCode());
            }
        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro ao buscar detalhes do filme {}: {}", movieId, e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar detalhes do filme: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "moviePopular", key = "#page")
    public List<TmdbDTO> moviePopular(int page) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(tmdbApiUrl + "/movie/popular?language=pt-BR&page=" + page + "&region=BR"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                MovieSearchResponse searchResponse = objectMapper.readValue(response.body(), MovieSearchResponse.class);
                return searchResponse.results();
            } else {
                logger.error("Erro ao buscar filmes populares: status {}", response.statusCode());
                throw new RuntimeException("Erro ao buscar filmes populares: status " + response.statusCode());
            }

        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro ao buscar filmes populares: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar filmes populares: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "moviesNowPlaying", key = "#page")
    public List<TmdbDTO> nowPlayingMovies(int page) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(tmdbApiUrl + "/movie/now_playing?language=pt-BR&page=" + page + "&region=BR"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                MovieSearchResponse searchResponse = objectMapper.readValue(response.body(), MovieSearchResponse.class);
                return searchResponse.results();
            } else {
                logger.error("Erro ao buscar filmes em cartaz: status {}", response.statusCode());
                throw new RuntimeException("Erro ao buscar filmes em cartaz: status " + response.statusCode());
            }

        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro ao buscar filmes em cartaz: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar filmes em cartaz: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "moviesTopRated", key = "#page")
    public List<TmdbDTO> topRatedMovies(int page) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(tmdbApiUrl + "/movie/top_rated?language=pt-BR&page=" + page))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                MovieSearchResponse searchResponse = objectMapper.readValue(response.body(), MovieSearchResponse.class);
                return searchResponse.results();
            } else {
                logger.error("Erro ao buscar filmes mais bem avaliados: status {}", response.statusCode());
                throw new RuntimeException("Erro ao buscar filmes mais bem avaliados: status " + response.statusCode());
            }

        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro ao buscar filmes mais bem avaliados: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar filmes mais bem avaliados: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "moviesUpcoming", key = "#page")
    public List<TmdbDTO> upcomingMovies(int page) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(tmdbApiUrl + "/movie/upcoming?language=pt-BR&page=" + page + "&region=BR"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                MovieSearchResponse searchResponse = objectMapper.readValue(response.body(), MovieSearchResponse.class);
                return searchResponse.results();
            } else {
                logger.error("Erro ao buscar filmes em breve: status {}", response.statusCode());
                throw new RuntimeException("Erro ao buscar filmes em breve: status " + response.statusCode());
            }

        } catch (IOException | InterruptedException | URISyntaxException e) {
            logger.error("Erro ao buscar filmes em breve: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar filmes em breve: " + e.getMessage(), e);
        }
    }

    private static record MovieSearchResponse(List<TmdbDTO> results) {}
}
