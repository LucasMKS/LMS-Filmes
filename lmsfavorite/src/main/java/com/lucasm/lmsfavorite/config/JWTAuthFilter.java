package com.lucasm.lmsfavorite.config;

import com.lucasm.lmsfavorite.service.JWTUtils;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

/**
 * Filtro que valida JWT e injeta autenticação do usuário no contexto de segurança.
 */
@Component
public class JWTAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JWTUtils jwtUtils;

    /**
     * Processa a requisição, valida o token e configura autoridades do usuário autenticado.
     *
     * @param request requisição HTTP recebida.
     * @param response resposta HTTP em construção.
     * @param filterChain cadeia de filtros do Spring Security.
     * @throws ServletException quando ocorrer erro no processamento do filtro.
     * @throws IOException quando ocorrer erro de I/O durante o fluxo da requisição.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        final String jwtToken = recuperarToken(request);

        if (jwtToken == null) {
            System.out.println("[LMS-FAVORITE] Requisicão sem token interceptada para: " + request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        String userEmail = null;

        try {
            userEmail = jwtUtils.extractUsername(jwtToken);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtUtils.isTokenValid(jwtToken)) {
                    
                    String role = jwtUtils.extractRole(jwtToken);

                    if (role == null || role.isBlank()) {
                        role = "USER";
                    }
                    
                    List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));

                    System.out.println("[LMS-FAVORITE] Liberando acesso para: " + userEmail + " com permissão: " + authorities);

                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userEmail,
                            null,
                            authorities
                    );
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            }
        } catch (JwtException e) {
            System.out.println("[LMS-FAVORITE] Erro crítico ao validar token: " + e.getMessage());
            logger.error("[LMS-FAVORITE ERROR] Erro ao processar o token JWT: " + e.getClass().getName() + " - " + e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Recupera o JWT do cookie `auth_token` ou do header `Authorization`.
     *
     * @param request requisição HTTP de origem.
     * @return token JWT encontrado; caso não exista, retorna `null`.
     */
    private String recuperarToken(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("auth_token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }
}