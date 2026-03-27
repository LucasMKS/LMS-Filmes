package com.lucasm.lmsfavorite.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.lucasm.lmsfavorite.config.RabbitMQConfig;
import com.lucasm.lmsfavorite.dto.CatalogSyncDTO;

@Service
public class RabbitMQProducer {

    private static final Logger log = LoggerFactory.getLogger(RabbitMQProducer.class);
    
    private final RabbitTemplate rabbitTemplate;

    public RabbitMQProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendMovieCatalogSync(CatalogSyncDTO dto) {
        log.info("Favoritos: Solicitando sincronização do filme ID: {}", dto.getId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.CATALOG_EXCHANGE, "movie.sync", dto);
    }

    public void sendSerieCatalogSync(CatalogSyncDTO dto) {
        log.info("Favoritos: Solicitando sincronização da série ID: {}", dto.getId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.CATALOG_EXCHANGE, "serie.sync", dto);
    }

    public void sendMediaNotification(String message) {
        log.info("LMS Favorites: Enviando sugestão de mídia para o Telegram...");
        
        Message amqpMessage = MessageBuilder
                .withBody(message.getBytes(java.nio.charset.StandardCharsets.UTF_8))
                .setContentType(MessageProperties.CONTENT_TYPE_TEXT_PLAIN)
                .build();

        rabbitTemplate.send("notification.exchange", "notify.media", amqpMessage);
    }
}