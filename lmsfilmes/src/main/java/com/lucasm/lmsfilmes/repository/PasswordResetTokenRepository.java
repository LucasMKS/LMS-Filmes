package com.lucasm.lmsfilmes.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.lucasm.lmsfilmes.model.PasswordResetToken;
/**
 * Repositório de tokens de redefinição de senha.
 */

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
    /**
     * Busca o token de redefinição pelo valor gerado.
     *
     * @param token valor textual do token.
     * @return token correspondente, quando existir.
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Busca o token de redefinição associado a um usuário.
     *
     * @param userId identificador do usuário.
     * @return token associado ao usuário, quando existir.
     */
    Optional<PasswordResetToken> findByUserId(String userId);
}
