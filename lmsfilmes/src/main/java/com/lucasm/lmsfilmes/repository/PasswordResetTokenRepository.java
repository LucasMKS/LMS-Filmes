package com.lucasm.lmsfilmes.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.lucasm.lmsfilmes.model.PasswordResetToken;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUserId(Long userId);
}