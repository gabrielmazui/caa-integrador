# Frontend — CAA Integrador

Interface web desenvolvida com Angular, Tailwind CSS e DaisyUI.

## Requisitos

- Node.js 24.21.0
- npm 11.19.0

## Executar localmente

Entre na pasta do frontend e instale as dependências:

```bash
cd frontend
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm start
```

A aplicação estará disponível em `http://localhost:4200`.

O comando `npm start` gera automaticamente o CSS do Tailwind antes de iniciar
o Angular. Portanto, não é necessário executar `build-css.mjs` manualmente.

Para que as chamadas à API funcionem, o backend deve estar disponível em
`http://localhost:8080`.

## Gerar o build de produção

```bash
npm run build
```

O CSS do Tailwind também é gerado automaticamente antes do build. Os arquivos
finais são gravados em `dist/`.

## Outros comandos

Executar o build em modo de observação:

```bash
npm run watch
```

Executar os testes:

```bash
npm test
```
