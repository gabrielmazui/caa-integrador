package com.example.demo.chat;

import com.example.demo.crianca.AcessoCriancaService;
import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
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
        return enrich(jdbc.sql("""
                SELECT m.id, m.conteudo, m.criado_em, u.id AS remetente_id,
                       COALESCE(u.nome, 'Usuário removido') AS remetente_nome
                FROM mensagens_chat m LEFT JOIN usuarios u ON u.id = m.remetente_id
                WHERE m.crianca_id = :childId AND m.excluido_em IS NULL
                ORDER BY m.criado_em DESC LIMIT :limit
                """)
            .param("childId", childId).param("limit", Math.clamp(limit, 1, 100))
            .query(MensagemData.class).list());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MensagemResponse send(@PathVariable UUID childId,
                                  @Valid @RequestBody MensagemRequest request,
                                  Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        var member = acesso.requireProfessional(childId, userId);
        if (!member.podeVerChat()) throw new org.springframework.web.server.ResponseStatusException(
            HttpStatus.FORBIDDEN, "Você não pode acessar o chat");
        String text = request.conteudo() == null ? "" : request.conteudo().trim();
        List<UUID> files = request.arquivoIds() == null ? List.of() : request.arquivoIds();
        if (text.isEmpty() && files.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escreva ou anexe um arquivo");
        if (files.stream().distinct().count() != files.size() || files.stream().anyMatch(java.util.Objects::isNull))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Anexos inválidos");
        for (UUID file : files) {
            boolean valid = jdbc.sql("SELECT EXISTS(SELECT 1 FROM arquivos WHERE id = :id AND uploader_id = :user AND tamanho_bytes <= 52428800)")
                .param("id", file).param("user", userId).query(Boolean.class).single();
            if (!valid) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo inválido ou maior que 50 MB");
        }
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO mensagens_chat (id, crianca_id, remetente_id, conteudo)
                VALUES (:id, :childId, :userId, :conteudo)
                """)
            .param("id", id).param("childId", childId).param("userId", userId)
            .param("conteudo", text.isEmpty() ? null : text).update();
        for (UUID file : files) {
            jdbc.sql("""
                INSERT INTO anexos (id, url, tipo, nome_arquivo, mime_type, tamanho_bytes, mensagem_chat_id, arquivo_id)
                SELECT gen_random_uuid(), url, tipo, nome_arquivo, mime_type, tamanho_bytes, :message, id
                FROM arquivos WHERE id = :file AND uploader_id = :user
                """).param("message", id).param("file", file).param("user", userId).update();
        }
        return enrich(jdbc.sql("""
                SELECT m.id, m.conteudo, m.criado_em, u.id AS remetente_id,
                       u.nome AS remetente_nome
                FROM mensagens_chat m JOIN usuarios u ON u.id = m.remetente_id WHERE m.id = :id
                """)
            .param("id", id).query(MensagemData.class).list()).getFirst();
    }

    private List<MensagemResponse> enrich(List<MensagemData> messages) {
        if (messages.isEmpty()) return List.of();
        var attachments = jdbc.sql("""
            SELECT mensagem_chat_id, id, url, tipo, nome_arquivo FROM anexos
            WHERE mensagem_chat_id IN (:ids) ORDER BY criado_em, id
            """).param("ids", messages.stream().map(MensagemData::id).toList()).query(AttachmentData.class).list();
        return messages.stream().map(m -> new MensagemResponse(m.id(), m.conteudo(), m.criadoEm(),
            m.remetenteId(), m.remetenteNome(), attachments.stream()
                .filter(a -> a.mensagemChatId().equals(m.id()))
                .map(a -> new Attachment(a.id(), a.url(), a.tipo(), a.nomeArquivo())).toList())).toList();
    }

    public record MensagemRequest(@Size(max = 5000) String conteudo, @Size(max = 5) List<UUID> arquivoIds) {}
    private record AttachmentData(UUID mensagemChatId, UUID id, String url, String tipo, String nomeArquivo) {}
    public record Attachment(UUID id, String url, String tipo, String nomeArquivo) {}
    private record MensagemData(UUID id, String conteudo, OffsetDateTime criadoEm, UUID remetenteId, String remetenteNome) {}
    public record MensagemResponse(UUID id, String conteudo, OffsetDateTime criadoEm,
                                   UUID remetenteId, String remetenteNome, List<Attachment> anexos) {}
}
