package com.lucasm.lmsfavorite.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

/**
 * Utilitário para leitura e validação de tokens JWT no serviço de favoritos.
 */
@Component
public class JWTUtils {

    private final SecretKey Key;

    /**
     * Inicializa o utilitário com a chave secreta usada na assinatura dos tokens.
     *
     * @param secret segredo JWT configurado na aplicação.
     */
    public JWTUtils(@Value("${jwt.auth.secret}") String secret) {
        byte[] keyBytes = Base64.getDecoder().decode(secret.getBytes(StandardCharsets.UTF_8));
        this.Key = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Extrai o e-mail (subject) do usuário a partir do token.
     *
     * @param token token JWT de origem.
     * @return e-mail do usuário contido no token.
     */
    public String extractUsername(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    /**
     * Extrai a role do usuário a partir dos claims do token.
     *
     * @param token token JWT de origem.
     * @return perfil de acesso presente no token.
     */
    public String extractRole(String token) {
        return extractClaims(token, claims -> claims.get("role", String.class));
    }
    
    /**
     * Extrai o identificador do usuário a partir dos claims do token.
     *
     * @param token token JWT de origem.
     * @return id do usuário contido no token.
     */
    public String extractUserId(String token) {
        return extractClaims(token, claims -> claims.get("id", String.class));
    }

    private <T> T extractClaims(String token, Function<Claims, T> claimsTFunction) {
        return claimsTFunction.apply(Jwts.parser().verifyWith(Key).build().parseSignedClaims(token).getPayload());
    }

    /**
     * Verifica se o token ainda está válido (não expirado).
     *
     * @param token token JWT a validar.
     * @return `true` quando o token for válido; caso contrário, `false`.
     */
    public boolean isTokenValid(String token) {
        return !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaims(token, Claims::getExpiration).before(new Date());
    }

}