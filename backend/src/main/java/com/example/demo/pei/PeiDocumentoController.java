package com.example.demo.pei;

import com.example.demo.crianca.AcessoCriancaService;
import com.example.demo.shared.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;
import java.util.*;

@RestController
@RequestMapping("/api/criancas/{childId}/pei")
public class PeiDocumentoController {
    private final JdbcClient jdbc;
    private final AcessoCriancaService acesso;
    private final ObjectMapper mapper;
    public PeiDocumentoController(JdbcClient jdbc, AcessoCriancaService acesso, ObjectMapper mapper) {
        this.jdbc = jdbc; this.acesso = acesso; this.mapper = mapper;
    }
    public record Topic(@NotBlank @Size(max=60) String key, @NotBlank @Size(max=160) String title,
                        boolean enabled, @NotNull @Size(max=30) Map<@Size(max=60) String, @NotNull @Size(max=20000) String> fields,
                        @NotNull @Size(max=200) List<@NotBlank @Size(max=100) String> selected) {}
    public record Document(@Min(0) @Max(9223372036854775806L) long version, @NotNull @Size(max=50) List<@NotNull @Valid Topic> topics) {}
    private void authorize(UUID childId, int ano, int semestre, Authentication auth) {
        acesso.requireProfessional(childId, CurrentUser.id(auth));
        if (ano < 2000 || ano > 2200 || semestre < 1 || semestre > 2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Período inválido.");
    }
    @GetMapping
    public Document get(@PathVariable UUID childId, @RequestParam int ano, @RequestParam int semestre, Authentication auth) {
        authorize(childId, ano, semestre, auth);
        return jdbc.sql("SELECT conteudo::text, versao FROM documentos_pei WHERE crianca_id=:id AND ano=:ano AND semestre=:sem")
            .param("id", childId).param("ano", ano).param("sem", semestre)
            .query((rs, row) -> new Document(rs.getLong("versao"), Arrays.asList(mapper.readValue(rs.getString("conteudo"), Topic[].class))))
            .optional().orElse(new Document(0, List.of()));
    }
    @PutMapping
    public Document save(@PathVariable UUID childId, @RequestParam int ano, @RequestParam int semestre,
                         @Valid @RequestBody Document document, Authentication auth) {
        authorize(childId, ano, semestre, auth);
        if (document.topics().stream().map(Topic::key).distinct().count() != document.topics().size())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Partes duplicadas.");
        String json = mapper.writeValueAsString(document.topics());
        if (json.length() > 500000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Documento muito extenso.");
        String sql = document.version() == 0
            ? "INSERT INTO documentos_pei(crianca_id,ano,semestre,conteudo) VALUES(:id,:ano,:sem,CAST(:json AS jsonb)) ON CONFLICT DO NOTHING"
            : "UPDATE documentos_pei SET conteudo=CAST(:json AS jsonb),versao=versao+1,atualizado_em=now() WHERE crianca_id=:id AND ano=:ano AND semestre=:sem AND versao=:version";
        var query = jdbc.sql(sql).param("id", childId).param("ano", ano).param("sem", semestre).param("json", json);
        if (document.version() > 0) query.param("version", document.version());
        if (query.update() != 1) throw new ResponseStatusException(HttpStatus.CONFLICT,
            "Outra pessoa atualizou este PEI. Copie suas alterações antes de recarregar para não perder seu texto.");
        return new Document(document.version()+1, document.topics());
    }
}
