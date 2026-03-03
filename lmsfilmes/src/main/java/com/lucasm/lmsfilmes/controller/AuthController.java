package com.lucasm.lmsfilmes.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
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

/**
 * Expõe os endpoints de autenticação e recuperação de senha.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * Cria o controller com o serviço de autenticação.
     *
     * @param authService serviço responsável pelas regras de autenticação.
     */
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Endpoint de cadastro de usuário.
     *
     * @param reg dados de cadastro enviados pelo cliente.
     * @return resposta com token e dados do usuário criado.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<AuthResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO reg) {
        
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(reg));
    }

    /**
     * Endpoint de login com criação de cookie de autenticação.
     *
     * @param req credenciais de acesso.
     * @return resposta com token e dados do usuário autenticado.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO req) {
        
        AuthResponseDTO authResponse = authService.login(req);

        ResponseCookie cookie = ResponseCookie.from("auth_token", authResponse.token())
                .httpOnly(true)
                .secure(false)
                .path("/") 
                .maxAge(24 * 60 * 60)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(authResponse);
    }

    /**
     * Endpoint de logout com expiração imediata do cookie de autenticação.
     *
     * @return resposta sem corpo confirmando encerramento de sessão.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie cookie = ResponseCookie.from("auth_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0) 
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    /**
     * Endpoint para solicitação de recuperação de senha.
     *
     * @param requestDTO e-mail informado para recuperação.
     * @return mensagem de confirmação do fluxo de recuperação.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponseDTO> forgotPassword(
            @Valid @RequestBody EmailRequestDTO requestDTO) {
        
        authService.forgotPassword(requestDTO);
        return ResponseEntity.ok(new ApiResponseDTO("Se o e-mail existir, um link de redefinição foi enviado."));
    }

    /**
     * Endpoint para redefinição de senha com token.
     *
     * @param resetPasswordDTO token e nova senha.
     * @return mensagem de confirmação da redefinição.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponseDTO> resetPassword(
            @Valid @RequestBody ResetPasswordDTO resetPasswordDTO) {
        
        authService.resetPassword(resetPasswordDTO);
        return ResponseEntity.ok(new ApiResponseDTO("Senha redefinida com sucesso."));
    }
}