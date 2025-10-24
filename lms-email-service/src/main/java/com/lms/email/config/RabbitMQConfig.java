package com.lms.email.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Constantes de Chaves e Exchanges
    public static final String USER_EXCHANGE = "user.exchange";
    public static final String USER_REGISTERED_QUEUE = "user.registered.queue";
    public static final String USER_RESET_QUEUE = "user.reset.queue";
    public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";
    public static final String USER_RESET_ROUTING_KEY = "user.reset.password";

    @Bean
    public TopicExchange userExchange() {
        // Garante que o Exchange 'user.exchange' exista no RabbitMQ
        return new TopicExchange(USER_EXCHANGE, true, false);
    }

    // Fila para Registro de Novo Usuário
    @Bean
    public Queue userRegisteredQueue() {
        return new Queue(USER_REGISTERED_QUEUE, true); // Durável
    }

    // Fila para Reset de Senha
    @Bean
    public Queue userResetQueue() {
        return new Queue(USER_RESET_QUEUE, true); // Durável
    }

    // Binding para Registro
    @Bean
    public Binding bindUserRegistered(Queue userRegisteredQueue, TopicExchange userExchange) {
        return BindingBuilder.bind(userRegisteredQueue).to(userExchange).with(USER_REGISTERED_ROUTING_KEY);
    }

    // Binding para Reset de Senha
    @Bean
    public Binding bindUserReset(Queue userResetQueue, TopicExchange userExchange) {
        return BindingBuilder.bind(userResetQueue).to(userExchange).with(USER_RESET_ROUTING_KEY);
    }

    // Configuração do Conversor JSON (Jackson)
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