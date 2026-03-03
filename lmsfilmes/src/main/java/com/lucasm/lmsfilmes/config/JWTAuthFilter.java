package com.lucasm.lmsfilmes.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.lucasm.lmsfilmes.service.JWTUtils;
import com.lucasm.lmsfilmes.service.UserDetailsService;

import java.io.IOException;

/**
 * Filtro responsável por extrair, validar e propagar autenticação JWT no contexto de segurança.
 */
@Component
public class JWTAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    /**
     * Processa a requisição HTTP, validando token JWT e populando o SecurityContext quando válido.
     *
     * @param request requisição HTTP recebida.
     * @param response resposta HTTP em construção.
     * @param filterChain cadeia de filtros do Spring Security.
     * @throws ServletException quando houver falha de processamento no pipeline de filtros.
     * @throws IOException quando ocorrer erro de I/O durante o fluxo do filtro.
     */
   @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

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
            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

            if (jwtUtils.isTokenValid(jwtToken, userDetails)) {
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        }
        filterChain.doFilter(request, response);
    }

    /**
     * Recupera o token de autenticação a partir do cookie `auth_token` ou header `Authorization`.
     *
     * @param request requisição HTTP de origem.
     * @return token JWT quando encontrado; caso contrário, `null`.
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
