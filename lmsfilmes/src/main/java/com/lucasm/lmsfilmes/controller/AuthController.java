package com.lucasm.lmsfilmes.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lucasm.lmsfilmes.dto.ApiResponseDTO;
import com.lucasm.lmsfilmes.dto.AuthResponseDTO;
import com.lucasm.lmsfilmes.dto.EmailRequestDTO;
import com.lucasm.lmsfilmes.dto.LoginRequestDTO;
import com.lucasm.lmsfilmes.dto.RegisterRequestDTO;
import com.lucasm.lmsfilmes.dto.ResetPasswordDTO;
import com.lucasm.lmsfilmes.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<AuthResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO reg) {
        
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(reg));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO req) {
        
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponseDTO> forgotPassword(
            @Valid @RequestBody EmailRequestDTO requestDTO) {
        
        authService.forgotPassword(requestDTO);
        return ResponseEntity.ok(new ApiResponseDTO("Se o e-mail existir, um link de redefinição foi enviado."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponseDTO> resetPassword(
            @Valid @RequestBody ResetPasswordDTO resetPasswordDTO) {
        
        authService.resetPassword(resetPasswordDTO);
        return ResponseEntity.ok(new ApiResponseDTO("Senha redefinida com sucesso."));
    }
}