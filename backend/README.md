# Backend — CAA Integrador

API REST em Spring Boot com autenticação JWT e autorização por vínculo com cada criança.

## Requisitos

- Java 21
- PostgreSQL 18

Não é necessário instalar o Gradle globalmente, pois o projeto inclui o Gradle
Wrapper.

## Executar com Docker

Na raiz do projeto, copie `.env.example` para `.env`, troque `JWT_SECRET` e execute:

```bash
docker compose up --build
```

## Executar o backend localmente

O backend precisa de um PostgreSQL. Para iniciar somente o banco pelo Docker,
execute na raiz do projeto:

```bash
docker compose up -d postgres
```

Depois, entre na pasta do backend e inicie a aplicação.

No Windows:

```powershell
cd backend
.\gradlew.bat bootRun
```

No Linux ou macOS:

```bash
cd backend
./gradlew bootRun
```

O backend estará disponível em `http://localhost:8080`.

Por padrão, a execução local usa o banco `caa_db`, usuário `caa_user` e senha
`caa_password` em `localhost:5432`. Esses valores podem ser alterados pelas
variáveis `DB_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD` e `JWT_SECRET`.

## Testes

No Windows:

```powershell
.\gradlew.bat test
```

No Linux ou macOS:

```bash
./gradlew test
```

## Autenticação

As rotas autenticadas recebem o cabeçalho:

```text
Authorization: Bearer <accessToken>
```

## Rotas iniciais

### Saúde e diagnóstico

| Método | Rota | Acesso | Uso |
| --- | --- | --- | --- |
| GET | `/api/health` | Público | Saúde geral, incluindo banco e espaço em disco |
| GET | `/api/health/liveness` | Público | Verifica se a aplicação está viva, independentemente do banco |
| GET | `/api/health/readiness` | Público | Verifica se está pronta para receber tráfego e se o banco responde |
| GET | `/api/info` | JWT | Nome, versão e data da compilação |
| GET | `/api/metrics` | JWT + perfil dev | Lista métricas disponíveis |
| GET | `/api/metrics/jvm.memory.used` | JWT + perfil dev | Memória utilizada pela JVM |
| GET | `/api/metrics/http.server.requests` | JWT + perfil dev | Estatísticas das requisições; aparece após haver tráfego |
| GET | `/api/mappings` | JWT + perfil dev | Rotas registradas e métodos HTTP aceitos |

As rotas de saúde retornam o status, por exemplo `{"status":"UP"}`. A rota
geral também pode listar os grupos públicos `liveness` e `readiness`, sem expor
componentes ou detalhes internos.
`DOWN` e `OUT_OF_SERVICE` retornam HTTP 503. Uma falha no banco deixa a
readiness indisponível, sem transformar a liveness em uma falha que provoque
reinicializações desnecessárias. O Docker e o seed aguardam a readiness.
Durante a inicialização, antes do servidor abrir a porta, a conexão pode ser recusada.

Ative os diagnósticos adicionais somente no ambiente de desenvolvimento:

```powershell
$env:SPRING_PROFILES_ACTIVE = "dev"
.\gradlew.bat bootRun
```

Teste a saúde sem login:

```bash
curl -i http://localhost:8080/api/health/readiness
```

Para consultar diagnósticos, use o token recebido no login:

```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:8080/api/info
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:8080/api/metrics
```

As informações de build são geradas pelo Gradle em `bootRun` e `bootJar`.
Os endpoints de ambiente, configurações, heap dump e desligamento não são
expostos. As operações do Actuator são somente leitura; os diagnósticos não
alteram logs ou configurações em execução. Sem o perfil dev, métricas e
mapeamentos não são publicados via HTTP.

Erros que chegam ao fallback `/error`, incluindo URLs inexistentes, retornam JSON
com status, mensagem e caminho original. A página Whitelabel do Spring não é exposta.

### Autenticação

| Método | Rota | Uso |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Criar conta profissional ou familiar |
| `POST` | `/api/auth/login` | Entrar e obter o token |
| `GET` | `/api/auth/me` | Consultar o perfil autenticado |

### Crianças e equipe

| Método | Rota | Uso |
| --- | --- | --- |
| `POST` | `/api/criancas` | Criar uma criança e seu primeiro vínculo |
| `GET` | `/api/criancas` | Listar crianças do usuário |
| `GET` | `/api/criancas/{criancaId}` | Consultar criança e permissões do vínculo |
| `GET` | `/api/criancas/{criancaId}/membros` | Listar equipe e familiares |
| `POST` | `/api/criancas/{criancaId}/membros` | Adicionar usuário já cadastrado à equipe |
| `DELETE` | `/api/criancas/{criancaId}/membros/{usuarioId}` | Remover um membro da equipe |
| `POST` | `/api/criancas/{criancaId}/sair` | Sair da equipe ou excluir a criança quando for o último membro |
| `PUT` | `/api/criancas/{criancaId}/meu-vinculo` | Alterar somente o próprio parentesco com a criança |

A data de nascimento, quando informada, deve estar entre a data atual e 100 anos atrás.
Datas futuras e idades acima de 100 anos são rejeitadas no cadastro e na edição.

Os vínculos da equipe são `profissional` ou `responsavel`. A especialidade fica
no perfil do profissional, enquanto responsáveis podem informar opcionalmente o
parentesco (mãe, pai ou outro). Criador, coordenadores e responsáveis podem
adicionar ou remover membros; essa permissão não concede acesso às demais
configurações da criança.

Cada criança possui exatamente um coordenador: inicialmente, é a pessoa que a
criou, seja profissional ou responsável. A coordenação não é oferecida no fluxo
normal de convite. Ao sair, o coordenador deve indicar outro membro ativo para
assumir. Se for o último membro, a confirmação da saída também exclui a criança
do sistema.

Quando um responsável cria uma criança, pode informar `relacaoResponsavel` e
`descricaoRelacao` no cadastro. O parentesco pertence ao vínculo entre aquele
usuário e aquela criança, não ao perfil global do responsável.

### Feed

| Método | Rota | Uso |
| --- | --- | --- |
| `GET` | `/api/criancas/{criancaId}/registros` | Listar feed visível ao usuário |
| `POST` | `/api/criancas/{criancaId}/registros` | Publicar para `todos` ou `profissionais` |
| `GET` | `/api/criancas/{criancaId}/registros/{registroId}/comentarios` | Listar comentários |
| `POST` | `/api/criancas/{criancaId}/registros/{registroId}/comentarios` | Comentar |

### Área profissional e apoio à família

| Método | Rota | Uso |
| --- | --- | --- |
| `GET/POST` | `/api/criancas/{criancaId}/chat` | Chat de grupo exclusivo dos profissionais |
| `GET/POST` | `/api/criancas/{criancaId}/anotacoes-pei` | Banco semestral de evidências para o PEI |
| `GET` | `/api/criancas/{criancaId}/glossario` | Glossário global e específico da criança |
| `POST` | `/api/criancas/{criancaId}/glossario` | Criar termo específico (profissionais) |

O feed aplica a visibilidade também ao acesso aos comentários. Familiares não acessam chat ou anotações do PEI, mesmo que conheçam os identificadores das rotas.

### Editor do PEI

O PEI é um documento único por criança, ano e semestre. A tela permite editar
os títulos, preencher os campos do modelo e ocultar partes sem apagar seus textos.
Registros anteriores permanecem disponíveis para consulta e cópia.

`GET/PUT /api/criancas/{criancaId}/pei?ano=2026&semestre=2` usa vínculo profissional.
A migração V8 cria documentos_pei, preservando anotacoes_pei. O corpo contém
`version` e `topics` (key, title, enabled, fields, selected). O salvamento é
condicional à versão: conflitos retornam 409, sem sobrescrever outro profissional.

A exportação preenche localmente o PDF-base de 12 páginas em frontend/public/pei.
Não envia dados a conversores externos. Mantém tabelas e elementos do modelo;
campos de exemplo são limpos, e textos grandes demais interrompem a exportação
com aviso. O usuário deve revisar os dados antes de assinar o documento.

Para atualizar o modelo, use scripts/prepare_pei_template.py com o PDF original
(requer PyMuPDF). O teste frontend/pei-qa.ts gera um PDF sintético para inspeção
e verifica a rejeição de texto que excede o espaço disponível.
