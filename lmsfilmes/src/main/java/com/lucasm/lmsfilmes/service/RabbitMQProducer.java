package com.lucasm.lmsfilmes.service;

import java.time.Instant;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import com.lucasm.lmsfilmes.config.RabbitMQConfig;
import com.lucasm.lmsfilmes.model.User;

record UserRegistrationDTO(String nickname, String email, Instant timestamp) {
}

record PasswordResetDTO(String recipientEmail, String resetLink) {
}

@Service
public class RabbitMQProducer {

    private final RabbitTemplate rabbitTemplate;

    public RabbitMQProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendUserRegistered(User user) {
        UserRegistrationDTO dto = new UserRegistrationDTO(
                user.getNickname(),
                user.getEmail(),
                Instant.now()
        );

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.USER_EXCHANGE,
                RabbitMQConfig.USER_REGISTERED_ROUTING_KEY,
                dto);
    }

    public void sendPasswordReset(String email, String resetLink) {
        PasswordResetDTO dto = new PasswordResetDTO(email, resetLink);

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.USER_EXCHANGE,
                RabbitMQConfig.USER_RESET_PASSWORD_ROUTING_KEY,
                dto);
    }

    public void sendMessage(String message) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.MOVIE_QUEUE, message);
    }

}
