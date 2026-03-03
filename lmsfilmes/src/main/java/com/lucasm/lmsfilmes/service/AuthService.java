package com.lucasm.lmsfilmes.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lucasm.lmsfilmes.dto.AuthResponseDTO;
import com.lucasm.lmsfilmes.dto.EmailRequestDTO;
import com.lucasm.lmsfilmes.dto.LoginRequestDTO;
import com.lucasm.lmsfilmes.dto.RegisterRequestDTO;
import com.lucasm.lmsfilmes.dto.ResetPasswordDTO;
import com.lucasm.lmsfilmes.dto.UserResponseDTO;
import com.lucasm.lmsfilmes.model.PasswordResetToken;
import com.lucasm.lmsfilmes.model.User;
import com.lucasm.lmsfilmes.repository.PasswordResetTokenRepository;
import com.lucasm.lmsfilmes.repository.UserRepository;

/**
 * Orquestra os fluxos de autenticação e recuperação de senha.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final RabbitMQProducer rabbitMQProducer;
    private final UserRepository usersRepo;
    private final PasswordResetTokenRepository tokenRepository;
    private final JWTUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final String frontendBaseUrl;

    /**
     * Cria o serviço com as dependências de autenticação, persistência e mensageria.
     *
     * @param rabbitMQProducer produtor de eventos para notificação por e-mail.
     * @param usersRepo repositório de usuários.
     * @param tokenRepository repositório de tokens de reset de senha.
     * @param jwtUtils utilitário para geração e validação de JWT.
     * @param authenticationManager gerenciador de autenticação do Spring Security.
     * @param passwordEncoder codificador de senha.
     * @param frontendBaseUrl URL base do frontend para compor links de recuperação.
     */
    public AuthService(RabbitMQProducer rabbitMQProducer, UserRepository usersRepo,
                       PasswordResetTokenRepository tokenRepository, JWTUtils jwtUtils,
                       AuthenticationManager authenticationManager, PasswordEncoder passwordEncoder,
                       @Value("${frontend.base-url}") String frontendBaseUrl) {
        this.rabbitMQProducer = rabbitMQProducer;
        this.usersRepo = usersRepo;
        this.tokenRepository = tokenRepository;
        this.jwtUtils = jwtUtils;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    /**
     * Registra um novo usuário, valida unicidade de e-mail/nickname e retorna sessão autenticada.
     *
     * @param registrationRequest dados de cadastro do usuário.
     * @return token JWT e dados públicos do usuário criado.
     * @throws ResponseStatusException quando e-mail ou nickname já estiverem cadastrados.
     */
    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO registrationRequest) {
        if (usersRepo.findByEmail(registrationRequest.email()).isPresent()) {
            log.warn("Tentativa de registro falhou: E-mail já cadastrado ({})", registrationRequest.email());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        }

        if (usersRepo.findByNickname(registrationRequest.nickname()).isPresent()) {
            log.warn("Tentativa de registro falhou: Nickname já cadastrado ({})", registrationRequest.nickname());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nickname já cadastrado.");
        }

        User ourUser = new User();
        ourUser.setName(registrationRequest.name());
        ourUser.setEmail(registrationRequest.email());
        ourUser.setNickname(registrationRequest.nickname());
        ourUser.setPassword(passwordEncoder.encode(registrationRequest.password()));

        User savedUser = usersRepo.save(ourUser);
        rabbitMQProducer.sendUserRegistered(savedUser);
        
        var jwt = jwtUtils.generateToken(savedUser);
        
        return new AuthResponseDTO(jwt, new UserResponseDTO(savedUser));
    }

    /**
     * Autentica credenciais e retorna uma nova sessão JWT para o usuário.
     *
     * @param loginRequest credenciais de login.
     * @return token JWT e dados públicos do usuário autenticado.
     * @throws BadCredentialsException quando as credenciais forem inválidas.
     * @throws UsernameNotFoundException quando o usuário autenticado não for encontrado no banco.
     */
    public AuthResponseDTO login(LoginRequestDTO loginRequest) {
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
        
        return new AuthResponseDTO(jwt, new UserResponseDTO(user));
    }

    /**
     * Inicia o fluxo de recuperação de senha gerando token e enviando link por mensageria.
     *
     * @param requestDTO e-mail informado para recuperação de senha.
     */
    @Transactional
    public void forgotPassword(EmailRequestDTO requestDTO) {
        String email = requestDTO.email();
        
        usersRepo.findByEmail(email).ifPresent(user -> {
            log.info("Iniciando processo de reset de senha para: {}", email);
            
            tokenRepository.findByUserId(user.getId()).ifPresent(token -> {
                tokenRepository.delete(token);
                log.debug("Token antigo de reset de senha removido para o usuário: {}", user.getEmail());
            });

            PasswordResetToken tokenEntity = new PasswordResetToken();
            tokenEntity.setUserId(user.getId());
            tokenRepository.save(tokenEntity);

            String resetUrl = frontendBaseUrl + "/reset-password?token=" + tokenEntity.getToken();

            rabbitMQProducer.sendPasswordReset(user.getEmail(), resetUrl);
        });

        if (usersRepo.findByEmail(email).isEmpty()) {
            log.warn("Reset Silencioso: Email não encontrado: {}. Nenhuma ação tomada.", email);
        }
    }

    /**
     * Redefine a senha de um usuário a partir de um token de recuperação válido.
     *
     * @param resetPasswordDTO token de recuperação e nova senha.
     * @throws BadCredentialsException quando token for inválido/expirado ou senha não atender ao mínimo.
     */
    @Transactional
    public void resetPassword(ResetPasswordDTO resetPasswordDTO) {
        String token = resetPasswordDTO.getToken();
        String newPassword = resetPasswordDTO.getNewPassword();

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
        log.info("Senha resetada com sucesso para o usuário: {}", user.getEmail());
    }
}
