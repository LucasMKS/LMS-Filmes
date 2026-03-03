package com.lucasm.lmsfilmes.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configuração do builder de WebClient da aplicação.
 */
@Configuration
public class WebClientConfig {

    /**
     * Cria o builder base de WebClient.
     *
     * @return builder de WebClient para chamadas HTTP externas.
     */
    @Bean
    WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
