package com.lucasm.lmsfilmes.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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

    /**
     * Busca em paralelo detalhes de várias séries pelo TMDB, aproveitando o cache
     * individual de {@link #getSeriesDetails(String, boolean)}. IDs que falharem
     * (404 ou erro de rede) são silenciosamente omitidos do mapa resultante.
     *
     * @param serieIds lista de IDs do TMDB a serem consultados (máx {@value BATCH_MAX_SIZE}).
     * @return mapa com IDs solicitados como chave e detalhes da série como valor.
     */
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
