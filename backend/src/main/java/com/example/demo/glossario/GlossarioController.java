package com.example.demo.glossario;

import com.example.demo.crianca.AcessoCriancaService;
import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/criancas/{childId}/glossario")
public class GlossarioController {
    private final JdbcClient jdbc;
    private final AcessoCriancaService acesso;

    public GlossarioController(JdbcClient jdbc, AcessoCriancaService acesso) {
        this.jdbc = jdbc;
        this.acesso = acesso;
    }

    @GetMapping
    public List<TermoResponse> list(@PathVariable UUID childId, Authentication auth) {
        acesso.requireMember(childId, CurrentUser.id(auth));
        return jdbc.sql("""
                SELECT id, termo, definicao, (crianca_id IS NULL) AS global, atualizado_em
                FROM termos_glossario
                WHERE crianca_id IS NULL OR crianca_id = :childId
                ORDER BY lower(termo)
                """)
            .param("childId", childId).query(TermoResponse.class).list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TermoResponse create(@PathVariable UUID childId,
                                @Valid @RequestBody TermoRequest request,
                                Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        acesso.requireProfessional(childId, userId);
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO termos_glossario (id, crianca_id, termo, definicao, criado_por_id)
                VALUES (:id, :childId, :termo, :definicao, :userId)
                """)
            .param("id", id).param("childId", childId).param("termo", request.termo().trim())
            .param("definicao", request.definicao().trim()).param("userId", userId).update();
        return jdbc.sql("""
                SELECT id, termo, definicao, false AS global, atualizado_em
                FROM termos_glossario WHERE id = :id
                """)
            .param("id", id).query(TermoResponse.class).single();
    }

    public record TermoRequest(@NotBlank @Size(max = 120) String termo,
                               @NotBlank @Size(max = 5000) String definicao) {}
    public record TermoResponse(UUID id, String termo, String definicao,
                                boolean global, OffsetDateTime atualizadoEm) {}
}
