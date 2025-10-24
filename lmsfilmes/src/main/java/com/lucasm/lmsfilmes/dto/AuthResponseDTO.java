package com.lucasm.lmsfilmes.dto;

public record AuthResponseDTO(
    String token,
    UserResponseDTO user
) {}