package com.lucasm.lmsfilmes.dto;
/**
 * DTO com dados básicos do usuário autenticado.
 */

public record AuthDTO(String name, String email, String nickname, String password) {
}
