package com.lucasm.lmsrating.config;

import com.lucasm.lmsrating.service.JWTUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

/**
 * Filtro que valida JWT e injeta autenticação do usuário no contexto de segurança.
 */
@Component
public class JWTAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JWTUtils jwtUtils;

    /**
     * Processa a requisição, valida o token e configura autenticação no `SecurityContext`.
     *
     * @param request requisição HTTP recebida.
     * @param response resposta HTTP em construção.
     * @param filterChain cadeia de filtros do Spring Security.
     * @throws ServletException quando ocorrer erro no processamento do filtro.
     * @throws IOException quando ocorrer erro de I/O durante o fluxo da requisição.
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String jwtToken = recuperarToken(request);

        if (jwtToken == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String userEmail = null;
        try {
            userEmail = jwtUtils.extractUsername(jwtToken);
        } catch (Exception e) {
            filterChain.doFilter(request, response);
            return;
        }

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtils.isTokenValid(jwtToken)) {
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userEmail, null, new ArrayList<>()
                );
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
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