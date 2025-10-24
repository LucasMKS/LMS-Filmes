package com.lucasm.lmsfavorite.dto;

public record ApiResponse<T>(
    String message,
    T data
) {}