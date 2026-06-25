# Remédios — Medicine App

Aplicação web (PWA) para registrar medicamentos, horários e acompanhar o que tomar no dia.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Disponível em `http://localhost:3050`.

## Docker

```bash
cp .env.example .env
docker compose build
docker compose up -d
```

Porta no host: **3050**.

Produção: `https://med.leandrosouza.info`

## MVP

- Sem login — dados em IndexedDB (local)
- Tema claro padrão com alternância claro/escuro
- Páginas: Hoje, Medicamentos
- Futuro: login Supabase + sync em banco

## Aviso

Este app não substitui orientação médica ou farmacêutica.
