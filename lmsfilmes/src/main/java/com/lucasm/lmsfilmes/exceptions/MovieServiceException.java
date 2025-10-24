package com.lucasm.lmsfilmes.exceptions;

import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class MovieServiceException extends RuntimeException {
    public MovieServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}