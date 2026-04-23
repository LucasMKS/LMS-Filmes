package com.lucasm.lmsfilmes.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucasm.lmsfilmes.dto.TmdbDTO;
import com.lucasm.lmsfilmes.dto.TmdbPageDTO;
import com.lucasm.lmsfilmes.exceptions.ResourceNotFoundException;
import com.lucasm.lmsfilmes.exceptions.TmdbApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class MovieService {

    private static final Logger logger = LoggerFactory.getLogger(MovieService.class);
    private static final int BATCH_MAX_SIZE = 100;
    private static final int BATCH_CONCURRENCY = 16;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<MovieService> selfProvider;

    public MovieService(WebClient tmdbWebClient, ObjectMapper objectMapper, ObjectProvider<MovieService> selfProvider) {
        this.webClient = tmdbWebClient;
        this.objectMapper = objectMapper;
        this.selfProvider = selfProvider;
    }

    private String withLanguage(String path) {
        return path + (path.contains("?") ? "&" : "?") + "language=pt-BR";
    }

    private TmdbPageDTO<TmdbDTO> fetchPaginatedData(String path) {
        try {
            String body = webClient.get()
                    .uri(withLanguage(path))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar dados do TMDB: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readValue(body, new TypeReference<TmdbPageDTO<TmdbDTO>>() {});
        } catch (TmdbApiException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao buscar dados do TMDB ({}): {}", path, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar dados do TMDB: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "searchMovies", key = "#query + '_' + #page")
    public TmdbPageDTO<TmdbDTO> searchMovies(String query, int page) {
        String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String path = "/search/movie?query=" + encodedQuery + "&include_adult=false&page=" + page;
        return fetchPaginatedData(path);
    }

    @Cacheable(value = "movieDetails", key = "#movieId + '_' + #includeRecommendations")
    public TmdbDTO getMovieDetails(String movieId, boolean includeRecommendations) {
        try {
            String appendTo = includeRecommendations
                    ? "credits,videos,watch/providers,recommendations"
                    : "credits,videos,watch/providers";
            String path = withLanguage("/movie/" + movieId + "?append_to_response=" + appendTo);

            String body = webClient.get()
                    .uri(path)
                    .retrieve()
                    .onStatus(status -> status.value() == 404, response ->
                            Mono.error(new ResourceNotFoundException("Filme não encontrado: " + movieId)))
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar detalhes do filme: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .block();

            return objectMapper.readValue(body, TmdbDTO.class);
        } catch (ResourceNotFoundException | TmdbApiException e) {
            throw e;
        } catch (WebClientResponseException e) {
            logger.error("Erro HTTP ao buscar detalhes do filme {}: {}", movieId, e.getMessage());
            throw new TmdbApiException("Erro ao buscar detalhes do filme: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Erro ao buscar detalhes do filme {}: {}", movieId, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar detalhes do filme: " + e.getMessage(), e);
        }
    }

    /**
     * Busca em paralelo detalhes de vários filmes pelo TMDB, aproveitando o cache
     * individual de {@link #getMovieDetails(String, boolean)}. IDs que falharem
     * (404 ou erro de rede) são silenciosamente omitidos do mapa resultante.
     *
     * @param movieIds lista de IDs do TMDB a serem consultados (máx {@value BATCH_MAX_SIZE}).
     * @return mapa com IDs solicitados como chave e detalhes do filme como valor.
     */
    public Map<String, TmdbDTO> getMoviesBatch(List<String> movieIds) {
        if (movieIds == null || movieIds.isEmpty()) return Map.of();
        if (movieIds.size() > BATCH_MAX_SIZE) {
            throw new IllegalArgumentException("Limite de " + BATCH_MAX_SIZE + " filmes por batch excedido");
        }

        MovieService self = selfProvider.getObject();
        return Flux.fromIterable(movieIds)
                .flatMap(id -> Mono.fromCallable(() -> self.getMovieDetails(id, false))
                        .subscribeOn(Schedulers.boundedElastic())
                        .map(dto -> Map.entry(id, dto))
                        .onErrorResume(e -> {
                            logger.warn("Falha ao buscar filme {} no batch: {}", id, e.getMessage());
                            return Mono.empty();
                        }), BATCH_CONCURRENCY)
                .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                .block();
    }

    @Cacheable(value = "moviePopular", key = "#page")
    public TmdbPageDTO<TmdbDTO> getPopularMovies(int page) {
        return fetchPaginatedData("/movie/popular?page=" + page + "&region=BR");
    }

    @Cacheable(value = "moviesNowPlaying", key = "#page")
    public TmdbPageDTO<TmdbDTO> getNowPlayingMovies(int page) {
        return fetchPaginatedData("/movie/now_playing?page=" + page + "&region=BR");
    }

    @Cacheable(value = "moviesTopRated", key = "#page")
    public TmdbPageDTO<TmdbDTO> getTopRatedMovies(int page) {
        return fetchPaginatedData("/movie/top_rated?page=" + page);
    }

    @Cacheable(value = "moviesUpcoming", key = "#page")
    public TmdbPageDTO<TmdbDTO> getUpcomingMovies(int page) {
        return fetchPaginatedData("/movie/upcoming?page=" + page + "&region=BR");
    }
}
