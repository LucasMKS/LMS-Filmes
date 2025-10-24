package com.lms.email.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import com.lms.email.config.RabbitMQConfig;

record UserRegistrationDTO(String nickname, String email, String timestamp) {
}

record PasswordResetDTO(String recipientEmail, String resetLink) {
}

@Service
public class EmailConsumer {

    private static final Logger logger = LoggerFactory.getLogger(EmailConsumer.class);

    private final EmailSender emailSender;

    public EmailConsumer(EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    @RabbitListener(queues = RabbitMQConfig.USER_REGISTERED_QUEUE)
    public void consumeUserRegistration(UserRegistrationDTO userDTO) {
        logger.info("Nome: {}, Email: {}", userDTO.nickname(), userDTO.email());
        logger.info("Enviando email de boas-vindas para {} ({})...", userDTO.nickname(), userDTO.email());
        try {
            
            emailSender.sendWelcomeEmail(userDTO.email(), userDTO.nickname());

            logger.info("Email enviado com sucesso para: {}", userDTO.email());

        } catch (Exception e) {
            logger.error("Erro ao enviar email de boas-vindas para {}: {}", userDTO.email(), e.getMessage());
            throw new RuntimeException("Falha no processamento do email de registro.", e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.USER_RESET_QUEUE)
    public void consumePasswordReset(PasswordResetDTO resetDTO) {
        logger.warn("Evento de Reset de Senha Recebido para: {}", resetDTO.recipientEmail());

        try {
            logger.warn("Enviando email de reset para {} com link: {}",
                    resetDTO.recipientEmail(), resetDTO.resetLink());

            emailSender.sendPasswordResetEmail(resetDTO.recipientEmail(), resetDTO.resetLink());

            logger.warn("Email de reset de senha enviado com sucesso.");

        } catch (Exception e) {
            logger.error("Erro ao enviar email de reset para {}: {}", resetDTO.recipientEmail(), e.getMessage());
            throw new RuntimeException("Falha no processamento do email de reset.", e);
        }
    }
}
