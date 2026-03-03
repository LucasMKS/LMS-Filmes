package com.lucasm.lmsfilmes.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuração de filas, exchange e template do RabbitMQ.
 */
@Configuration
public class RabbitMQConfig {

    public static final String MOVIE_QUEUE = "movieQueue";
    public static final String USER_EXCHANGE = "user.exchange";
    public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";
    public static final String USER_RESET_PASSWORD_ROUTING_KEY = "user.reset.password";

    /**
     * Cria o conversor de mensagens JSON para o RabbitMQ.
     *
     * @return conversor Jackson para serialização de mensagens.
     */
    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Cria o template de envio de mensagens para o RabbitMQ.
     *
     * @param connectionFactory fábrica de conexões do broker.
     * @param converter conversor JSON usado no corpo das mensagens.
     * @return template de publicação configurado.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        return template;
    }

    /**
     * Declara a exchange de tópicos para eventos de usuário.
     *
     * @return exchange de usuário configurada como durável.
     */
    @Bean
    public TopicExchange userExchange() {
        return new TopicExchange(USER_EXCHANGE, true, false);
    }

    /**
     * Declara a fila usada para mensagens de filmes.
     *
     * @return fila de filmes configurada como durável.
     */
    @Bean
    public Queue movieQueue() {
        return new Queue(MOVIE_QUEUE, true);
    }
}
