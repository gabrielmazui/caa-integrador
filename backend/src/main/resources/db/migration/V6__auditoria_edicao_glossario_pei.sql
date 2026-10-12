ALTER TABLE termos_glossario
    ADD COLUMN editado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ADD COLUMN excluido_em TIMESTAMPTZ;

ALTER TABLE anotacoes_pei
    ADD COLUMN editado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

CREATE INDEX idx_termos_glossario_ativos
    ON termos_glossario (crianca_id, termo)
    WHERE excluido_em IS NULL;

DROP INDEX uq_glossario_crianca;

CREATE UNIQUE INDEX uq_glossario_crianca
    ON termos_glossario (crianca_id, lower(termo))
    WHERE crianca_id IS NOT NULL AND excluido_em IS NULL;
