ALTER TABLE usuarios
    ADD COLUMN bio TEXT,
    ADD COLUMN telefone_novo VARCHAR(30);

UPDATE usuarios SET telefone_novo = telefone;
ALTER TABLE usuarios DROP COLUMN telefone;
ALTER TABLE usuarios RENAME COLUMN telefone_novo TO telefone;

ALTER TABLE criancas
    ADD COLUMN diagnostico VARCHAR(255),
    ADD COLUMN cid_10 VARCHAR(20);

CREATE TABLE arquivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    tamanho_bytes BIGINT,
    tipo VARCHAR(20) NOT NULL,
    uploader_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_arquivo_url CHECK (btrim(url) <> ''),
    CONSTRAINT chk_arquivo_tipo CHECK (tipo IN ('imagem', 'audio', 'video', 'documento', 'outro')),
    CONSTRAINT chk_arquivo_tamanho CHECK (tamanho_bytes IS NULL OR tamanho_bytes >= 0)
);

ALTER TABLE anexos ADD COLUMN arquivo_id UUID REFERENCES arquivos(id) ON DELETE SET NULL;
