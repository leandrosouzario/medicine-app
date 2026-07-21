# Remédios — Medicine App

Aplicação web (PWA) para registrar medicamentos, horários e acompanhar o que tomar no dia.

**URL de produção:** `https://med.leandrosouza.info`  
**Porta local:** 3050

**Stack:** Next.js 16 · React 18 · TypeScript · Tailwind · Supabase

## Funcionalidades

- Login SSO via auth-app (conta compartilhada com gym-app, balcao-app, etc.)
- CRUD de medicamentos com horários fixos, intervalo ou “quando necessário”
- Seleção de dias da semana
- Tela **Hoje** — marcar tomado, pular ou perdido (automático)
- Tela **Histórico** — aderência dos últimos 7/30 dias por medicamento e por dia
- Dados sincronizados no Supabase (`med_medications`, `med_dose_events`)
- PWA instalável com ícones PNG e notificações locais de dose (ação **Tomado** grava no histórico)
- Importação única de dados legados do IndexedDB (dispositivos antigos)

## Pré-requisitos

- Docker e Docker Compose
- Variáveis em `.env` (copiar de `.env.example`)

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

## Deploy no servidor (mini-server)

```bash
cp .env.example .env
# Preencher NEXT_PUBLIC_SUPABASE_ANON_KEY e URLs de produção
docker compose up -d --build
docker compose logs -f medicine-app
```

Porta no host: **3050** → container **3000**.

Cloudflare Tunnel: `med.leandrosouza.info` → host `:3050`

## Desenvolvimento local (sem Docker)

```bash
cp .env.example .env
npm install
npm run icons   # gera PNGs PWA (requer @resvg/resvg-js)
npm run dev
```

Abrir: **http://localhost:3050**

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL canônica (`https://med.leandrosouza.info`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Instância Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon pública |
| `NEXT_PUBLIC_AUTH_LOGIN_URL` | URL de login do auth-app |
| `NEXT_PUBLIC_AUTH_PROFILE_URL` | URL de perfil do auth-app |

Todas as `NEXT_PUBLIC_*` devem estar em `.env` **e** passar como `args` no `docker-compose.yml` (build-time do Next.js).

## Estrutura

```
src/app/                  páginas e layout
src/features/medications/ CRUD, doses, formulários, sync
src/lib/supabase/         clientes Supabase + middleware SSO
src/lib/dates.ts          datas locais + fuso horário
public/icons/             icon.svg + PNGs gerados no build
supabase/migrations/      tabelas med_*
```

Documentação do agente: `AGENTS.md` · Ecossistema: `../ECOSYSTEM.md`

## Git

`git@github.com:leandrosouzario/medicine-app.git` · branch `main`

## Aviso

Este app não substitui orientação médica ou farmacêutica.
