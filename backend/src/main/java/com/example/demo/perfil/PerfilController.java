package com.example.demo.perfil;

import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
        String userType = jdbc.sql("SELECT tipo_usuario FROM usuarios WHERE id = :id")
            .param("id", id).query(String.class).single();
        String specialty = request.especialidade() == null || request.especialidade().isBlank()
            ? null : request.especialidade().trim();
        if ("profissional".equals(userType) && specialty == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Informe a especialidade profissional");
        }
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
            .param("especialidade", "profissional".equals(userType) ? specialty : null)
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

    @GetMapping("/{id}")
    public PerfilPublicoResponse publicProfile(@PathVariable UUID id, Authentication auth) {
        UUID viewer = CurrentUser.id(auth);
        boolean allowed = viewer.equals(id) || jdbc.sql("""
            SELECT EXISTS (
                SELECT 1 FROM equipe_crianca a
                JOIN equipe_crianca b ON a.crianca_id = b.crianca_id
                JOIN criancas c ON c.id = a.crianca_id
                WHERE a.usuario_id = :viewer AND b.usuario_id = :id
                  AND a.status = 'ativo' AND b.status IN ('ativo', 'convidado')
                  AND c.ativo = true AND c.excluido_em IS NULL
            )
            """).param("viewer", viewer).param("id", id).query(Boolean.class).single();
        if (!allowed) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Perfil indisponível");
        return jdbc.sql("""
            SELECT id, nome, foto_url, bio, tipo_usuario, especialidade
            FROM usuarios WHERE id = :id AND ativo = true AND excluido_em IS NULL
            """).param("id", id).query(PerfilPublicoResponse.class).optional()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil indisponível"));
    }

    public record PerfilPublicoResponse(UUID id, String nome, String fotoUrl, String bio,
                                        String tipoUsuario, String especialidade) {}

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
