package com.example.demo.pei;

import com.example.demo.crianca.AcessoCriancaService;
import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
import java.time.Year;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/criancas/{childId}/anotacoes-pei")
public class PeiController {
    private final JdbcClient jdbc;
    private final AcessoCriancaService acesso;

    public PeiController(JdbcClient jdbc, AcessoCriancaService acesso) {
        this.jdbc = jdbc;
        this.acesso = acesso;
    }

    @GetMapping
    public List<AnotacaoResponse> list(@PathVariable UUID childId,
                                       @RequestParam(required = false) Integer ano,
                                       @RequestParam(required = false) Integer semestre,
                                       Authentication auth) {
        acesso.requireProfessional(childId, CurrentUser.id(auth));
        return jdbc.sql("""
                SELECT a.id, a.categoria, a.conteudo, a.semestre, a.ano,
                       a.criado_em, a.atualizado_em, u.id AS autor_id,
                       COALESCE(u.nome, 'Usuário removido') AS autor_nome
                FROM anotacoes_pei a LEFT JOIN usuarios u ON u.id = a.autor_id
                WHERE a.crianca_id = :childId AND a.excluido_em IS NULL
                  AND (:ano IS NULL OR a.ano = :ano)
                  AND (:semestre IS NULL OR a.semestre = :semestre)
                ORDER BY a.ano DESC, a.semestre DESC, a.criado_em DESC
                """)
            .param("childId", childId).param("ano", ano, java.sql.Types.SMALLINT)
            .param("semestre", semestre, java.sql.Types.SMALLINT)
            .query(AnotacaoResponse.class).list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnotacaoResponse create(@PathVariable UUID childId,
                                    @Valid @RequestBody AnotacaoRequest request,
                                    Authentication auth) {
        UUID userId = CurrentUser.id(auth);
        acesso.requireProfessional(childId, userId);
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO anotacoes_pei
                    (id, crianca_id, autor_id, categoria, conteudo, semestre, ano)
                VALUES (:id, :childId, :userId, :categoria, :conteudo, :semestre, :ano)
                """)
            .param("id", id).param("childId", childId).param("userId", userId)
            .param("categoria", request.categoria()).param("conteudo", request.conteudo().trim())
            .param("semestre", request.semestre()).param("ano", request.ano()).update();
        return jdbc.sql("""
                SELECT a.id, a.categoria, a.conteudo, a.semestre, a.ano,
                       a.criado_em, a.atualizado_em, u.id AS autor_id, u.nome AS autor_nome
                FROM anotacoes_pei a JOIN usuarios u ON u.id = a.autor_id WHERE a.id = :id
                """)
            .param("id", id).query(AnotacaoResponse.class).single();
    }

    public record AnotacaoRequest(
        @NotBlank @Pattern(regexp = "comunicacao|socializacao|aprendizagem|autonomia|comportamento|sensorial|objetivo|estrategia|outro") String categoria,
        @NotBlank @Size(max = 10000) String conteudo,
        @Min(1) @Max(2) int semestre,
        @Min(2000) @Max(2200) int ano) {
        public AnotacaoRequest {
            if (ano == 0) ano = Year.now().getValue();
        }
    }

    public record AnotacaoResponse(UUID id, String categoria, String conteudo, int semestre,
                                   int ano, OffsetDateTime criadoEm, OffsetDateTime atualizadoEm,
                                   UUID autorId, String autorNome) {}
}
