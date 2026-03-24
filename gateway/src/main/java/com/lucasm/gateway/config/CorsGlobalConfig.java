package com.lucasm.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Configuração global de CORS aplicada no gateway.
 */
@Configuration
public class CorsGlobalConfig {

    @Value("${cors.allowed-origins:https://lms-filmes.vercel.app}")
    private String allowedOrigins;

    /**
     * Cria o filtro reativo de CORS com origens, métodos e headers permitidos.
     *
     * @return filtro CORS registrado para todas as rotas.
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(Arrays.asList(
			allowedOrigins,
            "https://lms-filmes.vercel.app",
            "https://lucasmks.me",
            "https://www.lucasmks.me",
			"https://lifeos.lucasmks.com.br",
            "http://localhost:*"
        ));

        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        config.setAllowedHeaders(Arrays.asList("*"));

        config.setAllowCredentials(true);

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}