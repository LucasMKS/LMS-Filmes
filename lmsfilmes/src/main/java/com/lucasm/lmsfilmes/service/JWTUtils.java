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
@Component
public class JWTUtils {

    private final SecretKey Key;

    private final long expirationTime;

    public JWTUtils(@Value("${jwt.auth.secret}") String secret, @Value("${jwt.auth.expiration}") long expirationTime) {
        byte[] keyBytes = Base64.getDecoder().decode(secret.getBytes(StandardCharsets.UTF_8));
        this.Key = Keys.hmacShaKeyFor(keyBytes);
        this.expirationTime = expirationTime;
    }

    public String generateToken(UserDetails userDetails){
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(Key)
                .compact();
    }

    // Método sobregregado que aceita User e inclui claims customizadas
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
    public  String generateRefreshToken(HashMap<String, Object> claims, UserDetails userDetails){
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(Key)
                .compact();
    }

    public  String extractUsername(String token){
        return  extractClaims(token, Claims::getSubject);
    }

    // Métodos para extrair claims customizadas
    public String extractNickname(String token) {
        return extractClaims(token, claims -> claims.get("nickname", String.class));
    }

    public String extractName(String token) {
        return extractClaims(token, claims -> claims.get("name", String.class));
    }

    public String extractUserId(String token) {
        return extractClaims(token, claims -> claims.get("id", String.class));
    }

    public String extractRole(String token) {
        return extractClaims(token, claims -> claims.get("role", String.class));
    }

    private <T> T extractClaims(String token, Function<Claims, T> claimsTFunction){
        return claimsTFunction.apply(Jwts.parser().verifyWith(Key).build().parseSignedClaims(token).getPayload());
    }

    public  boolean isTokenValid(String token, UserDetails userDetails){
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public  boolean isTokenExpired(String token){
        return extractClaims(token, Claims::getExpiration).before(new Date());
    }


}
