package com.lucasm.lmsrating.service;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.lucasm.lmsrating.dto.SerieRatingRequestDTO;
import com.lucasm.lmsrating.exceptions.MovieServiceException;
import com.lucasm.lmsrating.exceptions.ResourceNotFoundException;
import com.lucasm.lmsrating.model.Series;
import com.lucasm.lmsrating.repository.SerieRepository;

/**
 * Implementa regras de negócio para criação e consulta de avaliações de séries.
 */
@Service
public class RateSerieService {

    private static final Logger logger = LoggerFactory.getLogger(RateSerieService.class);

    private final SerieRepository serieRepository;

    /**
     * Cria o serviço com o repositório de avaliações de séries.
     *
     * @param serieRepository repositório de avaliações de séries.
     */
    public RateSerieService(SerieRepository serieRepository) {
        this.serieRepository = serieRepository;
    }

    /**
     * Cria ou atualiza a avaliação de uma série para o usuário informado.
     *
     * @param request payload com nota e metadados da série.
     * @param email e-mail do usuário autenticado.
     * @return avaliação persistida.
     * @throws MovieServiceException quando ocorrer falha ao salvar a avaliação.
     */
    @CacheEvict(value = "userRatedSeries", allEntries = true)
    public Series rateSerie(SerieRatingRequestDTO request, String email) {
        try {
            Series serie = serieRepository.findBySerieIdAndEmail(request.getSerieId(), email)
                .orElse(new Series());

            serie.setSerieId(request.getSerieId());
            serie.setEmail(email);
            serie.setRating(request.getRating());
            serie.setComment(request.getComment());
            serie.setTitle(request.getTitle());
            serie.setPoster_path(request.getPoster_path());
            
            return serieRepository.save(serie);

        } catch (Exception e) {
            logger.error("Erro ao salvar avaliação da série {}: {}", request.getSerieId(), e.getMessage(), e);
            throw new MovieServiceException("Erro ao salvar avaliação da série: " + e.getMessage(), e);
        }
    }

    /**
     * Lista avaliações de séries do usuário ordenadas da mais recente para a mais antiga.
     *
     * @param email e-mail do usuário autenticado.
     * @return lista de avaliações de séries.
     * @throws MovieServiceException quando ocorrer falha na consulta.
     */
    @Cacheable(value = "userRatedSeries", key = "#email")
    public List<Series> searchRatedSeries(String email) {
        try {
            List<Series> result = serieRepository.findAllByEmailOrderByCreatedAtDesc(email);
            return result.isEmpty() ? Collections.emptyList() : result;
        } catch (Exception e) {
            logger.error("Erro ao buscar séries avaliadas para o usuário {}: {}", email, e.getMessage(), e);
            throw new MovieServiceException("Erro ao buscar séries avaliadas: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta avaliações de séries com paginação.
     *
     * @param email e-mail do usuário autenticado.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações.
     * @throws MovieServiceException quando ocorrer falha na consulta paginada.
     */
    public Page<Series> searchRatedSeriesPaged(String email, Pageable pageable) {
        try {
            return serieRepository.findAllByEmail(email, pageable);
        } catch (Exception e) {
            logger.error("Erro ao buscar séries paginadas para o usuário {}: {}", email, e.getMessage());
            throw new MovieServiceException("Erro ao buscar séries avaliadas", e);
        }
    }

/**
     * Consulta avaliações de filmes filtrando por um intervalo de notas com paginação.
     *
     * @param email e-mail do usuário autenticado.
     * @param minRating nota mínima.
     * @param maxRating nota máxima.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações filtradas por nota.
     */
    public Page<Series> searchRatedSeriesByRatingRange(String email, double minRating, double maxRating, Pageable pageable) {
        return serieRepository.findByEmailAndRatingRange(email, minRating, maxRating, pageable);
    }

    /**
     * Consulta avaliações de séries filtrando por título com paginação.
     *
     * @param email e-mail do usuário autenticado.
     * @param title termo de busca para o título da série.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações filtradas.
     * @throws MovieServiceException quando ocorrer falha na consulta por título.
     */
    public Page<Series> searchRatedSeriesByTitle(String email, String title, Pageable pageable) {
        try {
            return serieRepository.findByEmailAndTitleContainingIgnoreCase(email, title, pageable);
        } catch (Exception e) {
            logger.error("Erro na busca por título para o usuário {}: {}", email, e.getMessage());
            throw new MovieServiceException("Erro ao buscar séries por título", e);
        }
    }

    /**
     * Obtém a avaliação de uma série específica para um usuário.
     *
     * @param serieId identificador da série.
     * @param email e-mail do usuário autenticado.
     * @return avaliação encontrada.
     * @throws ResourceNotFoundException quando não existir avaliação para a série/usuário.
     */
    public Series getSerieRating(String serieId, String email) {
        return serieRepository.findBySerieIdAndEmail(serieId, email)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Avaliação não encontrada para a série " + serieId
            ));
    }
}
