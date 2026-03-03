package com.lucasm.lmsfavorite;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
@EnableDiscoveryClient
/**
 * Classe principal de inicialização do microserviço de favoritos e watchlist.
 */
public class LmsfavoriteApplication {

	public static void main(String[] args) {
		SpringApplication.run(LmsfavoriteApplication.class, args);
	}

}