package com.lucasm.lmsrating.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.lucasm.lmsrating.config.RabbitMQConfig;
import com.lucasm.lmsrating.dto.CatalogSyncDTO;

/**
 * Serviço produtor de mensagens RabbitMQ para o microsserviço de avaliações (lmsrating).
 */
@Service
public class RabbitMQProducer {

    private static final Logger log = LoggerFactory.getLogger(RabbitMQProducer.class);
    
    private final RabbitTemplate rabbitTemplate;

    public RabbitMQProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Envia um evento para garantir que o filme exista no catálogo principal (lmsfilmes) 
     * antes de salvar o relacionamento no PostgreSQL.
     *
     * @param dto dados básicos do filme (ID, título, poster).
     */
    public void sendMovieCatalogSync(CatalogSyncDTO dto) {
        log.info("Enviando evento de sincronização de catálogo para o filme ID: {}", dto.getId());
        // Envia para a exchange 'catalog.direct' com a rota 'movie.sync'
        rabbitTemplate.convertAndSend(RabbitMQConfig.CATALOG_EXCHANGE, "movie.sync", dto);
    }

    /**
     * Envia um evento para garantir que a série exista no catálogo principal (lmsfilmes)
     * antes de salvar o relacionamento no PostgreSQL.
     *
     * @param dto dados básicos da série (ID, título, poster).
     */
    public void sendSerieCatalogSync(CatalogSyncDTO dto) {
        log.info("Enviando evento de sincronização de catálogo para a série ID: {}", dto.getId());
        // Envia para a exchange 'catalog.direct' com a rota 'serie.sync'
        rabbitTemplate.convertAndSend(RabbitMQConfig.CATALOG_EXCHANGE, "serie.sync", dto);
    }
    
}