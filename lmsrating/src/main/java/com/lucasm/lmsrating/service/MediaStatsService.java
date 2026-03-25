package com.lucasm.lmsrating.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.lucasm.lmsrating.dto.MediaBalanceDTO;
import com.lucasm.lmsrating.repository.MovieRepository;
import com.lucasm.lmsrating.repository.SerieRepository;

@Service
public class MediaStatsService {

    private final MovieRepository movieRepository;
    private final SerieRepository serieRepository;
    private final JdbcTemplate jdbcTemplate;

    public MediaStatsService(MovieRepository movieRepository, SerieRepository serieRepository, JdbcTemplate jdbcTemplate) {
        this.movieRepository = movieRepository;
        this.serieRepository = serieRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    private Long getUserIdByEmail(String email) {
        String sql = "SELECT id FROM users WHERE email = ?";
        return jdbcTemplate.queryForObject(sql, Long.class, email);
    }

    public List<MediaBalanceDTO> getMediaBalance(String email) {
        Long userId = getUserIdByEmail(email);

        int totalMovies = movieRepository.findAllByUserIdOrderByCreatedAtDesc(userId).size();
        int totalSeries = serieRepository.findAllByUserIdOrderByCreatedAtDesc(userId).size();

        return List.of(
            new MediaBalanceDTO("Filmes", totalMovies, "#eab308"),
            new MediaBalanceDTO("Séries", totalSeries, "#a855f7")  
        );
    }
}