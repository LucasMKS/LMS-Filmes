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

import com.lucasm.lmsrating.dto.RatingRequestDTO;
import com.lucasm.lmsrating.exceptions.MovieServiceException;
import com.lucasm.lmsrating.exceptions.ResourceNotFoundException;
import com.lucasm.lmsrating.model.Movies;
import com.lucasm.lmsrating.repository.MovieRepository;

/**
 * Implementa regras de negócio para criação e consulta de avaliações de filmes.
 */
@Service
public class RateMovieService {

    private static final Logger logger = LoggerFactory.getLogger(RateMovieService.class);


    private final MovieRepository movieRepository;

    /**
     * Cria o serviço com o repositório de avaliações de filmes.
     *
     * @param movieRepository repositório de avaliações de filmes.
     */
    public RateMovieService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    /**
     * Cria ou atualiza a avaliação de um filme para o usuário informado.
     *
     * @param request payload com nota e metadados do filme.
     * @param email e-mail do usuário autenticado.
     * @return avaliação persistida.
     * @throws MovieServiceException quando ocorrer falha ao salvar a avaliação.
     */
    @CacheEvict(value = "userRatedMovies", allEntries = true)
    public Movies rateMovie(RatingRequestDTO request, String email) {
        try {
            Movies movie = movieRepository.findByMovieIdAndEmail(request.getMovieId(), email)
                .orElse(new Movies());

            movie.setMovieId(request.getMovieId());
            movie.setEmail(email);
            movie.setRating(request.getRating());
            movie.setComment(request.getComment());
            movie.setTitle(request.getTitle());
            movie.setPoster_path(request.getPoster_path());
            
            return movieRepository.save(movie);

        } catch (Exception e) {
            throw new MovieServiceException("Erro ao salvar avaliação do filme: " + e.getMessage(), e);
        }
    }

    /**
     * Lista avaliações de filmes do usuário ordenadas da mais recente para a mais antiga.
     *
     * @param email e-mail do usuário autenticado.
     * @return lista de avaliações de filmes.
     * @throws MovieServiceException quando ocorrer falha na consulta.
     */
    @Cacheable(value = "userRatedMovies", key = "#email")
    public List<Movies> searchRatedMovies(String email) {
        try {
            List<Movies> result = movieRepository.findAllByEmailOrderByCreatedAtDesc(email);
            return result.isEmpty() ? Collections.emptyList() : result;
        } catch (Exception e) {
            logger.error("Erro ao buscar filmes avaliados para o usuário {}: {}", email, e.getMessage(), e);
            throw new MovieServiceException("Erro ao buscar filmes avaliados: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta avaliações de filmes com paginação.
     *
     * @param email e-mail do usuário autenticado.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações.
     */
    public Page<Movies> searchRatedMoviesPaged(String email, Pageable pageable) {
        return movieRepository.findAllByEmail(email, pageable);
    }

    /**
     * Consulta avaliações de filmes filtrando por título com paginação.
     *
     * @param email e-mail do usuário autenticado.
     * @param title termo de busca para o título do filme.
     * @param pageable parâmetros de paginação/ordenação.
     * @return página de avaliações filtradas.
     */
    public Page<Movies> searchRatedMoviesByTitle(String email, String title, Pageable pageable) {
        return movieRepository.findByEmailAndTitleContainingIgnoreCase(email, title, pageable);
    }

    /**
     * Obtém a avaliação de um filme específico para um usuário.
     *
     * @param movieId identificador do filme.
     * @param email e-mail do usuário autenticado.
     * @return avaliação encontrada.
     * @throws ResourceNotFoundException quando não existir avaliação para o filme/usuário.
     */
    public Movies getMovieRating(String movieId, String email) {
        return movieRepository.findByMovieIdAndEmail(movieId, email)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Avaliação não encontrada para o filme " + movieId + " e usuário " + email
            ));
    }
}