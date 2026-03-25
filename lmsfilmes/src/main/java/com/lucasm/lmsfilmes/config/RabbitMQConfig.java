package com.lucasm.lmsfilmes.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // --- Filas e Exchanges de Usuário ---
    public static final String MOVIE_QUEUE = "movieQueue";
    public static final String USER_EXCHANGE = "user.exchange";
    public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";
    public static final String USER_RESET_PASSWORD_ROUTING_KEY = "user.reset.password";

    // --- NOVAS Filas e Exchange de Catálogo ---
    public static final String CATALOG_EXCHANGE = "catalog.direct";
    public static final String MOVIE_SYNC_QUEUE = "movie.catalog.sync.queue";
    public static final String SERIE_SYNC_QUEUE = "serie.catalog.sync.queue";

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        return template;
    }

    // --- Beans de Usuário ---
    @Bean
    public TopicExchange userExchange() {
        return new TopicExchange(USER_EXCHANGE, true, false);
    }

    @Bean
    public Queue movieQueue() {
        return new Queue(MOVIE_QUEUE, true);
    }

    // --- Beans de Catálogo ---
    @Bean
    public DirectExchange catalogExchange() {
        return new DirectExchange(CATALOG_EXCHANGE);
    }

    @Bean
    public Queue movieSyncQueue() {
        return new Queue(MOVIE_SYNC_QUEUE, true);
    }

    @Bean
    public Queue serieSyncQueue() {
        return new Queue(SERIE_SYNC_QUEUE, true);
    }

    // Liga a fila de filmes à exchange usando a chave 'movie.sync'
    @Bean
    public Binding movieSyncBinding(Queue movieSyncQueue, DirectExchange catalogExchange) {
        return BindingBuilder.bind(movieSyncQueue).to(catalogExchange).with("movie.sync");
    }

    // Liga a fila de séries à exchange usando a chave 'serie.sync'
    @Bean
    public Binding serieSyncBinding(Queue serieSyncQueue, DirectExchange catalogExchange) {
        return BindingBuilder.bind(serieSyncQueue).to(catalogExchange).with("serie.sync");
    }
}