package com.lucasm.lmsfavorite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
@EnableDiscoveryClient
@EnableScheduling
/**
 * Classe principal de inicialização do microserviço de favoritos e watchlist.
 */
public class LmsfavoriteApplication {

	public static void main(String[] args) {
		SpringApplication.run(LmsfavoriteApplication.class, args);
	}

}