package com.lucasm.lmsrating.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.lucasm.lmsrating.exceptions.MovieServiceException;
import com.lucasm.lmsrating.model.Movies;
import com.lucasm.lmsrating.repository.MovieRepository;

@Service
public class RateMovieService {

    private static final Logger logger = LoggerFactory.getLogger(RateMovieService.class);

    @Autowired
    private MovieRepository movieRepository;
    
    @CacheEvict(value = "userRatedMovies", key = "#email")
    public Movies rateMovie(String movieId, String email, String rating, String title, String poster_path, String comment) {
        try {
            Optional<Movies> optionalMovie = movieRepository.findByMovieIdAndEmail(movieId, email);
            if (optionalMovie.isPresent()) {
                Movies existing = optionalMovie.get();
                updateRateMovie(rating, comment, existing);
                return existing;
            }

            Movies movie = new Movies();
            movie.setMovieId(movieId);
            movie.setEmail(email);
            movie.setMyVote(rating);
            movie.setComment(comment);
            movie.setTitle(title);
            movie.setPoster_path(poster_path);
            movie.onCreate();
            movieRepository.save(movie);

            return movie;

        } catch (Exception e) {
            logger.error("Erro ao salvar avaliação do filme {}: {}", movieId, e.getMessage(), e);
            throw new MovieServiceException("Erro ao salvar avaliação do filme: " + e.getMessage(), e);
        }
    }

    @Cacheable(value = "userRatedMovies", key = "#email")
    public List<Movies> searchRatedMovies(String email) {
        try {
            List<Movies> result = movieRepository.findAllByEmail(email);
            if (!result.isEmpty()) {
                return result;
            }
        } catch (Exception e) {
            logger.error("Erro ao buscar filmes avaliados para o usuário {}: {}", email, e.getMessage(), e);
        }
        return null;
    }
         
    @CacheEvict(value = "userRatedMovies", key = "#existing.email")
    public Movies updateRateMovie(String rating, String comment, Movies existing) {
        try {
            existing.setMyVote(rating);
            existing.setComment(comment);
            movieRepository.save(existing);
            return existing;
        } catch (Exception e) {
            logger.error("Erro ao atualizar avaliação do filme: {}", e.getMessage(), e);
        }
        return null;
    }

    @CacheEvict(value = "userRatedMovies", key = "#email")
    public Movies getMovieRating(String movieId, String email) {
        try {
            Optional<Movies> optionalMovie = movieRepository.findByMovieIdAndEmail(movieId, email);
            if (optionalMovie.isPresent()) {
                return optionalMovie.get();
            }
        } catch (Exception e) {
            logger.error("Erro ao buscar avaliação do filme {} para o usuário {}: {}", movieId, email, e.getMessage(), e);
        }
        return null;
    }
}