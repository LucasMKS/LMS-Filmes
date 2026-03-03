package com.lucasm.lmsfilmes.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exceção para falhas de integração com a API do TMDB.
 */
@ResponseStatus(HttpStatus.BAD_GATEWAY)
public class TmdbApiException extends RuntimeException {

    /**
     * Inicializa uma nova instância de TmdbApiException.
     *
        * @param message mensagem descritiva do erro.
     */
    public TmdbApiException(String message) {
        super(message);
    }

    /**
     * Inicializa uma nova instância de TmdbApiException.
     *
        * @param message mensagem descritiva do erro.
        * @param cause causa original da falha.
     */
    public TmdbApiException(String message, Throwable cause) {
        super(message, cause);
    }
}