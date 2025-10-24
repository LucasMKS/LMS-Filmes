package com.lucasm.lmsfilmes.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.lucasm.lmsfilmes.dto.AuthDTO;
import com.lucasm.lmsfilmes.dto.EmailRequestDTO;
import com.lucasm.lmsfilmes.dto.ResetPasswordDTO;
import com.lucasm.lmsfilmes.service.AuthService;

@Controller
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AuthDTO reg) {
        return ResponseEntity.ok(authService.register(reg));
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody AuthDTO req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody EmailRequestDTO requestDTO) {
        authService.forgotPassword(requestDTO);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordDTO resetPasswordDTO) {
        authService.resetPassword(resetPasswordDTO);
        return ResponseEntity.ok().build();
    }
}