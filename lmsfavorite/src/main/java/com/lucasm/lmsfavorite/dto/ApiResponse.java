package com.lucasm.lmsfavorite.dto;
/**
 * DTO genérico de resposta simples da API de favoritos.
 */

public record ApiResponse<T>(
    String message,
    T data
) {}