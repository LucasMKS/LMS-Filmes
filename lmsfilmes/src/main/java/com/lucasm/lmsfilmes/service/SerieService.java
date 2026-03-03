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
import java.net.URLEncoder;

/**
 * Serviço responsável por consultar dados de séries na API do TMDB.
 */
@Service
public class SerieService {

    private static final Logger logger = LoggerFactory.getLogger(SerieService.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String tmdbApiUrl;
    private final String apiKey;

    /**
     * Inicializa uma nova instância de SerieService.
     *
      * @param objectMapper serializador usado para converter respostas JSON do TMDB.
      * @param tmdbApiUrl URL base da API do TMDB.
      * @param apiKey token Bearer usado na autenticação das requisições.
     */
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

    /**
     * Busca séries por texto na API do TMDB.
     *
     * @param query termo de pesquisa informado pelo usuário.
     * @param page número da página de resultados.
     * @return página de séries correspondente à busca.
     */
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

    /**
     * Obtém os detalhes completos de uma série pelo identificador.
     *
     * @param serieId identificador da série no TMDB.
     * @return dados detalhados da série.
     */
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

    /**
     * Lista as séries em alta da semana.
     *
     * @param page número da página de resultados.
     * @return página de séries populares.
     */
    @Cacheable(value = "seriesPopular", key = "#page")
    public TmdbPageDTO<SeriesDTO> getPopularSeries(int page) {
        String path = "/trending/tv/week?page=" + page;
        return fetchPaginatedData(path);
    }

    /**
     * Lista as séries com episódio exibido no dia atual.
     *
     * @param page número da página de resultados.
     * @return página de séries exibidas hoje.
     */
    @Cacheable(value = "seriesAiringToday", key = "#page")
    public TmdbPageDTO<SeriesDTO> getAiringTodaySeries(int page) {
        String path = "/tv/airing_today?page=" + page + "&timezone=America%2FSao_Paulo";
        return fetchPaginatedData(path);
    }

    /**
     * Lista séries que estão atualmente em exibição.
     *
     * @param page número da página de resultados.
     * @return página de séries no ar.
     */
    @Cacheable(value = "seriesOnTheAir", key = "#page")
    public TmdbPageDTO<SeriesDTO> getOnTheAirSeries(int page) {
        String path = "/tv/on_the_air?page=" + page + "&timezone=America%2FSao_Paulo";
        return fetchPaginatedData(path);
    }

    /**
     * Lista séries com melhor avaliação no TMDB.
     *
     * @param page número da página de resultados.
     * @return página de séries mais bem avaliadas.
     */
    @Cacheable(value = "seriesTopRated", key = "#page")
    public TmdbPageDTO<SeriesDTO> getTopRatedSeries(int page) {
        String path = "/tv/top_rated?page=" + page;
        return fetchPaginatedData(path);
    }
}
