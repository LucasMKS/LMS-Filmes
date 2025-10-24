package com.lms.email.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import com.lms.email.config.RabbitMQConfig;
import com.lms.email.dto.PasswordResetDTO;
import com.lms.email.dto.UserRegistrationDTO;

import jakarta.mail.MessagingException;

@Service
public class EmailConsumer {

    private static final Logger logger = LoggerFactory.getLogger(EmailConsumer.class);

    private final EmailSender emailSender;

    public EmailConsumer(EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    @RabbitListener(queues = RabbitMQConfig.USER_REGISTERED_QUEUE)
    public void consumeUserRegistration(UserRegistrationDTO userDTO) {
        try {
            emailSender.sendWelcomeEmail(userDTO.email(), userDTO.nickname());

        } catch (MessagingException e) {
            logger.error("Erro de mensageria ao enviar email de boas-vindas para {}: {}", 
                         userDTO.email(), e.getMessage());
            
            throw new AmqpRejectAndDontRequeueException("Falha na mensageria do email de registro.", e);
        
        } catch (Exception e) {
            logger.error("Erro inesperado ao processar registro de {}: {}", 
                         userDTO.email(), e.getMessage());
            
            throw new AmqpRejectAndDontRequeueException("Falha inesperada.", e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.USER_RESET_QUEUE)
    public void consumePasswordReset(PasswordResetDTO resetDTO) {
        try {
            emailSender.sendPasswordResetEmail(resetDTO.recipientEmail(), resetDTO.resetLink());

        } catch (MessagingException e) {
            logger.error("Erro de mensageria ao enviar email de reset para {}: {}", 
                         resetDTO.recipientEmail(), e.getMessage());
            throw new AmqpRejectAndDontRequeueException("Falha na mensageria do email de reset.", e);
        
        } catch (Exception e) {
            logger.error("Erro inesperado ao enviar email de reset para {}: {}", 
                         resetDTO.recipientEmail(), e.getMessage());
            throw new AmqpRejectAndDontRequeueException("Falha inesperada no email de reset.", e);
        }
    }
}
