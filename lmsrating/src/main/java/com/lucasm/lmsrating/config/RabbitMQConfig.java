package com.lucasm.lmsrating.config;

import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração de mensageria RabbitMQ para eventos do serviço de avaliações.
 */
@Configuration
public class RabbitMQConfig {

    public static final String RATING_QUEUE = "ratingQueue";
    public static final String USER_EXCHANGE = "user.exchange";
    
    public static final String CATALOG_EXCHANGE = "catalog.direct";

    /**
     * Cria o conversor JSON usado nas mensagens RabbitMQ.
     */
    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Cria o template RabbitMQ com conversão JSON.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        return template;
    }

    /**
     * Declara o exchange de usuários utilizado para roteamento de eventos antigos.
     */
    @Bean
    public TopicExchange userExchange() {
        return new TopicExchange(USER_EXCHANGE, true, false);
    }

    /**
     * Declara a fila de avaliações do serviço.
     */
    @Bean
    public Queue ratingQueue() {
        return new Queue(RATING_QUEUE, true);
    }

    /**
     * Declara o exchange direto para sincronização de catálogo de filmes e séries.
     */
    @Bean
    public DirectExchange catalogExchange() {
        return new DirectExchange(CATALOG_EXCHANGE);
    }
}