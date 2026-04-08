package com.lucasm.lmsfavorite.service;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserLookupService {

    private final JdbcTemplate jdbcTemplate;

    public UserLookupService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Cacheable(value = "userIdByEmail", key = "#email")
    public Long getUserIdByEmail(String email) {
        return jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
    }
}
