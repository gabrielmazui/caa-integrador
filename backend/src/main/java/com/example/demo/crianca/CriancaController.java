package com.example.demo.crianca;

import com.example.demo.shared.CurrentUser;
import com.example.demo.shared.validation.NotOlderThan;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.annotation.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
        validateRelationship(request.relacaoResponsavel(), request.descricaoRelacao(), type);
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
                    (crianca_id, usuario_id, papel, funcao_profissional,
                     relacao_responsavel, descricao_relacao, pode_ver_chat,
                     pode_gerenciar_membros, pode_editar_crianca, coordenador, adicionado_por_id)
                VALUES (:childId, :userId, :papel, NULL, :relacao, :descricaoRelacao,
                        :chat, true, true, true, :userId)
                """)
            .param("childId", childId).param("userId", userId)
            .param("papel", type)
            .param("relacao", "responsavel".equals(type) ? request.relacaoResponsavel() : null)
            .param("descricaoRelacao", "responsavel".equals(type)
                ? trimmedOrNull(request.descricaoRelacao()) : null)
            .param("chat", "profissional".equals(type)).update();
        return get(childId, auth);
    }

    @GetMapping
    public List<CriancaResponse> list(Authentication auth) {
        return jdbc.sql("""
                SELECT c.id, c.nome, c.data_nascimento, c.foto_url, c.observacoes,
                       c.diagnostico, c.cid_10 AS cid10,
                       ec.papel, ec.pode_publicar, ec.pode_comentar, ec.pode_ver_chat,
                       ec.pode_gerenciar_membros, ec.pode_editar_crianca,
                       ec.coordenador, ec.relacao_responsavel, ec.descricao_relacao,
                       c.criado_em
                FROM criancas c JOIN equipe_crianca ec ON ec.crianca_id = c.id
                WHERE ec.usuario_id = :userId AND ec.status = 'ativo'
                  AND c.ativo = true AND c.excluido_em IS NULL
                ORDER BY c.nome
                """)
            .param("userId", CurrentUser.id(auth)).query(CriancaResponse.class).list();
    }

    @PutMapping("/{childId}")
    @Transactional
    public CriancaResponse update(@PathVariable UUID childId,
                                  @Valid @RequestBody CriancaUpdateRequest request,
                                  Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        var member = acesso.requireMember(childId, userId);
        if (!member.podeEditarCrianca()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não pode editar esta criança");
        }
        jdbc.sql("""
                UPDATE criancas SET
                    nome = :nome,
                    data_nascimento = :nascimento,
                    foto_url = :fotoUrl,
                    observacoes = :observacoes,
                    diagnostico = :diagnostico,
                    cid_10 = :cid10
                WHERE id = :id
                """)
            .param("id", childId)
            .param("nome", request.nome() != null ? request.nome().trim() : null)
            .param("nascimento", request.dataNascimento())
            .param("fotoUrl", request.fotoUrl())
            .param("observacoes", request.observacoes())
            .param("diagnostico", request.diagnostico())
            .param("cid10", request.cid10())
            .update();
        return get(childId, auth);
    }

    @GetMapping("/{childId}")
    public CriancaResponse get(@PathVariable UUID childId, Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        acesso.requireMember(childId, userId);
        return jdbc.sql("""
                SELECT c.id, c.nome, c.data_nascimento, c.foto_url, c.observacoes,
                       c.diagnostico, c.cid_10 AS cid10,
                       ec.papel, ec.pode_publicar, ec.pode_comentar, ec.pode_ver_chat,
                       ec.pode_gerenciar_membros, ec.pode_editar_crianca,
                       ec.coordenador, ec.relacao_responsavel, ec.descricao_relacao,
                       c.criado_em
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
                       ec.papel, ec.funcao_profissional, ec.relacao_responsavel,
                       ec.descricao_funcao, ec.descricao_relacao,
                       ec.pode_gerenciar_membros, ec.coordenador, ec.status
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
        if (!actor.podeGerenciarMembros()) {
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
        if (!member.tipo().equals(request.papel())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "O papel informado não corresponde ao tipo da conta");
        }
        validateMemberDetails(request, professional);
        boolean targetIsCreator = jdbc.sql("""
                SELECT EXISTS (
                    SELECT 1 FROM criancas
                    WHERE id = :childId AND criado_por_id = :userId
                )
                """)
            .param("childId", childId).param("userId", member.id())
            .query(Boolean.class).single();
        boolean canManageMembers = targetIsCreator || !professional;
        jdbc.sql("""
                INSERT INTO equipe_crianca
                    (crianca_id, usuario_id, papel, funcao_profissional, relacao_responsavel,
                     descricao_funcao, descricao_relacao, pode_ver_chat,
                     pode_gerenciar_membros, status, adicionado_por_id)
                VALUES (:childId, :userId, :papel, :funcao, :relacao,
                        :descricaoFuncao, :descricaoRelacao, :chat,
                        :gerencia, 'ativo', :actorId)
                ON CONFLICT (crianca_id, usuario_id) DO UPDATE SET
                    papel = EXCLUDED.papel,
                    funcao_profissional = EXCLUDED.funcao_profissional,
                    relacao_responsavel = EXCLUDED.relacao_responsavel,
                    descricao_funcao = EXCLUDED.descricao_funcao,
                    descricao_relacao = EXCLUDED.descricao_relacao,
                    pode_ver_chat = EXCLUDED.pode_ver_chat,
                    pode_gerenciar_membros = EXCLUDED.pode_gerenciar_membros,
                    status = 'ativo',
                    adicionado_por_id = EXCLUDED.adicionado_por_id
                """)
            .param("childId", childId).param("userId", member.id())
            .param("papel", request.papel())
            .param("funcao", professional ? request.funcaoProfissional() : null)
            .param("relacao", professional ? null : request.relacaoResponsavel())
            .param("descricaoFuncao", professional ? trimmedOrNull(request.descricaoFuncao()) : null)
            .param("descricaoRelacao", professional ? null : trimmedOrNull(request.descricaoRelacao()))
            .param("chat", professional).param("gerencia", canManageMembers)
            .param("actorId", actorId).update();
        return jdbc.sql("""
                SELECT u.id, u.nome, u.tipo_usuario, u.especialidade, u.foto_url,
                       ec.papel, ec.funcao_profissional, ec.relacao_responsavel,
                       ec.descricao_funcao, ec.descricao_relacao,
                       ec.pode_gerenciar_membros, ec.coordenador, ec.status
                FROM equipe_crianca ec JOIN usuarios u ON u.id = ec.usuario_id
                WHERE ec.crianca_id = :childId AND u.id = :userId
                """)
            .param("childId", childId).param("userId", member.id())
            .query(MembroResponse.class).single();
    }

    @DeleteMapping("/{childId}/membros/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void removeMember(@PathVariable UUID childId, @PathVariable UUID memberId,
                             Authentication auth) {
        var actor = acesso.requireMember(childId, CurrentUser.id(auth));
        if (!actor.podeGerenciarMembros()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não pode remover membros");
        }
        boolean coordinator = jdbc.sql("""
                SELECT coordenador FROM equipe_crianca
                WHERE crianca_id = :childId AND usuario_id = :memberId AND status = 'ativo'
                """)
            .param("childId", childId).param("memberId", memberId)
            .query(Boolean.class).optional().orElse(false);
        if (coordinator) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "O coordenador deve transferir a coordenação antes de sair");
        }
        boolean creator = jdbc.sql("""
                SELECT EXISTS (
                    SELECT 1 FROM criancas
                    WHERE id = :childId AND criado_por_id = :memberId
                )
                """)
            .param("childId", childId).param("memberId", memberId)
            .query(Boolean.class).single();
        if (creator) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "O criador da criança não pode ser removido");
        }
        int updated = jdbc.sql("""
                UPDATE equipe_crianca SET status = 'inativo'
                WHERE crianca_id = :childId AND usuario_id = :memberId AND status <> 'inativo'
                """)
            .param("childId", childId).param("memberId", memberId).update();
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membro não encontrado");
        }
    }

    @PostMapping("/{childId}/sair")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void leaveChild(@PathVariable UUID childId,
                           @Valid @RequestBody LeaveChildRequest request,
                           Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        var member = acesso.requireMember(childId, userId);
        List<UsuarioTipo> otherMembers = jdbc.sql("""
                SELECT u.id, u.tipo_usuario
                FROM equipe_crianca ec
                JOIN usuarios u ON u.id = ec.usuario_id
                WHERE ec.crianca_id = :childId AND ec.usuario_id <> :userId
                  AND ec.status = 'ativo' AND u.ativo = true AND u.excluido_em IS NULL
                """)
            .param("childId", childId).param("userId", userId)
            .query((rs, row) -> new UsuarioTipo(
                rs.getObject("id", UUID.class), rs.getString("tipo_usuario")))
            .list();

        if (otherMembers.isEmpty()) {
            if (!request.confirmarExclusao()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ao sair, a criança será excluída do sistema. Confirme a exclusão para continuar");
            }
            jdbc.sql("""
                    UPDATE criancas
                    SET ativo = false, excluido_em = CURRENT_TIMESTAMP
                    WHERE id = :childId
                    """).param("childId", childId).update();
            jdbc.sql("""
                    UPDATE equipe_crianca SET status = 'inativo'
                    WHERE crianca_id = :childId
                    """).param("childId", childId).update();
            return;
        }

        boolean coordinator = member.coordenador();
        if (coordinator) {
            if (request.novoCoordenadorId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Escolha outro profissional para assumir a coordenação");
            }
            boolean eligible = otherMembers.stream().anyMatch(candidate ->
                candidate.id().equals(request.novoCoordenadorId()));
            if (!eligible) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O novo coordenador deve ser outro membro ativo da equipe");
            }
            jdbc.sql("""
                    UPDATE equipe_crianca
                    SET coordenador = false
                    WHERE crianca_id = :childId AND usuario_id = :userId
                    """)
                .param("childId", childId)
                .param("userId", userId).update();
            jdbc.sql("""
                    UPDATE equipe_crianca
                    SET coordenador = true, pode_gerenciar_membros = true
                    WHERE crianca_id = :childId AND usuario_id = :newCoordinatorId
                    """)
                .param("childId", childId)
                .param("newCoordinatorId", request.novoCoordenadorId()).update();
            jdbc.sql("""
                    UPDATE criancas SET criado_por_id = :newCoordinatorId
                    WHERE id = :childId AND criado_por_id = :userId
                    """)
                .param("childId", childId).param("userId", userId)
                .param("newCoordinatorId", request.novoCoordenadorId()).update();
        } else {
            jdbc.sql("""
                    UPDATE criancas SET criado_por_id = NULL
                    WHERE id = :childId AND criado_por_id = :userId
                    """)
                .param("childId", childId).param("userId", userId).update();
        }

        jdbc.sql("""
                UPDATE equipe_crianca SET status = 'inativo'
                WHERE crianca_id = :childId AND usuario_id = :userId
                """)
            .param("childId", childId).param("userId", userId).update();
    }

    @PutMapping("/{childId}/meu-vinculo")
    @Transactional
    public CriancaResponse updateMyRelationship(@PathVariable UUID childId,
                                                @Valid @RequestBody MeuVinculoRequest request,
                                                Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        var member = acesso.requireMember(childId, userId);
        if (member.profissional()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Apenas responsáveis possuem parentesco com a criança");
        }
        validateRelationship(request.relacaoResponsavel(), request.descricaoRelacao(), "responsavel");
        jdbc.sql("""
                UPDATE equipe_crianca
                SET relacao_responsavel = :relacao, descricao_relacao = :descricao
                WHERE crianca_id = :childId AND usuario_id = :userId AND status = 'ativo'
                """)
            .param("childId", childId).param("userId", userId)
            .param("relacao", request.relacaoResponsavel())
            .param("descricao", trimmedOrNull(request.descricaoRelacao())).update();
        return get(childId, auth);
    }

    private void validateMemberDetails(AddMemberRequest request, boolean professional) {
        if (professional && request.relacaoResponsavel() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Profissionais não podem ter parentesco informado");
        }
        if (!professional && (request.funcaoProfissional() != null || request.descricaoFuncao() != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Responsáveis não podem ter função profissional informada");
        }
        if ("outro".equals(request.relacaoResponsavel())
            && trimmedOrNull(request.descricaoRelacao()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Descreva o parentesco quando a opção Outro for selecionada");
        }
        if (!"outro".equals(request.relacaoResponsavel())
            && trimmedOrNull(request.descricaoRelacao()) != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "A descrição do parentesco só pode ser usada com a opção Outro");
        }
    }

    private String trimmedOrNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void validateRelationship(String relationship, String description, String userType) {
        if ("profissional".equals(userType)
            && (relationship != null || trimmedOrNull(description) != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Profissionais não podem informar parentesco");
        }
        if ("outro".equals(relationship) && trimmedOrNull(description) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Descreva o parentesco quando a opção Outro for selecionada");
        }
        if (!"outro".equals(relationship) && trimmedOrNull(description) != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "A descrição do parentesco só pode ser usada com a opção Outro");
        }
    }

    public record CriancaRequest(@NotBlank @Size(max = 255) String nome,
                                 @PastOrPresent(message = "não pode estar no futuro")
                                 @NotOlderThan(years = 100, message = "a idade não pode ser maior que 100 anos")
                                 LocalDate dataNascimento,
                                 @Size(max = 5000) String observacoes,
                                 @Nullable @Pattern(regexp = "mae|pai|outro") String relacaoResponsavel,
                                 @Size(max = 150) String descricaoRelacao) {}
    public record CriancaUpdateRequest(@Size(max = 255) String nome,
                                       @PastOrPresent(message = "não pode estar no futuro")
                                       @NotOlderThan(years = 100, message = "a idade não pode ser maior que 100 anos")
                                       LocalDate dataNascimento,
                                       @Size(max = 1000) String fotoUrl,
                                       @Size(max = 5000) String observacoes,
                                       @Size(max = 255) String diagnostico,
                                       @Size(max = 20) String cid10) {}
    public record AddMemberRequest(
        @NotBlank String email,
        @NotBlank @Pattern(regexp = "profissional|responsavel") String papel,
        @Nullable @Pattern(regexp = "professor|terapeuta|outro") String funcaoProfissional,
        @Nullable @Pattern(regexp = "mae|pai|outro") String relacaoResponsavel,
        @Size(max = 150) String descricaoFuncao,
        @Size(max = 150) String descricaoRelacao) {}
    public record LeaveChildRequest(UUID novoCoordenadorId, boolean confirmarExclusao) {}
    public record MeuVinculoRequest(
        @Nullable @Pattern(regexp = "mae|pai|outro") String relacaoResponsavel,
        @Size(max = 150) String descricaoRelacao) {}
    public record CriancaResponse(UUID id, String nome, LocalDate dataNascimento, String fotoUrl,
                                  String observacoes, String diagnostico, String cid10,
                                  String papel, boolean podePublicar, boolean podeComentar,
                                  boolean podeVerChat, boolean podeGerenciarMembros,
                                  boolean podeEditarCrianca, boolean coordenador,
                                  String relacaoResponsavel, String descricaoRelacao,
                                  OffsetDateTime criadoEm) {}
    public record MembroResponse(UUID id, String nome, String tipoUsuario, String especialidade,
                                 String fotoUrl, String papel, String funcaoProfissional,
                                 String relacaoResponsavel, String descricaoFuncao,
                                 String descricaoRelacao, boolean podeGerenciarMembros,
                                 boolean coordenador, String status) {}
    private record UsuarioTipo(UUID id, String tipo) {}
}
