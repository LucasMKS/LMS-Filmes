package com.lucasm.lmsfilmes.dto;

import com.lucasm.lmsfilmes.model.User;

public record UserResponseDTO(
    String id,
    String name,
    String email,
    String nickname,
    String role
) {
    public UserResponseDTO(User user) {
        this(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getNickname(),
            user.getRole()
        );
    }
}