package com.lucasm.lmsfilmes.model;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Document(collection = "passwordResetTokens")
public class PasswordResetToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String token;

    @Indexed
    private String userId;

    private Instant expiryDate;

    public PasswordResetToken() {
        this.token = UUID.randomUUID().toString();
        this.expiryDate = Instant.now().plus(30, ChronoUnit.MINUTES);
    }

    public boolean isExpired() {
        return Instant.now().isAfter(this.expiryDate);
    }

}
