package com.lucasm.lmsfilmes.dto;
/**
 * DTO de resposta de autenticação com token e metadados.
 */

public record AuthResponseDTO(
    String token,
    UserResponseDTO user
) {}