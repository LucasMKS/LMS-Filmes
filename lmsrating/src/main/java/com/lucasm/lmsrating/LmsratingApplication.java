package com.lucasm.lmsrating;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
/**
 * Classe principal de inicialização do microserviço de avaliações.
 */
public class LmsratingApplication {

	public static void main(String[] args) {
		SpringApplication.run(LmsratingApplication.class, args);
	}

}
