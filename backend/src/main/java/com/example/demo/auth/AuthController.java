package com.example.demo.auth;

import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final JdbcClient jdbc;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwt;

    public AuthController(JdbcClient jdbc, PasswordEncoder encoder,
                          AuthenticationManager authenticationManager, JwtService jwt) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public TokenResponse register(@Valid @RequestBody RegisterRequest request) {
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO usuarios (id, nome, email, senha_hash, tipo_usuario, especialidade, registro_profissional)
                VALUES (:id, :nome, :email, :senha, :tipo, :especialidade, :registro)
                """)
            .param("id", id)
            .param("nome", request.nome().trim())
            .param("email", request.email().trim().toLowerCase())
            .param("senha", encoder.encode(request.senha()))
            .param("tipo", request.tipoUsuario())
            .param("especialidade", request.especialidade())
            .param("registro", request.registroProfissional())
            .update();
        return tokenFor(id);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.email().trim(), request.senha()));
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
        }
        UUID id = jdbc.sql("SELECT id FROM usuarios WHERE lower(email) = lower(:email)")
            .param("email", request.email().trim())
            .query(UUID.class).single();
        return tokenFor(id);
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication authentication) {
        return user(CurrentUser.id(authentication));
    }

    private TokenResponse tokenFor(UUID userId) {
        return new TokenResponse(jwt.create(userId), "Bearer", jwt.expiresInSeconds(), user(userId));
    }

    private UsuarioResponse user(UUID id) {
        return jdbc.sql("""
                SELECT id, nome, email, tipo_usuario, especialidade, registro_profissional, foto_url
                FROM usuarios WHERE id = :id AND ativo = true AND excluido_em IS NULL
                """)
            .param("id", id)
            .query(UsuarioResponse.class).single();
    }

    public record RegisterRequest(
        @NotBlank @Size(max = 255) String nome,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72) String senha,
        @NotBlank @Pattern(regexp = "profissional|familiar") String tipoUsuario,
        @Size(max = 100) String especialidade,
        @Size(max = 100) String registroProfissional) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String senha) {}
    public record TokenResponse(String accessToken, String tokenType, long expiresIn, UsuarioResponse usuario) {}
    public record UsuarioResponse(UUID id, String nome, String email, String tipoUsuario,
                                  String especialidade, String registroProfissional, String fotoUrl) {}
}
