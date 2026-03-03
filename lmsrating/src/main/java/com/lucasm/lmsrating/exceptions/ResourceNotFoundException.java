package com.lucasm.lmsrating.exceptions;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

/**
 * Exceção para recursos não encontrados no domínio de avaliações.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    /**
     * Cria a exceção com mensagem de recurso ausente.
     *
     * @param message descrição do recurso não encontrado.
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
