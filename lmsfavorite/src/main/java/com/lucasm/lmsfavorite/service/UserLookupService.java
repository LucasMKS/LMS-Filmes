package com.lucasm.lmsfavorite.service;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserLookupService {

    private final JdbcTemplate jdbcTemplate;
    private final CacheManager cacheManager;

    public UserLookupService(JdbcTemplate jdbcTemplate, CacheManager cacheManager) {
        this.jdbcTemplate = jdbcTemplate;
        this.cacheManager = cacheManager;
    }

    public Long getUserIdByEmail(String email) {
        Cache cache = cacheManager.getCache("userIdByEmail");
        if (cache != null) {
            Cache.ValueWrapper wrapper = cache.get(email);
            if (wrapper != null) {
                Object value = wrapper.get();
                if (value instanceof Number) {
                    return ((Number) value).longValue();
                }
            }
        }

        Long userId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);

        if (cache != null && userId != null) {
            cache.put(email, userId);
        }

        return userId;
    }
}
