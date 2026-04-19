package com.lucasm.lmsfilmes.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient tmdbWebClient(
            @Value("${tmdb.api.url}") String tmdbApiUrl,
            @Value("${tmdb.api.key}") String apiKey) {
        return WebClient.builder()
                .baseUrl(tmdbApiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
