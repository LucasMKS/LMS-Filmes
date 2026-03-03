package com.lucasm.lmsfilmes.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.lucasm.lmsfilmes.service.UserDetailsService;

/**
 * Define as regras de segurança HTTP e os beans de autenticação da aplicação.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JWTAuthFilter jwtAuthFilter;


    /**
     * Configura a cadeia de filtros de segurança, rotas públicas e autorização por perfil.
     *
     * @param http objeto de configuração de segurança HTTP.
     * @param authenticationProvider provedor de autenticação utilizado no fluxo.
     * @return cadeia de filtros de segurança configurada.
     * @throws Exception quando ocorrer falha durante a configuração da cadeia.
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, AuthenticationProvider authenticationProvider) throws Exception{
        http.csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth-> auth
                    .requestMatchers(
                        "/auth/**", "/series/**", "/movies/**", "/actuator/health",
                        "/lms-filmes/auth/**", "/lms-filmes/series/**", "/lms-filmes/movies/**"
                    ).permitAll()
                    .requestMatchers("/admin/**", "/lms-filmes/admin/**").hasAnyAuthority("ADMIN")
                    .requestMatchers("/user/**", "/lms-filmes/user/**").hasAnyAuthority("USER", "ADMIN")
                    .requestMatchers("/rate/**", "/lms-filmes/rate/**").hasAnyAuthority("ADMIN", "USER")
                    .anyRequest().authenticated()
                )
                .sessionManagement(manager->manager.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Cria o provider de autenticação baseado em usuário/senha.
     *
     * @param passwordEncoder codificador de senha utilizado na comparação de credenciais.
     * @param userDetailsService serviço de carregamento de usuários.
     * @return provider de autenticação configurado.
     */
    @Bean
    AuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder, UserDetailsService userDetailsService){
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService); 
        provider.setPasswordEncoder(passwordEncoder); 
        
        return provider;
    }

    /**
     * Disponibiliza o codificador de senha padrão da aplicação.
     *
     * @return instância de BCrypt para hash de senha.
     */
    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    /**
     * Expõe o AuthenticationManager gerenciado pelo Spring Security.
     *
     * @param authenticationConfiguration configuração central de autenticação.
     * @return gerenciador de autenticação pronto para uso.
     * @throws Exception quando não for possível obter o AuthenticationManager.
     */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception{
        return authenticationConfiguration.getAuthenticationManager();
    }

}