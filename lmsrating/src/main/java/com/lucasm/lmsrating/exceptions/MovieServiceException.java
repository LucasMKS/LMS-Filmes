package com.lucasm.lmsrating.exceptions;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

/**
 * Exceção de falhas de serviço relacionadas ao fluxo de avaliações.
 */
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class MovieServiceException extends RuntimeException {
    /**
     * Cria a exceção com mensagem e causa original.
     *
     * @param message descrição do erro.
     * @param cause exceção original que disparou a falha.
     */
    public MovieServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}