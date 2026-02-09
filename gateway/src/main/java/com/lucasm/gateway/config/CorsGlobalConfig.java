package com.lucasm.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsGlobalConfig {

    @Value("${cors.allowed-origins:https://lms-filmes.vercel.app}")
    private String allowedOrigins;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Permite múltiplas origens (produção + desenvolvimento)
        config.setAllowedOriginPatterns(Arrays.asList(
            "https://lms-filmes.vercel.app",
            "http://localhost:3000",
            "http://localhost:*"
        ));

        // Permite todos os métodos HTTP
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Permite todos os headers
        config.setAllowedHeaders(Arrays.asList("*"));

        // Permite credenciais (cookies, authorization headers)
        config.setAllowCredentials(true);

        // Cache do preflight por 1 hora
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}