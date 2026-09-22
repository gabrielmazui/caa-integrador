package com.example.demo.chat;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/criancas/{childId}/chat")
public class ChatController {
    private final JdbcClient jdbc;
    private final AcessoCriancaService acesso;

    public ChatController(JdbcClient jdbc, AcessoCriancaService acesso) {
        this.jdbc = jdbc;
        this.acesso = acesso;
    }

    @GetMapping
    public List<MensagemResponse> list(@PathVariable UUID childId,
                                       @RequestParam(defaultValue = "50") int limit,
                                       Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        var member = acesso.requireProfessional(childId, userId);
        if (!member.podeVerChat()) throw new org.springframework.web.server.ResponseStatusException(
            HttpStatus.FORBIDDEN, "Você não pode acessar o chat");
        return jdbc.sql("""
                SELECT m.id, m.conteudo, m.criado_em, u.id AS remetente_id,
                       COALESCE(u.nome, 'Usuário removido') AS remetente_nome
                FROM mensagens_chat m LEFT JOIN usuarios u ON u.id = m.remetente_id
                WHERE m.crianca_id = :childId AND m.excluido_em IS NULL
                ORDER BY m.criado_em DESC LIMIT :limit
                """)
            .param("childId", childId).param("limit", Math.clamp(limit, 1, 100))
            .query(MensagemResponse.class).list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MensagemResponse send(@PathVariable UUID childId,
                                  @Valid @RequestBody MensagemRequest request,
                                  Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        var member = acesso.requireProfessional(childId, userId);
        if (!member.podeVerChat()) throw new org.springframework.web.server.ResponseStatusException(
            HttpStatus.FORBIDDEN, "Você não pode acessar o chat");
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO mensagens_chat (id, crianca_id, remetente_id, conteudo)
                VALUES (:id, :childId, :userId, :conteudo)
                """)
            .param("id", id).param("childId", childId).param("userId", userId)
            .param("conteudo", request.conteudo().trim()).update();
        return jdbc.sql("""
                SELECT m.id, m.conteudo, m.criado_em, u.id AS remetente_id,
                       u.nome AS remetente_nome
                FROM mensagens_chat m JOIN usuarios u ON u.id = m.remetente_id WHERE m.id = :id
                """)
            .param("id", id).query(MensagemResponse.class).single();
    }

    public record MensagemRequest(@NotBlank @Size(max = 5000) String conteudo) {}
    public record MensagemResponse(UUID id, String conteudo, OffsetDateTime criadoEm,
                                   UUID remetenteId, String remetenteNome) {}
}
