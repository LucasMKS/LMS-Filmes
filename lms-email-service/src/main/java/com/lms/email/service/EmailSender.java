package com.lms.email.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;

@Service
public class EmailSender {
    
    private final JavaMailSender mailSender;

    private final String FROM_ADDRESS;
    private final String FRONT_URL;

    public EmailSender(JavaMailSender mailSender, @Value("${frontend.base-url}") String frontUrl, @Value("${spring.mail.username}") String fromAddress) {
        this.mailSender = mailSender;
        this.FROM_ADDRESS = fromAddress;
        this.FRONT_URL = frontUrl;
    }

    public void sendWelcomeEmail(String toAddress, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(FROM_ADDRESS);
            helper.setTo(toAddress);
            helper.setSubject("Boas vindas ao LMS Filmes!");
            String content = "<html><body>"
                    + "<h1>Bem-vindo ao LMS Filmes, " + userName + "!</h1>"
                    + "<p>Estamos empolgados em tê-lo a bordo. Clique no link abaixo para começar:</p>"
                    + "<a href='" + FRONT_URL + "/'>Começar</a>"
                    + "</body></html>";

            helper.setText(content, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            e.printStackTrace();
            throw new RuntimeException("Falha ao enviar o e-mail", e);
        }
    }

    public void sendPasswordResetEmail(String toAddress, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(FROM_ADDRESS);
            helper.setTo(toAddress);
            helper.setSubject("Solicitação de Redefinição de Senha");
            String content = "<html><body>"
                    + "<h1>Solicitação de Redefinição de Senha</h1>"
                    + "<p>Clique no link abaixo para redefinir sua senha:</p>"
                    + "<a href='" + resetLink + "'>Redefinir Senha</a>"
                    + "</body></html>";

            helper.setText(content, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            e.printStackTrace();
            throw new RuntimeException("Falha ao enviar o e-mail de reset de senha", e);
        }
    }
}
