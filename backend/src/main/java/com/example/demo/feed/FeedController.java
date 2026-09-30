package com.example.demo.feed;

import com.example.demo.crianca.AcessoCriancaService;
import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/criancas/{childId}/registros")
public class FeedController {
    private final JdbcClient jdbc;
    private final AcessoCriancaService acesso;

    public FeedController(JdbcClient jdbc, AcessoCriancaService acesso) {
        this.jdbc = jdbc;
        this.acesso = acesso;
    }

    @GetMapping
    public List<RegistroResponse> list(@PathVariable UUID childId,
                                       @RequestParam(defaultValue = "20") int limit,
                                       @RequestParam(defaultValue = "0") int offset,
                                       Authentication auth) {
        var member = acesso.requireMember(childId, CurrentUser.id(auth));
        int safeLimit = Math.clamp(limit, 1, 100);
        int safeOffset = Math.max(offset, 0);
        List<RegistroData> raw = jdbc.sql("""
                SELECT r.id, r.conteudo, r.visibilidade, r.fixado, r.criado_em, r.atualizado_em,
                       u.id AS autor_id, COALESCE(u.nome, 'Usuário removido') AS autor_nome,
                       u.foto_url AS autor_foto_url,
                       COUNT(c.id) FILTER (WHERE c.excluido_em IS NULL) AS total_comentarios
                FROM registros r
                LEFT JOIN usuarios u ON u.id = r.autor_id
                LEFT JOIN comentarios c ON c.registro_id = r.id
                WHERE r.crianca_id = :childId AND r.excluido_em IS NULL
                  AND (:professional OR r.visibilidade = 'todos')
                GROUP BY r.id, u.id, u.nome, u.foto_url
                ORDER BY r.fixado DESC, r.criado_em DESC
                LIMIT :limit OFFSET :offset
                """)
            .param("childId", childId).param("professional", member.profissional())
            .param("limit", safeLimit).param("offset", safeOffset)
            .query(RegistroData.class).list();
        return enrichWithAnexos(raw);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public RegistroResponse create(@PathVariable UUID childId,
                                    @Valid @RequestBody RegistroRequest request,
                                    Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        var member = acesso.requireMember(childId, userId);
        if (!member.podePublicar()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não pode publicar neste grupo");
        }
        if ("profissionais".equals(request.visibilidade()) && !member.profissional()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Somente profissionais podem criar registros restritos");
        }
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO registros (id, crianca_id, autor_id, conteudo, visibilidade)
                VALUES (:id, :childId, :userId, :conteudo, :visibilidade)
                """)
            .param("id", id).param("childId", childId).param("userId", userId)
            .param("conteudo", request.conteudo().trim())
            .param("visibilidade", request.visibilidade()).update();

        if (request.arquivoIds() != null) {
            for (UUID arquivoId : request.arquivoIds()) {
                jdbc.sql("""
                        INSERT INTO anexos (id, url, tipo, nome_arquivo, mime_type, tamanho_bytes, registro_id, arquivo_id)
                        SELECT gen_random_uuid(), url, tipo, nome_arquivo, mime_type, tamanho_bytes, :registroId, id
                        FROM arquivos WHERE id = :arquivoId
                        """)
                    .param("registroId", id).param("arquivoId", arquivoId).update();
            }
        }

        return enrichWithAnexos(List.of(findRegistroData(id))).getFirst();
    }

    @GetMapping("/{registroId}/comentarios")
    public List<ComentarioResponse> comments(@PathVariable UUID childId,
                                             @PathVariable UUID registroId,
                                             Authentication auth) {
        var member = acesso.requireMember(childId, CurrentUser.id(auth));
        requireVisiblePost(childId, registroId, member.profissional());
        return jdbc.sql("""
                SELECT c.id, c.conteudo, c.criado_em, c.atualizado_em,
                       u.id AS autor_id, COALESCE(u.nome, 'Usuário removido') AS autor_nome,
                       u.foto_url AS autor_foto_url
                FROM comentarios c LEFT JOIN usuarios u ON u.id = c.autor_id
                WHERE c.registro_id = :registroId AND c.excluido_em IS NULL
                ORDER BY c.criado_em
                """)
            .param("registroId", registroId).query(ComentarioResponse.class).list();
    }

    @PostMapping("/{registroId}/comentarios")
    @ResponseStatus(HttpStatus.CREATED)
    public ComentarioResponse comment(@PathVariable UUID childId, @PathVariable UUID registroId,
                                       @Valid @RequestBody ComentarioRequest request,
                                       Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        var member = acesso.requireMember(childId, userId);
        if (!member.podeComentar()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não pode comentar neste grupo");
        }
        requireVisiblePost(childId, registroId, member.profissional());
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO comentarios (id, registro_id, autor_id, conteudo)
                VALUES (:id, :registroId, :userId, :conteudo)
                """)
            .param("id", id).param("registroId", registroId).param("userId", userId)
            .param("conteudo", request.conteudo().trim()).update();
        return jdbc.sql("""
                SELECT c.id, c.conteudo, c.criado_em, c.atualizado_em,
                       u.id AS autor_id, u.nome AS autor_nome, u.foto_url AS autor_foto_url
                FROM comentarios c JOIN usuarios u ON u.id = c.autor_id WHERE c.id = :id
                """)
            .param("id", id).query(ComentarioResponse.class).single();
    }

    private List<RegistroResponse> enrichWithAnexos(List<RegistroData> data) {
        if (data.isEmpty()) return List.of();
        UUID[] ids = data.stream().map(RegistroData::id).toArray(UUID[]::new);
        Map<UUID, List<AnexoResponse>> anexoMap = jdbc.sql("""
                SELECT registro_id, id, url, tipo, nome_arquivo
                FROM anexos WHERE registro_id = ANY(:ids) ORDER BY criado_em
                """)
            .param("ids", ids)
            .query(AnexoData.class).list()
            .stream()
            .collect(Collectors.groupingBy(AnexoData::registroId,
                Collectors.mapping(a -> new AnexoResponse(a.id(), a.url(), a.tipo(), a.nomeArquivo()),
                    Collectors.toList())));
        return data.stream().map(r -> new RegistroResponse(
            r.id(), r.conteudo(), r.visibilidade(), r.fixado(), r.criadoEm(), r.atualizadoEm(),
            r.autorId(), r.autorNome(), r.autorFotoUrl(), r.totalComentarios(),
            anexoMap.getOrDefault(r.id(), List.of()))).toList();
    }

    private void requireVisiblePost(UUID childId, UUID registroId, boolean professional) {
        boolean exists = jdbc.sql("""
                SELECT EXISTS(SELECT 1 FROM registros
                    WHERE id = :id AND crianca_id = :childId AND excluido_em IS NULL
                      AND (:professional OR visibilidade = 'todos'))
                """)
            .param("id", registroId).param("childId", childId)
            .param("professional", professional).query(Boolean.class).single();
        if (!exists) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Registro não encontrado");
    }

    private RegistroData findRegistroData(UUID id) {
        return jdbc.sql("""
                SELECT r.id, r.conteudo, r.visibilidade, r.fixado, r.criado_em, r.atualizado_em,
                       u.id AS autor_id, u.nome AS autor_nome, u.foto_url AS autor_foto_url,
                       0::bigint AS total_comentarios
                FROM registros r JOIN usuarios u ON u.id = r.autor_id WHERE r.id = :id
                """)
            .param("id", id).query(RegistroData.class).single();
    }

    public record RegistroRequest(
        @NotBlank @Size(max = 10000) String conteudo,
        @NotBlank @Pattern(regexp = "todos|profissionais") String visibilidade,
        List<UUID> arquivoIds) {}

    public record ComentarioRequest(@NotBlank @Size(max = 5000) String conteudo) {}

    private record RegistroData(UUID id, String conteudo, String visibilidade, boolean fixado,
                                OffsetDateTime criadoEm, OffsetDateTime atualizadoEm,
                                UUID autorId, String autorNome, String autorFotoUrl, long totalComentarios) {}

    private record AnexoData(UUID registroId, UUID id, String url, String tipo, String nomeArquivo) {}

    public record AnexoResponse(UUID id, String url, String tipo, String nomeArquivo) {}

    public record RegistroResponse(UUID id, String conteudo, String visibilidade, boolean fixado,
                                   OffsetDateTime criadoEm, OffsetDateTime atualizadoEm,
                                   UUID autorId, String autorNome, String autorFotoUrl,
                                   long totalComentarios, List<AnexoResponse> anexos) {}

    public record ComentarioResponse(UUID id, String conteudo, OffsetDateTime criadoEm,
                                     OffsetDateTime atualizadoEm, UUID autorId,
                                     String autorNome, String autorFotoUrl) {}
}
