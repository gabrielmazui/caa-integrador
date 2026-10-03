ALTER TABLE equipe_crianca
    ADD COLUMN coordenador BOOLEAN NOT NULL DEFAULT FALSE;

WITH coordenadores AS (
    SELECT ec.id,
           ROW_NUMBER() OVER (
               PARTITION BY ec.crianca_id
               ORDER BY (ec.usuario_id = c.criado_por_id) DESC, ec.adicionado_em, ec.id
           ) AS ordem
    FROM equipe_crianca ec
    JOIN criancas c ON c.id = ec.crianca_id
    WHERE ec.status = 'ativo'
)
UPDATE equipe_crianca ec
SET coordenador = true,
    pode_gerenciar_membros = true
FROM coordenadores c
WHERE c.id = ec.id AND c.ordem = 1;

UPDATE equipe_crianca
SET funcao_profissional = NULL
WHERE funcao_profissional = 'coordenador';

CREATE UNIQUE INDEX uq_equipe_crianca_coordenador_ativo
    ON equipe_crianca (crianca_id)
    WHERE coordenador = true AND status = 'ativo';
