ALTER TABLE usuarios
    ADD COLUMN tipo_usuario VARCHAR(20) NOT NULL DEFAULT 'profissional',
    ADD CONSTRAINT chk_usuario_tipo
        CHECK (tipo_usuario IN ('profissional', 'familiar'));

ALTER TABLE registros
    ADD COLUMN visibilidade VARCHAR(20) NOT NULL DEFAULT 'todos',
    ADD CONSTRAINT chk_registro_visibilidade
        CHECK (visibilidade IN ('todos', 'profissionais'));

CREATE TABLE anotacoes_pei (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crianca_id UUID NOT NULL REFERENCES criancas(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    categoria VARCHAR(40) NOT NULL,
    conteudo TEXT NOT NULL,
    semestre SMALLINT NOT NULL,
    ano SMALLINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    excluido_em TIMESTAMPTZ,
    CONSTRAINT chk_anotacao_pei_categoria CHECK (categoria IN (
        'comunicacao', 'socializacao', 'aprendizagem', 'autonomia',
        'comportamento', 'sensorial', 'objetivo', 'estrategia', 'outro'
    )),
    CONSTRAINT chk_anotacao_pei_conteudo CHECK (btrim(conteudo) <> ''),
    CONSTRAINT chk_anotacao_pei_semestre CHECK (semestre IN (1, 2)),
    CONSTRAINT chk_anotacao_pei_ano CHECK (ano BETWEEN 2000 AND 2200)
);

CREATE INDEX idx_anotacoes_pei_periodo
    ON anotacoes_pei (crianca_id, ano DESC, semestre DESC, criado_em DESC)
    WHERE excluido_em IS NULL;

CREATE TRIGGER trg_anotacoes_pei_atualizado_em
    BEFORE UPDATE ON anotacoes_pei
    FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

CREATE TABLE termos_glossario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crianca_id UUID REFERENCES criancas(id) ON DELETE CASCADE,
    termo VARCHAR(120) NOT NULL,
    definicao TEXT NOT NULL,
    criado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_glossario_termo CHECK (btrim(termo) <> ''),
    CONSTRAINT chk_glossario_definicao CHECK (btrim(definicao) <> '')
);

CREATE UNIQUE INDEX uq_glossario_global
    ON termos_glossario (lower(termo)) WHERE crianca_id IS NULL;
CREATE UNIQUE INDEX uq_glossario_crianca
    ON termos_glossario (crianca_id, lower(termo)) WHERE crianca_id IS NOT NULL;

CREATE TRIGGER trg_termos_glossario_atualizado_em
    BEFORE UPDATE ON termos_glossario
    FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();
