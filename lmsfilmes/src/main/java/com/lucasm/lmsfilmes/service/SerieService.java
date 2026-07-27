package com.lucasm.lmsfilmes.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lucasm.lmsfilmes.dto.SeasonDTO;
import com.lucasm.lmsfilmes.dto.SeriesDTO;
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
import reactor.util.retry.Retry;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class SerieService {

    private static final Logger logger = LoggerFactory.getLogger(SerieService.class);
    private static final int BATCH_MAX_SIZE = 100;
    private static final int BATCH_CONCURRENCY = 16;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<SerieService> selfProvider;

    public SerieService(WebClient tmdbWebClient, ObjectMapper objectMapper, ObjectProvider<SerieService> selfProvider) {
        this.webClient = tmdbWebClient;
        this.objectMapper = objectMapper;
        this.selfProvider = selfProvider;
    }

    private String withLanguage(String path) {
        return path + (path.contains("?") ? "&" : "?") + "language=pt-BR";
    }

    private boolean isRetryable(Throwable throwable) {
        if (throwable instanceof WebClientResponseException wcre) {
            int status = wcre.getStatusCode().value();
            return status == 429 || status == 500 || status == 502 || status == 503 || status == 504;
        }
        return throwable instanceof TmdbApiException || throwable instanceof java.io.IOException;
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
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, new TypeReference<TmdbPageDTO<SeriesDTO>>() {});
        } catch (Exception e) {
            logger.warn("TMDB indisponível ou instável ao buscar ({}), retornando fallback vazio. Erro: {}", path, e.getMessage());
            return new TmdbPageDTO<>(1, Collections.emptyList(), 0, 0);
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
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, SeriesDTO.class);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (WebClientResponseException e) {
            logger.error("Erro HTTP ao buscar detalhes da série {}: {}", serieId, e.getMessage());
            throw new TmdbApiException("Erro ao buscar detalhes da série: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Erro ao buscar detalhes da série {}: {}", serieId, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar detalhes da série: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "seasonDetails", key = "#serieId + '_' + #seasonNumber")
    public SeasonDTO getSeasonDetails(String serieId, int seasonNumber) {
        try {
            String path = withLanguage("/tv/" + serieId + "/season/" + seasonNumber);

            String body = webClient.get()
                    .uri(path)
                    .retrieve()
                    .onStatus(status -> status.value() == 404, response ->
                            Mono.error(new ResourceNotFoundException("Temporada não encontrada: " + seasonNumber + " para série: " + serieId)))
                    .onStatus(HttpStatusCode::isError, response ->
                            response.bodyToMono(String.class)
                                    .map(err -> new TmdbApiException(
                                            "Erro ao buscar detalhes da temporada: status " + response.statusCode().value())))
                    .bodyToMono(String.class)
                    .retryWhen(Retry.backoff(3, Duration.ofMillis(250))
                            .filter(this::isRetryable))
                    .block();

            return objectMapper.readValue(body, SeasonDTO.class);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Erro ao buscar detalhes da temporada {} da série {}: {}", seasonNumber, serieId, e.getMessage(), e);
            throw new TmdbApiException("Erro ao buscar detalhes da temporada: " + e.getMessage(), e);
        }
    }

    public Map<String, SeriesDTO> getSeriesBatch(List<String> serieIds) {
        if (serieIds == null || serieIds.isEmpty()) return Map.of();
        if (serieIds.size() > BATCH_MAX_SIZE) {
            throw new IllegalArgumentException("Limite de " + BATCH_MAX_SIZE + " séries por batch excedido");
        }

        SerieService self = selfProvider.getObject();
        return Flux.fromIterable(serieIds)
                .flatMap(id -> Mono.fromCallable(() -> self.getSeriesDetails(id, false))
                        .subscribeOn(Schedulers.boundedElastic())
                        .map(dto -> Map.entry(id, dto))
                        .onErrorResume(e -> {
                            logger.warn("Falha ao buscar série {} no batch: {}", id, e.getMessage());
                            return Mono.empty();
                        }), BATCH_CONCURRENCY)
                .collectMap(Map.Entry::getKey, Map.Entry::getValue)
                .block();
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
