BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION atualizar_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$;

CREATE TABLE usuarios (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          nome VARCHAR(255) NOT NULL,
                          email VARCHAR(255) NOT NULL,
                          senha_hash VARCHAR(255) NOT NULL,
                          especialidade VARCHAR(100),
                          registro_profissional VARCHAR(100),
                          telefone VARCHAR(30),
                          foto_url TEXT,
                          ativo BOOLEAN NOT NULL DEFAULT TRUE,
                          criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          excluido_em TIMESTAMPTZ,

                          CONSTRAINT chk_usuario_nome_nao_vazio
                              CHECK (btrim(nome) <> ''),
                          CONSTRAINT chk_usuario_email_nao_vazio
                              CHECK (btrim(email) <> '')
);

CREATE UNIQUE INDEX uq_usuarios_email_normalizado
    ON usuarios (lower(email));

CREATE TRIGGER trg_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

CREATE TABLE criancas (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          nome VARCHAR(255) NOT NULL,
                          data_nascimento DATE,
                          foto_url TEXT,
                          observacoes TEXT,
                          ativo BOOLEAN NOT NULL DEFAULT TRUE,
                          criado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
                          criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          excluido_em TIMESTAMPTZ,

                          CONSTRAINT chk_crianca_nome_nao_vazio
                              CHECK (btrim(nome) <> ''),
                          CONSTRAINT chk_data_nascimento_valida
                              CHECK (data_nascimento IS NULL OR data_nascimento <= CURRENT_DATE)
);

CREATE TRIGGER trg_criancas_atualizado_em
    BEFORE UPDATE ON criancas
    FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

-- Relacao muitos-para-muitos entre usuarios e criancas.
CREATE TABLE equipe_crianca (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                crianca_id UUID NOT NULL
                                    REFERENCES criancas(id) ON DELETE CASCADE,
                                usuario_id UUID NOT NULL
                                    REFERENCES usuarios(id) ON DELETE CASCADE,

                                papel VARCHAR(50) NOT NULL,
                                descricao_funcao VARCHAR(150),

                                pode_publicar BOOLEAN NOT NULL DEFAULT TRUE,
                                pode_comentar BOOLEAN NOT NULL DEFAULT TRUE,
                                pode_ver_chat BOOLEAN NOT NULL DEFAULT TRUE,
                                pode_convidar BOOLEAN NOT NULL DEFAULT FALSE,
                                pode_editar_crianca BOOLEAN NOT NULL DEFAULT FALSE,

                                status VARCHAR(20) NOT NULL DEFAULT 'ativo',
                                adicionado_por_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
                                adicionado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT uq_equipe_crianca_usuario
                                    UNIQUE (crianca_id, usuario_id),
                                CONSTRAINT chk_equipe_papel
                                    CHECK (papel IN (
                                                     'mae',
                                                     'pai',
                                                     'responsavel',
                                                     'professor',
                                                     'terapeuta',
                                                     'coordenador',
                                                     'outro'
                                        )),
                                CONSTRAINT chk_equipe_status
                                    CHECK (status IN ('convidado', 'ativo', 'inativo'))
);

CREATE INDEX idx_equipe_crianca_crianca
    ON equipe_crianca (crianca_id)
    WHERE status = 'ativo';

CREATE INDEX idx_equipe_crianca_usuario
    ON equipe_crianca (usuario_id)
    WHERE status = 'ativo';

CREATE TRIGGER trg_equipe_crianca_atualizado_em
    BEFORE UPDATE ON equipe_crianca
    FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

CREATE TABLE registros (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           crianca_id UUID NOT NULL
                               REFERENCES criancas(id) ON DELETE CASCADE,
                           autor_id UUID
                                           REFERENCES usuarios(id) ON DELETE SET NULL,
                           conteudo TEXT,
                           fixado BOOLEAN NOT NULL DEFAULT FALSE,
                           criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           excluido_em TIMESTAMPTZ,

                           CONSTRAINT chk_registro_conteudo
                               CHECK (conteudo IS NULL OR btrim(conteudo) <> '')
);

CREATE INDEX idx_registros_feed
    ON registros (crianca_id, criado_em DESC)
    WHERE excluido_em IS NULL;

CREATE INDEX idx_registros_autor
    ON registros (autor_id);

CREATE TRIGGER trg_registros_atualizado_em
    BEFORE UPDATE ON registros
    FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

CREATE TABLE comentarios (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             registro_id UUID NOT NULL
                                 REFERENCES registros(id) ON DELETE CASCADE,
                             autor_id UUID
                                              REFERENCES usuarios(id) ON DELETE SET NULL,
                             conteudo TEXT,
                             criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             excluido_em TIMESTAMPTZ,

                             CONSTRAINT chk_comentario_conteudo
                                 CHECK (conteudo IS NULL OR btrim(conteudo) <> '')
);

CREATE INDEX idx_comentarios_registro
    ON comentarios (registro_id, criado_em)
    WHERE excluido_em IS NULL;

CREATE TRIGGER trg_comentarios_atualizado_em
    BEFORE UPDATE ON comentarios
    FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

CREATE TABLE tags (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                      crianca_id UUID NOT NULL
                          REFERENCES criancas(id) ON DELETE CASCADE,
                      nome VARCHAR(50) NOT NULL,
                      cor_hex VARCHAR(7) NOT NULL DEFAULT '#808080',
                      criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                      CONSTRAINT chk_tag_nome_nao_vazio
                          CHECK (btrim(nome) <> ''),
                      CONSTRAINT chk_tag_cor_hex
                          CHECK (cor_hex ~ '^#[0-9A-Fa-f]{6}$')
    );

CREATE UNIQUE INDEX uq_tags_nome_por_crianca
    ON tags (crianca_id, lower(nome));

CREATE TABLE registro_tags (
                               registro_id UUID NOT NULL
                                   REFERENCES registros(id) ON DELETE CASCADE,
                               tag_id UUID NOT NULL
                                   REFERENCES tags(id) ON DELETE CASCADE,
                               PRIMARY KEY (registro_id, tag_id)
);

CREATE INDEX idx_registro_tags_tag
    ON registro_tags (tag_id);

CREATE TABLE mensagens_chat (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                crianca_id UUID NOT NULL
                                    REFERENCES criancas(id) ON DELETE CASCADE,
                                remetente_id UUID
                                                REFERENCES usuarios(id) ON DELETE SET NULL,
                                conteudo TEXT,
                                criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                excluido_em TIMESTAMPTZ,

                                CONSTRAINT chk_mensagem_conteudo
                                    CHECK (conteudo IS NULL OR btrim(conteudo) <> '')
);

CREATE INDEX idx_mensagens_chat_crianca
    ON mensagens_chat (crianca_id, criado_em DESC)
    WHERE excluido_em IS NULL;

CREATE TRIGGER trg_mensagens_chat_atualizado_em
    BEFORE UPDATE ON mensagens_chat
    FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

-- Cada anexo pertence a apenas uma das tres entidades.
CREATE TABLE anexos (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        url TEXT NOT NULL,
                        tipo VARCHAR(20) NOT NULL,
                        nome_arquivo VARCHAR(255),
                        mime_type VARCHAR(100),
                        tamanho_bytes BIGINT,

                        registro_id UUID
                            REFERENCES registros(id) ON DELETE CASCADE,
                        comentario_id UUID
                            REFERENCES comentarios(id) ON DELETE CASCADE,
                        mensagem_chat_id UUID
                            REFERENCES mensagens_chat(id) ON DELETE CASCADE,

                        criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                        CONSTRAINT chk_anexo_url_nao_vazia
                            CHECK (btrim(url) <> ''),
                        CONSTRAINT chk_anexo_tipo
                            CHECK (tipo IN ('imagem', 'audio', 'video', 'documento')),
                        CONSTRAINT chk_anexo_tamanho
                            CHECK (tamanho_bytes IS NULL OR tamanho_bytes >= 0),
                        CONSTRAINT chk_anexo_pertence_exatamente_um
                            CHECK (num_nonnulls(registro_id, comentario_id, mensagem_chat_id) = 1)
);

CREATE INDEX idx_anexos_registro
    ON anexos (registro_id)
    WHERE registro_id IS NOT NULL;

CREATE INDEX idx_anexos_comentario
    ON anexos (comentario_id)
    WHERE comentario_id IS NOT NULL;

CREATE INDEX idx_anexos_mensagem_chat
    ON anexos (mensagem_chat_id)
    WHERE mensagem_chat_id IS NOT NULL;

COMMIT;
