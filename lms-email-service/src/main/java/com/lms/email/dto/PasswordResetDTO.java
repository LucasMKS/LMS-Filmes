package com.lms.email.dto;
/**
 * DTO com destinatário e link para e-mail de redefinição de senha.
 */

public record PasswordResetDTO(String recipientEmail, String resetLink) {}
