ALTER TABLE usuarios
    DROP CONSTRAINT chk_usuario_tipo;

UPDATE usuarios
SET tipo_usuario = 'responsavel'
WHERE tipo_usuario = 'familiar';

ALTER TABLE usuarios
    ADD CONSTRAINT chk_usuario_tipo
        CHECK (tipo_usuario IN ('profissional', 'responsavel'));

ALTER TABLE equipe_crianca
    DROP CONSTRAINT chk_equipe_papel,
    ADD COLUMN funcao_profissional VARCHAR(50),
    ADD COLUMN relacao_responsavel VARCHAR(50),
    ADD COLUMN descricao_relacao VARCHAR(150);

UPDATE equipe_crianca ec
SET funcao_profissional = CASE
        WHEN u.tipo_usuario = 'profissional' THEN
            CASE ec.papel
                WHEN 'professor' THEN 'professor'
                WHEN 'terapeuta' THEN 'terapeuta'
                WHEN 'coordenador' THEN 'coordenador'
                ELSE 'outro'
            END
        ELSE NULL
    END,
    relacao_responsavel = CASE
        WHEN u.tipo_usuario = 'responsavel' THEN
            CASE ec.papel
                WHEN 'mae' THEN 'mae'
                WHEN 'pai' THEN 'pai'
                WHEN 'outro' THEN 'outro'
                ELSE NULL
            END
        ELSE NULL
    END,
    descricao_relacao = CASE
        WHEN u.tipo_usuario = 'responsavel' AND ec.papel = 'outro'
            THEN ec.descricao_funcao
        ELSE NULL
    END,
    descricao_funcao = CASE
        WHEN u.tipo_usuario = 'profissional' THEN ec.descricao_funcao
        ELSE NULL
    END,
    papel = u.tipo_usuario
FROM usuarios u
WHERE u.id = ec.usuario_id;

ALTER TABLE equipe_crianca
    RENAME COLUMN pode_convidar TO pode_gerenciar_membros;

ALTER TABLE equipe_crianca
    ADD CONSTRAINT chk_equipe_papel
        CHECK (papel IN ('profissional', 'responsavel')),
    ADD CONSTRAINT chk_equipe_funcao_profissional
        CHECK (funcao_profissional IS NULL OR funcao_profissional IN (
            'professor', 'terapeuta', 'coordenador', 'outro'
        )),
    ADD CONSTRAINT chk_equipe_relacao_responsavel
        CHECK (relacao_responsavel IS NULL OR relacao_responsavel IN (
            'mae', 'pai', 'outro'
        )),
    ADD CONSTRAINT chk_equipe_detalhes_por_papel
        CHECK (
            (papel = 'profissional' AND relacao_responsavel IS NULL AND descricao_relacao IS NULL)
            OR
            (papel = 'responsavel' AND funcao_profissional IS NULL AND descricao_funcao IS NULL)
        );

UPDATE equipe_crianca ec
SET pode_gerenciar_membros = TRUE
FROM criancas c
WHERE c.id = ec.crianca_id
  AND (
      ec.papel = 'responsavel'
      OR ec.funcao_profissional = 'coordenador'
      OR ec.usuario_id = c.criado_por_id
  );
