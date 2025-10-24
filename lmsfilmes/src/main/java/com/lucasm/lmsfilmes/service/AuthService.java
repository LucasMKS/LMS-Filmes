package com.lucasm.lmsfilmes.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lucasm.lmsfilmes.dto.AuthDTO;
import com.lucasm.lmsfilmes.dto.EmailRequestDTO;
import com.lucasm.lmsfilmes.dto.ResetPasswordDTO;
import com.lucasm.lmsfilmes.model.PasswordResetToken;
import com.lucasm.lmsfilmes.model.User;
import com.lucasm.lmsfilmes.repository.PasswordResetTokenRepository;
import com.lucasm.lmsfilmes.repository.UserRepository;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final RabbitMQProducer rabbitMQProducer;

    @Autowired
    private UserRepository usersRepo;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    AuthService(RabbitMQProducer rabbitMQProducer) {
        this.rabbitMQProducer = rabbitMQProducer;
    }

    @Transactional
    public String register(AuthDTO registrationRequest) {
        if (usersRepo.findByEmail(registrationRequest.email()).isPresent()) {
            log.warn("Tentativa de registro falhou: E-mail já cadastrado ({})", registrationRequest.email());
            throw new IllegalArgumentException("E-mail já cadastrado.");
        }

        if (usersRepo.findByNickname(registrationRequest.nickname()).isPresent()) {
            log.warn("Tentativa de registro falhou: Nickname já cadastrado ({})", registrationRequest.nickname());
            throw new IllegalArgumentException("Username já cadastrado.");
        }

        User ourUser = new User();
        ourUser.setName(registrationRequest.name());
        ourUser.setEmail(registrationRequest.email());
        ourUser.setNickname(registrationRequest.nickname());
        ourUser.setPassword(passwordEncoder.encode(registrationRequest.password()));

        User savedUser = usersRepo.save(ourUser);
        rabbitMQProducer.sendUserRegistered(savedUser);
        var jwt = jwtUtils.generateToken(savedUser);

        return jwt;
    }

    public String login(AuthDTO loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password()));
        } catch (BadCredentialsException e) {
            log.warn("Login falhou: Credenciais inválidas para o email: {}", loginRequest.email());
            throw new BadCredentialsException("Credenciais inválidas.");
        }

        var user = usersRepo.findByEmail(loginRequest.email())
                .orElseThrow(() -> {
                    log.error("Login falhou: Usuário autenticado mas não encontrado no DB: {}", loginRequest.email());
                    return new UsernameNotFoundException("Usuário não encontrado");
                });

        var jwt = jwtUtils.generateToken(user);
        return jwt;
    }

    @Transactional
    public void forgotPassword(EmailRequestDTO requestDTO) {
        String email = requestDTO.email();
        
        User user = usersRepo.findByEmail(email).orElse(null);

        if (user == null) {
            log.warn(
                    "Reset Silencioso: Email não encontrado no sistema. Nenhuma ação tomada para prevenir enumeração de usuários. Email: {}",
                    email);
            return;
        }

        tokenRepository.findByUserId(user.getId()).ifPresent(token -> {
            tokenRepository.delete(token);
            log.debug("Token antigo de reset de senha removido para o usuário: {}", user.getEmail());
        });

        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setUserId(user.getId());

        tokenRepository.save(tokenEntity);

        // Constrói o link de reset (o frontend roda em http://localhost:3000)
        String resetUrl = "http://localhost:3000/reset-password?token=" + tokenEntity.getToken();

        rabbitMQProducer.sendPasswordReset(user.getEmail(), resetUrl);
        
    }

    @Transactional
    public void resetPassword(ResetPasswordDTO resetPasswordDTO) {
        String token = resetPasswordDTO.getToken();
        String newPassword = resetPasswordDTO.getNewPassword();

        if (token == null || token.trim().isEmpty()) {
            throw new BadCredentialsException("Token é obrigatório");
        }

        if (newPassword == null || newPassword.length() < 6) {
            throw new BadCredentialsException("A senha deve ter no mínimo 6 caracteres");
        }

        PasswordResetToken tokenEntity = tokenRepository.findByToken(token)
                .orElseThrow(() -> {
                    log.warn("Tentativa de reset com token inválido: {}", token);
                    return new BadCredentialsException("Token inválido ou expirado");
                });

        if (tokenEntity.isExpired()) {
            tokenRepository.delete(tokenEntity);
            log.warn("Tentativa de reset com token expirado: {}", token);
            throw new BadCredentialsException("Token inválido ou expirado");
        }

        User user = usersRepo.findById(tokenEntity.getUserId())
                .orElseThrow(() -> {
                    log.error("Usuário não encontrado para o token: {}", token);
                    return new BadCredentialsException("Token inválido ou expirado");
                });

        user.setPassword(passwordEncoder.encode(newPassword));
        usersRepo.save(user);
        tokenRepository.delete(tokenEntity);
    }
}
