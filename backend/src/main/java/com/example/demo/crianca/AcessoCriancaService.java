package com.example.demo.crianca;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AcessoCriancaService {
    private final JdbcClient jdbc;

    public AcessoCriancaService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Vinculo requireMember(UUID childId, UUID userId) {
        return jdbc.sql("""
                SELECT ec.papel, u.tipo_usuario, ec.pode_publicar, ec.pode_comentar,
                       ec.pode_ver_chat, ec.pode_convidar, ec.pode_editar_crianca
                FROM equipe_crianca ec
                JOIN usuarios u ON u.id = ec.usuario_id
                JOIN criancas c ON c.id = ec.crianca_id
                WHERE ec.crianca_id = :childId AND ec.usuario_id = :userId
                  AND ec.status = 'ativo' AND u.ativo = true AND u.excluido_em IS NULL
                  AND c.ativo = true AND c.excluido_em IS NULL
                """)
            .param("childId", childId)
            .param("userId", userId)
            .query(Vinculo.class)
            .optional()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Criança não encontrada"));
    }

    public Vinculo requireProfessional(UUID childId, UUID userId) {
        Vinculo vinculo = requireMember(childId, userId);
        if (!vinculo.profissional()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Área exclusiva da equipe profissional");
        }
        return vinculo;
    }

    public record Vinculo(String papel, String tipoUsuario, boolean podePublicar,
                          boolean podeComentar, boolean podeVerChat,
                          boolean podeConvidar, boolean podeEditarCrianca) {
        public boolean profissional() {
            return "profissional".equals(tipoUsuario);
        }
    }
}
