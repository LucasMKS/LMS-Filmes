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

/**
 * Serviço responsável por publicar eventos no RabbitMQ.
 */
@Service
public class RabbitMQProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Inicializa uma nova instância de RabbitMQProducer.
     *
        * @param rabbitTemplate cliente usado para envio de mensagens ao broker.
     */
    public RabbitMQProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publica o evento de cadastro de usuário para envio de e-mail de boas-vindas.
     *
     * @param user usuário recém-cadastrado.
     */
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

    /**
     * Publica o evento de redefinição de senha.
     *
     * @param email e-mail do destinatário da recuperação de senha.
     * @param resetLink link para redefinir a senha.
     */
    public void sendPasswordReset(String email, String resetLink) {
        PasswordResetDTO dto = new PasswordResetDTO(email, resetLink);

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.USER_EXCHANGE,
                RabbitMQConfig.USER_RESET_PASSWORD_ROUTING_KEY,
                dto);
    }

    /**
     * Envia uma mensagem simples para a fila de filmes.
     *
     * @param message conteúdo textual da mensagem.
     */
    public void sendMessage(String message) {
        rabbitTemplate.convertAndSend(RabbitMQConfig.MOVIE_QUEUE, message);
    }

}
