package com.lucasm.lmsfilmes.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.lucasm.lmsfilmes.model.User;

import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.function.Function;
/**
 * Utilitário para geração, leitura e validação de tokens JWT.
 */
@Component
public class JWTUtils {

    private final SecretKey Key;

    private final long expirationTime;

    /**
     * Inicializa o utilitário JWT com chave secreta e tempo de expiração configurados.
     *
     * @param secret segredo utilizado para assinar e validar tokens.
     * @param expirationTime tempo de expiração do token em milissegundos.
     */
    public JWTUtils(@Value("${jwt.auth.secret}") String secret, @Value("${jwt.auth.expiration}") long expirationTime) {
        byte[] keyBytes = Base64.getDecoder().decode(secret.getBytes(StandardCharsets.UTF_8));
        this.Key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationTime = expirationTime;
    }

    /**
     * Gera token JWT básico a partir dos dados do `UserDetails`.
     *
     * @param userDetails usuário autenticado no contexto de segurança.
     * @return token JWT assinado.
     */
    public String generateToken(UserDetails userDetails){
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(Key)
                .compact();
    }

    /**
     * Gera token JWT com claims adicionais de negócio do usuário.
     *
     * @param user entidade de usuário autenticado.
     * @return token JWT assinado contendo claims de identificação e autorização.
     */
    public String generateToken(User user){
        HashMap<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("name", user.getName());
        claims.put("nickname", user.getNickname());
        claims.put("role", user.getRole());
        
        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(Key)
                .compact();
    }
    /**
     * Gera token de refresh com claims informadas.
     *
     * @param claims mapa de claims que serão incluídas no token.
     * @param userDetails usuário associado ao refresh token.
     * @return refresh token JWT assinado.
     */
    public  String generateRefreshToken(HashMap<String, Object> claims, UserDetails userDetails){
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(Key)
                .compact();
    }

    /**
     * Extrai o username (subject) do token.
     *
     * @param token token JWT de origem.
     * @return username contido no token.
     */
    public  String extractUsername(String token){
        return  extractClaims(token, Claims::getSubject);
    }

    /**
     * Extrai o nickname do usuário a partir dos claims do token.
     *
     * @param token token JWT de origem.
     * @return nickname presente nos claims.
     */
    public String extractNickname(String token) {
        return extractClaims(token, claims -> claims.get("nickname", String.class));
    }

    /**
     * Extrai o nome do usuário a partir dos claims do token.
     *
     * @param token token JWT de origem.
     * @return nome presente nos claims.
     */
    public String extractName(String token) {
        return extractClaims(token, claims -> claims.get("name", String.class));
    }

    /**
     * Extrai o identificador do usuário a partir dos claims do token.
     *
     * @param token token JWT de origem.
     * @return identificador do usuário presente no token.
     */
    public String extractUserId(String token) {
        return extractClaims(token, claims -> claims.get("id", String.class));
    }

    /**
     * Extrai o papel (role) do usuário a partir dos claims do token.
     *
     * @param token token JWT de origem.
     * @return role presente no token.
     */
    public String extractRole(String token) {
        return extractClaims(token, claims -> claims.get("role", String.class));
    }

    private <T> T extractClaims(String token, Function<Claims, T> claimsTFunction){
        return claimsTFunction.apply(Jwts.parser().verifyWith(Key).build().parseSignedClaims(token).getPayload());
    }

    /**
     * Verifica se o token pertence ao usuário informado e ainda não expirou.
     *
     * @param token token JWT a validar.
     * @param userDetails usuário esperado para o token.
     * @return `true` quando token for válido para o usuário; caso contrário, `false`.
     */
    public  boolean isTokenValid(String token, UserDetails userDetails){
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    /**
     * Verifica se o token está expirado com base no claim de expiração.
     *
     * @param token token JWT a analisar.
     * @return `true` quando expirado; caso contrário, `false`.
     */
    public  boolean isTokenExpired(String token){
        return extractClaims(token, Claims::getExpiration).before(new Date());
    }


}
