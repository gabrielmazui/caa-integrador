package com.example.demo.crianca;

import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/criancas")
public class CriancaController {
    private final JdbcClient jdbc;
    private final AcessoCriancaService acesso;

    public CriancaController(JdbcClient jdbc, AcessoCriancaService acesso) {
        this.jdbc = jdbc;
        this.acesso = acesso;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public CriancaResponse create(@Valid @RequestBody CriancaRequest request, Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        String type = jdbc.sql("SELECT tipo_usuario FROM usuarios WHERE id = :id")
            .param("id", userId).query(String.class).single();
        UUID childId = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO criancas (id, nome, data_nascimento, observacoes, criado_por_id)
                VALUES (:id, :nome, :nascimento, :observacoes, :userId)
                """)
            .param("id", childId).param("nome", request.nome().trim())
            .param("nascimento", request.dataNascimento()).param("observacoes", request.observacoes())
            .param("userId", userId).update();
        jdbc.sql("""
                INSERT INTO equipe_crianca
                    (crianca_id, usuario_id, papel, pode_ver_chat, pode_convidar,
                     pode_editar_crianca, adicionado_por_id)
                VALUES (:childId, :userId, :papel, :chat, true, true, :userId)
                """)
            .param("childId", childId).param("userId", userId)
            .param("papel", "profissional".equals(type) ? "coordenador" : "responsavel")
            .param("chat", "profissional".equals(type)).update();
        return get(childId, auth);
    }

    @GetMapping
    public List<CriancaResponse> list(Authentication auth) {
        return jdbc.sql("""
                SELECT c.id, c.nome, c.data_nascimento, c.foto_url, c.observacoes,
                       ec.papel, ec.pode_publicar, ec.pode_comentar, ec.pode_ver_chat,
                       ec.pode_convidar, ec.pode_editar_crianca, c.criado_em
                FROM criancas c JOIN equipe_crianca ec ON ec.crianca_id = c.id
                WHERE ec.usuario_id = :userId AND ec.status = 'ativo'
                  AND c.ativo = true AND c.excluido_em IS NULL
                ORDER BY c.nome
                """)
            .param("userId", CurrentUser.id(auth)).query(CriancaResponse.class).list();
    }

    @GetMapping("/{childId}")
    public CriancaResponse get(@PathVariable UUID childId, Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        acesso.requireMember(childId, userId);
        return jdbc.sql("""
                SELECT c.id, c.nome, c.data_nascimento, c.foto_url, c.observacoes,
                       ec.papel, ec.pode_publicar, ec.pode_comentar, ec.pode_ver_chat,
                       ec.pode_convidar, ec.pode_editar_crianca, c.criado_em
                FROM criancas c JOIN equipe_crianca ec ON ec.crianca_id = c.id
                WHERE c.id = :childId AND ec.usuario_id = :userId
                """)
            .param("childId", childId).param("userId", userId)
            .query(CriancaResponse.class).single();
    }

    @GetMapping("/{childId}/membros")
    public List<MembroResponse> members(@PathVariable UUID childId, Authentication auth) {
        acesso.requireMember(childId, CurrentUser.id(auth));
        return jdbc.sql("""
                SELECT u.id, u.nome, u.tipo_usuario, u.especialidade, u.foto_url,
                       ec.papel, ec.descricao_funcao, ec.status
                FROM equipe_crianca ec JOIN usuarios u ON u.id = ec.usuario_id
                WHERE ec.crianca_id = :childId AND ec.status <> 'inativo'
                  AND u.excluido_em IS NULL ORDER BY u.nome
                """)
            .param("childId", childId).query(MembroResponse.class).list();
    }

    @PostMapping("/{childId}/membros")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public MembroResponse addMember(@PathVariable UUID childId,
                                    @Valid @RequestBody AddMemberRequest request,
                                    Authentication auth) {
        UUID actorId = CurrentUser.id(auth);
        var actor = acesso.requireMember(childId, actorId);
        if (!actor.podeConvidar()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não pode adicionar membros");
        }
        var member = jdbc.sql("""
                SELECT id, tipo_usuario FROM usuarios
                WHERE lower(email) = lower(:email) AND ativo = true AND excluido_em IS NULL
                """)
            .param("email", request.email().trim())
            .query((rs, row) -> new UsuarioTipo(
                rs.getObject("id", UUID.class), rs.getString("tipo_usuario")))
            .optional()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
        boolean professional = "profissional".equals(member.tipo());
        boolean roleMatchesType = professional
            ? List.of("professor", "terapeuta", "coordenador", "outro").contains(request.papel())
            : List.of("mae", "pai", "responsavel", "outro").contains(request.papel());
        if (!roleMatchesType) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "O papel informado não corresponde ao tipo da conta");
        }
        jdbc.sql("""
                INSERT INTO equipe_crianca
                    (crianca_id, usuario_id, papel, descricao_funcao, pode_ver_chat, adicionado_por_id)
                VALUES (:childId, :userId, :papel, :descricao, :chat, :actorId)
                """)
            .param("childId", childId).param("userId", member.id())
            .param("papel", request.papel()).param("descricao", request.descricaoFuncao())
            .param("chat", professional).param("actorId", actorId).update();
        return jdbc.sql("""
                SELECT u.id, u.nome, u.tipo_usuario, u.especialidade, u.foto_url,
                       ec.papel, ec.descricao_funcao, ec.status
                FROM equipe_crianca ec JOIN usuarios u ON u.id = ec.usuario_id
                WHERE ec.crianca_id = :childId AND u.id = :userId
                """)
            .param("childId", childId).param("userId", member.id())
            .query(MembroResponse.class).single();
    }

    public record CriancaRequest(@NotBlank @Size(max = 255) String nome,
                                 @PastOrPresent LocalDate dataNascimento,
                                 @Size(max = 5000) String observacoes) {}
    public record AddMemberRequest(
        @NotBlank String email,
        @NotBlank @Pattern(regexp = "mae|pai|responsavel|professor|terapeuta|coordenador|outro") String papel,
        @Size(max = 150) String descricaoFuncao) {}
    public record CriancaResponse(UUID id, String nome, LocalDate dataNascimento, String fotoUrl,
                                  String observacoes, String papel, boolean podePublicar,
                                  boolean podeComentar, boolean podeVerChat, boolean podeConvidar,
                                  boolean podeEditarCrianca, OffsetDateTime criadoEm) {}
    public record MembroResponse(UUID id, String nome, String tipoUsuario, String especialidade,
                                 String fotoUrl, String papel, String descricaoFuncao, String status) {}
    private record UsuarioTipo(UUID id, String tipo) {}
}
