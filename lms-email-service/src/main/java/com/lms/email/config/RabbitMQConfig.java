package com.lms.email.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Constantes Principais
    public static final String USER_EXCHANGE = "user.exchange";
    public static final String USER_REGISTERED_QUEUE = "user.registered.queue";
    public static final String USER_RESET_QUEUE = "user.reset.queue";
    public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";
    public static final String USER_RESET_ROUTING_KEY = "user.reset.password";

    // Constante de Dead Letter
    public static final String DEAD_LETTER_EXCHANGE = USER_EXCHANGE + ".dlx";
    
    // Filas dedicadas para armazenar as mensagens com falha
    public static final String USER_REGISTERED_DLQ = USER_REGISTERED_QUEUE + ".dlq";
    public static final String USER_RESET_DLQ = USER_RESET_QUEUE + ".dlq";

    @Bean
    public TopicExchange userExchange() {
        return new TopicExchange(USER_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange deadLetterExchange() {
        return new TopicExchange(DEAD_LETTER_EXCHANGE, true, false);
    }
    
    @Bean
    public Queue userRegisteredQueue() {
        return QueueBuilder.durable(USER_REGISTERED_QUEUE)
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dead.registered")
                .build();
    }

    @Bean
    public Queue userResetQueue() {
        return QueueBuilder.durable(USER_RESET_QUEUE)
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dead.reset")
                .build();
    }

    @Bean
    public Queue userRegisteredDlq() {
        return new Queue(USER_REGISTERED_DLQ, true);
    }

    @Bean
    public Queue userResetDlq() {
        return new Queue(USER_RESET_DLQ, true);
    }

    @Bean
    public Binding bindUserRegistered(Queue userRegisteredQueue, TopicExchange userExchange) {
        return BindingBuilder.bind(userRegisteredQueue).to(userExchange).with(USER_REGISTERED_ROUTING_KEY);
    }

    @Bean
    public Binding bindUserReset(Queue userResetQueue, TopicExchange userExchange) {
        return BindingBuilder.bind(userResetQueue).to(userExchange).with(USER_RESET_ROUTING_KEY);
    }

    @Bean
    public Binding bindUserRegisteredDlq(Queue userRegisteredDlq, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(userRegisteredDlq)
                .to(deadLetterExchange)
                .with(USER_REGISTERED_ROUTING_KEY);
    }

    @Bean
    public Binding bindUserResetDlq(Queue userResetDlq, TopicExchange deadLetterExchange) {
        return BindingBuilder.bind(userResetDlq)
                .to(deadLetterExchange)
                .with(USER_RESET_ROUTING_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        return template;
    }

}