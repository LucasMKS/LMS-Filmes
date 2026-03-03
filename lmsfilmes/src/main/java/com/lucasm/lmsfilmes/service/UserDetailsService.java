package com.lucasm.lmsfilmes.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.lucasm.lmsfilmes.repository.UserRepository;


/**
 * Implementação de `UserDetailsService` para carregar usuários no fluxo de autenticação.
 */
@Service
public class UserDetailsService implements org.springframework.security.core.userdetails.UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Cria o serviço com acesso ao repositório de usuários.
     *
     * @param userRepository repositório utilizado para busca de usuários por e-mail.
     */
    public UserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Carrega os dados de segurança do usuário a partir do e-mail.
     *
     * @param email identificador de login do usuário.
     * @return detalhes do usuário para autenticação/autorização.
     * @throws UsernameNotFoundException quando não existir usuário para o e-mail informado.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com e-mail: " + email));
    }
}
