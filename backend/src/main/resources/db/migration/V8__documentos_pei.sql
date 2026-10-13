CREATE TABLE documentos_pei (
    crianca_id uuid NOT NULL REFERENCES criancas(id),
    ano smallint NOT NULL CHECK (ano BETWEEN 2000 AND 2200),
    semestre smallint NOT NULL CHECK (semestre IN (1, 2)),
    conteudo jsonb NOT NULL,
    versao bigint NOT NULL DEFAULT 1,
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (crianca_id, ano, semestre)
);
