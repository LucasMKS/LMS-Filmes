package com.lucasm.lmsfilmes.exceptions;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

/**
 * Exceção para recursos não encontrados na aplicação.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    /**
     * Inicializa uma nova instância de ResourceNotFoundException.
     *
        * @param message mensagem descritiva do recurso ausente.
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
