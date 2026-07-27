package com.lucasm.lmsfilmes.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.util.HashMap;
import java.util.Map;

/**
 * Handler global para padronizar respostas de erro da API.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Trata erros de argumento inválido retornando HTTP 400.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Trata usuário não encontrado retornando HTTP 404.
     */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUsernameNotFoundException(UsernameNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Trata recurso não encontrado retornando HTTP 404.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Trata erros da API externa do TMDB (502, timeouts, rate limits) retornando HTTP 503 Service Unavailable.
     */
    @ExceptionHandler(TmdbApiException.class)
    public ResponseEntity<Map<String, String>> handleTmdbApiException(TmdbApiException ex) {
        log.warn("Serviço TMDB externo instável ou indisponível: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "TMDB Service Unavailable");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }

    /**
     * Trata falha de autenticação retornando HTTP 401.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(BadCredentialsException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Trata erros de validação de campos retornando HTTP 400.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
            errors.put(err.getField(), err.getDefaultMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    /**
     * Trata desconexão prematura de clientes sem poluir os logs.
     */
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleBrokenPipe(AsyncRequestNotUsableException ex) {
        log.debug("Cliente desconectou antes do término da resposta: {}", ex.getMessage());
    }

    /**
     * Trata exceções não mapeadas retornando HTTP 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        log.error("Erro interno capturado pelo ControllerAdvice: ", ex);

        Map<String, String> error = new HashMap<>();
        error.put("error", "Internal Server Error");
        error.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
