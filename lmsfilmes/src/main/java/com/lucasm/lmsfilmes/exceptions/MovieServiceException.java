package com.lucasm.lmsfilmes.exceptions;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

/**
 * Exceção para erros internos no processamento de filmes.
 */
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class MovieServiceException extends RuntimeException {
    /**
     * Inicializa uma nova instância de MovieServiceException.
     *
        * @param message mensagem descritiva do erro.
        * @param cause causa original da falha.
     */
    public MovieServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}