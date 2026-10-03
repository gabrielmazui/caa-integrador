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
