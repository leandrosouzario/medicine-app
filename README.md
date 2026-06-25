# Remédios — Medicine App

Aplicação web (PWA) para registrar medicamentos, horários e acompanhar o que tomar no dia.

## Deploy no MacBook (Docker Compose)

Requisito: **Docker Desktop** aberto e rodando.

```bash
cd ~/Documents/projetos/medicine-app
cp .env.example .env   # só na primeira vez
./scripts/deploy-mac.sh
```

Ou manualmente:

```bash
unset DOCKER_HOST
docker context use desktop-linux
docker compose up -d --build
```

Abrir: **http://localhost:3050**

## Deploy no servidor (Docker Compose)

```bash
cp .env.example .env
# Ajuste NEXT_PUBLIC_SITE_URL=https://med.leandrosouza.info
docker compose build
docker compose up -d
```

Porta no host: **3050** → container **3000**.

## Desenvolvimento local (sem Docker)

```bash
cp .env.example .env
npm install
npm run dev
```

## MVP

- Sem login — dados em IndexedDB (local)
- Tema claro padrão com alternância claro/escuro
- Páginas: Hoje, Medicamentos
- Futuro: login Supabase + sync em banco

## Aviso

Este app não substitui orientação médica ou farmacêutica.
