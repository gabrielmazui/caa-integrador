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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
                SELECT t.id, t.termo, t.definicao, (t.crianca_id IS NULL) AS global,
                       COALESCE(u.nome, 'Equipe CAA') AS criado_por_nome,
                       editor.nome AS editado_por_nome,
                       t.criado_em, t.atualizado_em
                FROM termos_glossario t
                LEFT JOIN usuarios u ON u.id = t.criado_por_id
                LEFT JOIN usuarios editor ON editor.id = t.editado_por_id
                WHERE (t.crianca_id IS NULL OR t.crianca_id = :childId)
                  AND t.excluido_em IS NULL
                ORDER BY lower(t.termo)
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
                SELECT t.id, t.termo, t.definicao, false AS global,
                       u.nome AS criado_por_nome, NULL::varchar AS editado_por_nome,
                       t.criado_em, t.atualizado_em
                FROM termos_glossario t
                JOIN usuarios u ON u.id = t.criado_por_id
                WHERE t.id = :id
                """)
            .param("id", id).query(TermoResponse.class).single();
    }

    @PutMapping("/{termId}")
    public TermoResponse update(@PathVariable UUID childId, @PathVariable UUID termId,
                                @Valid @RequestBody TermoRequest request,
                                Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        acesso.requireProfessional(childId, userId);
        int updated = jdbc.sql("""
                UPDATE termos_glossario
                SET termo = :termo, definicao = :definicao, editado_por_id = :userId
                WHERE id = :termId AND crianca_id = :childId AND excluido_em IS NULL
                """)
            .param("termId", termId).param("childId", childId).param("userId", userId)
            .param("termo", request.termo().trim())
            .param("definicao", request.definicao().trim()).update();
        if (updated == 0) {
            throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.NOT_FOUND, "Termo não encontrado ou protegido");
        }
        return find(termId);
    }

    @DeleteMapping("/{termId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID childId, @PathVariable UUID termId,
                       Authentication auth) {
        acesso.requireProfessional(childId, CurrentUser.id(auth));
        int updated = jdbc.sql("""
                UPDATE termos_glossario SET excluido_em = CURRENT_TIMESTAMP
                WHERE id = :termId AND crianca_id = :childId AND excluido_em IS NULL
                """)
            .param("termId", termId).param("childId", childId).update();
        if (updated == 0) {
            throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.NOT_FOUND, "Termo não encontrado ou protegido");
        }
    }

    private TermoResponse find(UUID id) {
        return jdbc.sql("""
                SELECT t.id, t.termo, t.definicao, false AS global,
                       COALESCE(criador.nome, 'Usuário removido') AS criado_por_nome,
                       editor.nome AS editado_por_nome, t.criado_em, t.atualizado_em
                FROM termos_glossario t
                LEFT JOIN usuarios criador ON criador.id = t.criado_por_id
                LEFT JOIN usuarios editor ON editor.id = t.editado_por_id
                WHERE t.id = :id AND t.excluido_em IS NULL
                """).param("id", id).query(TermoResponse.class).single();
    }

    public record TermoRequest(@NotBlank @Size(max = 120) String termo,
                               @NotBlank @Size(max = 5000) String definicao) {}
    public record TermoResponse(UUID id, String termo, String definicao,
                                boolean global, String criadoPorNome,
                                String editadoPorNome,
                                OffsetDateTime criadoEm, OffsetDateTime atualizadoEm) {}
}
