package com.lms.email.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;

/**
 * Serviço responsável por montar e enviar e-mails transacionais.
 */
@Service
public class EmailSender {
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    private final String FROM_ADDRESS;
    private final String FRONT_URL;

    /**
     * Inicializa uma nova instância de EmailSender.
     *
      * @param mailSender componente de envio de e-mail.
      * @param templateEngine mecanismo para renderizar templates HTML.
      * @param frontUrl URL base do frontend usada nos links dos e-mails.
      * @param fromAddress endereço remetente configurado.
     */
    public EmailSender(JavaMailSender mailSender, TemplateEngine templateEngine, @Value("${frontend.base-url}") String frontUrl, @Value("${spring.mail.username}") String fromAddress) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;   
        this.FROM_ADDRESS = fromAddress;
        this.FRONT_URL = frontUrl;
    }

    /**
     * Envia e-mail de boas-vindas para um novo usuário.
     *
     * @param toAddress e-mail do destinatário.
     * @param userName nome exibido no conteúdo da mensagem.
     * @throws MessagingException quando ocorrer falha na montagem ou envio do e-mail.
     */
    public void sendWelcomeEmail(String toAddress, String userName) throws MessagingException {
        Context context = new Context();
        context.setVariable("userName", userName);
        context.setVariable("welcomeUrl", FRONT_URL + "/login");

        String htmlBody = templateEngine.process("welcome-email", context);

        sendHtmlEmail(toAddress, "Boas-vindas ao LMS Filmes!", htmlBody);
    }

    /**
     * Envia e-mail com link de redefinição de senha.
     *
     * @param toAddress e-mail do destinatário.
     * @param resetLink link de redefinição gerado para o usuário.
     * @throws MessagingException quando ocorrer falha na montagem ou envio do e-mail.
     */
    public void sendPasswordResetEmail(String toAddress, String resetLink) throws MessagingException {
        Context context = new Context();
        context.setVariable("resetUrl", resetLink);

        String htmlBody = templateEngine.process("reset-password-email", context);

        sendHtmlEmail(toAddress, "Solicitação de Redefinição de Senha", htmlBody);
    }

    private void sendHtmlEmail(String toAddress, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8"); 

        helper.setFrom(FROM_ADDRESS);
        helper.setTo(toAddress);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);

        mailSender.send(message);
    }
}
