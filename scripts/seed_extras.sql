-- Global glossary terms (crianca_id IS NULL, require direct DB insert)
-- Run with:
--   docker compose exec -T postgres psql -U caa_user -d caa_db < scripts/seed_extras.sql

INSERT INTO termos_glossario (id, crianca_id, termo, definicao, criado_por_id, criado_em, atualizado_em)
SELECT
  gen_random_uuid(),
  NULL,
  t.termo,
  t.definicao,
  u.id,
  NOW(),
  NOW()
FROM (VALUES
  ('CAA', 'Comunicação Alternativa e Aumentativa: conjunto de técnicas, estratégias e tecnologias que complementam ou substituem a fala de pessoas com dificuldades de comunicação oral.'),
  ('PECS', 'Picture Exchange Communication System: sistema de comunicação por troca de figuras desenvolvido para crianças com autismo, baseado em ABA, que ensina a iniciativa comunicativa.'),
  ('TEACCH', 'Treatment and Education of Autistic and related Communication-handicapped Children: abordagem estruturada de educação especial que utiliza organização visual do ambiente e das tarefas.'),
  ('Comunicação Funcional', 'Comunicação que serve a um propósito real no cotidiano da pessoa, como pedir, recusar, comentar, cumprimentar — em oposição a respostas treinadas sem generalização.'),
  ('Habilidade Adaptativa', 'Conjunto de competências práticas, sociais e conceituais necessárias para funcionar de forma independente no dia a dia, como higiene, uso de dinheiro e comunicação social.')
) AS t(termo, definicao)
JOIN usuarios u ON u.email = 'ana@caa.dev'
WHERE NOT EXISTS (
  SELECT 1 FROM termos_glossario tg WHERE tg.crianca_id IS NULL AND LOWER(tg.termo) = LOWER(t.termo)
);

-- Sample attachments (images from picsum.photos — stable seed URLs)
-- These attach to the first 4 registros of Sofia's feed
WITH sofia_registros AS (
  SELECT r.id, row_number() OVER (ORDER BY r.criado_em) AS rn
  FROM registros r
  JOIN criancas c ON r.crianca_id = c.id
  WHERE c.nome = 'Sofia'
  LIMIT 4
)
INSERT INTO anexos (id, registro_id, url, tipo, nome_arquivo, mime_type, criado_em)
SELECT
  gen_random_uuid(),
  sr.id,
  'https://picsum.photos/seed/' || (100 + sr.rn) || '/800/600',
  'imagem',
  'foto-sessao-' || sr.rn || '.jpg',
  'image/jpeg',
  NOW()
FROM sofia_registros sr;

-- Image attachments for Miguel's first 3 registros
WITH miguel_registros AS (
  SELECT r.id, row_number() OVER (ORDER BY r.criado_em) AS rn
  FROM registros r
  JOIN criancas c ON r.crianca_id = c.id
  WHERE c.nome = 'Miguel'
  LIMIT 3
)
INSERT INTO anexos (id, registro_id, url, tipo, nome_arquivo, mime_type, criado_em)
SELECT
  gen_random_uuid(),
  mr.id,
  'https://picsum.photos/seed/' || (200 + mr.rn) || '/800/600',
  'imagem',
  'foto-atividade-' || mr.rn || '.jpg',
  'image/jpeg',
  NOW()
FROM miguel_registros mr;
