# CAA Integrador

## Requisitos

### Frontend

* Node.js 24.21.0
* npm 11.19.0
* Angular CLI 22.1.7

### Backend

* Java 21
* Spring Boot 4.1.1
* Gradle 9.7.1

### App

* Flutter 3.47.2
* Dart 3.13.2
* FVM

### Docker

* Docker Desktop

---

## Estrutura

```text
caa-integrador/
├── app/                 # Flutter
├── frontend/            # Angular
├── backend/             # Spring Boot
├── docker-compose.yml
└── README.md
```

---

## Docker

### Subir frontend e backend

Na raiz do projeto:

```bash
docker compose up --build
```

Para subir em segundo plano:

```bash
docker compose up -d --build
```

### Parar os containers

```bash
docker compose down
```

### Ver status dos containers

```bash
docker compose ps
```

### Ver logs

```bash
docker compose logs
```

Logs apenas do backend:

```bash
docker compose logs backend
```

Logs apenas do frontend:

```bash
docker compose logs frontend
```

---

## Frontend — Angular

Para rodar o Angular sem Docker:

```bash
cd frontend
ng serve
```

A aplicação estará disponível em:

```text
http://localhost:4200
```

---

## Backend — Spring Boot

Para rodar o Spring Boot sem Docker:

```bash
cd backend
gradlew bootRun
```

O backend estará disponível em:

```text
http://localhost:8080
```

---

## App — Flutter

O Flutter não é executado pelo Docker.

Entre na pasta:

```bash
cd app
```

### Ver dispositivos disponíveis

```bash
fvm flutter devices
```

### Rodar o aplicativo

```bash
fvm flutter run
```

### Android Studio

Para simular o aplicativo Android:

1. Abra o **Android Studio**.
2. Abra o **Device Manager**.
3. Crie ou inicie um Android Virtual Device (emulador).
4. Com o emulador aberto, execute:

```bash
fvm flutter run
```

Também é possível selecionar o dispositivo pelo VS Code e executar pelo modo de debug.

### iOS

No macOS, com Xcode instalado e um iPhone ou simulador disponível:

```bash
fvm flutter devices
```

Depois:

```bash
fvm flutter run
```

---

## Portas

| Serviço     | Porta |
| ----------- | ----: |
| Angular     |  4200 |
| Spring Boot |  8080 |
| Flutter     |     — |

---

## Execução recomendada

Para desenvolvimento completo usando Docker:

```bash
docker compose up --build
```

Depois acessar:

* Frontend: `http://localhost:4200`
* Backend: `http://localhost:8080`

O Flutter deve ser executado separadamente com:

```bash
cd app
fvm flutter run
```
