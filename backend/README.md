# Backend — CAA Integrador

API REST em Spring Boot com autenticação JWT e autorização por vínculo com cada criança.

## Executar

Na raiz do projeto, copie `.env.example` para `.env`, troque `JWT_SECRET` e execute:

```bash
docker compose up --build
```

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
