package com.lms.email.dto;

public record UserRegistrationDTO(
    String nickname,
    String email,
    String timestamp) {}
