package com.lucasm.lmsfilmes.model;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@CompoundIndex(def = "{'userId': 1, 'token': 1}", unique = true)
@Document(collection = "passwordResetTokens")
public class PasswordResetToken {

    @Id
    private String id;

    private String token;

    private String userId;

    private Instant expiryDate;

    public PasswordResetToken() {
        this.token = UUID.randomUUID().toString();
        this.expiryDate = Instant.now().plus(15, ChronoUnit.MINUTES);
    }

    public boolean isExpired() {
        return Instant.now().isAfter(this.expiryDate);
    }

}
