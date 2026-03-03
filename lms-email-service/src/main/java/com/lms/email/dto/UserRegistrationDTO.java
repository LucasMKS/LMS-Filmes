package com.lms.email.dto;
/**
 * DTO com os dados do usuário para envio de e-mail de boas-vindas.
 */

public record UserRegistrationDTO(
    String nickname,
    String email,
    String timestamp) {}
