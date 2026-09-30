package com.example.demo.perfil;

import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/perfil")
public class PerfilController {

    private final JdbcClient jdbc;

    public PerfilController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public PerfilResponse get(Authentication auth) {
        return fetch(CurrentUser.id(auth));
    }

    @PutMapping
    @Transactional
    public PerfilResponse update(@Valid @RequestBody PerfilRequest request, Authentication auth) {
        UUID id = CurrentUser.id(auth);
        jdbc.sql("""
                UPDATE usuarios SET
                    nome = :nome,
                    bio = :bio,
                    telefone = :telefone,
                    especialidade = :especialidade,
                    foto_url = :fotoUrl
                WHERE id = :id
                """)
            .param("id", id)
            .param("nome", request.nome() != null ? request.nome().trim() : null)
            .param("bio", request.bio())
            .param("telefone", request.telefone())
            .param("especialidade", request.especialidade())
            .param("fotoUrl", request.fotoUrl())
            .update();
        return fetch(id);
    }

    private PerfilResponse fetch(UUID id) {
        return jdbc.sql("""
                SELECT id, nome, email, tipo_usuario, especialidade, registro_profissional,
                       telefone, foto_url, bio, criado_em, atualizado_em
                FROM usuarios WHERE id = :id AND ativo = true AND excluido_em IS NULL
                """)
            .param("id", id)
            .query(PerfilResponse.class).single();
    }

    public record PerfilRequest(
        @Size(max = 255) String nome,
        @Size(max = 2000) String bio,
        @Size(max = 30) String telefone,
        @Size(max = 100) String especialidade,
        @Size(max = 1000) String fotoUrl) {}

    public record PerfilResponse(UUID id, String nome, String email, String tipoUsuario,
                                 String especialidade, String registroProfissional,
                                 String telefone, String fotoUrl, String bio,
                                 OffsetDateTime criadoEm, OffsetDateTime atualizadoEm) {}
}
