package com.lucasm.lmsfilmes.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ResetPasswordDTO {

    @JsonProperty("token")
    private String token;

    @JsonProperty("newPassword")
    private String newPassword;

    public ResetPasswordDTO() {
    }

    public ResetPasswordDTO(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    @Override
    public String toString() {
        return "ResetPasswordDTO{" +
                "token='" + token + '\'' +
                ", newPassword='[PROTECTED]'" +
                '}';
    }
}