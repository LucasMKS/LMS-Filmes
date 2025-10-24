package com.lms.email.dto;

public record PasswordResetDTO(String recipientEmail, String resetLink) {}
