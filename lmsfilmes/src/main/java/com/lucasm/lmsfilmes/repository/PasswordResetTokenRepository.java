package com.lucasm.lmsfilmes.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.lucasm.lmsfilmes.model.PasswordResetToken;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUserId(String userId);
}
