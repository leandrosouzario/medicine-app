# Remédios — Agent Guide

App de controle de medicamentos em `https://med.leandrosouza.info`.

## Escopo

- Autenticação via Supabase SSO (delegada ao `auth-app`) em `src/middleware.ts` e `src/lib/supabase/`
- UI e fluxos em `src/app/(app)/`
- Componentes em `src/components/`
- Persistência local em `src/lib/db/` (IndexedDB via idb-keyval — temporário até migração para Supabase)
- PWA em `public/manifest.webmanifest`

**Fora de escopo:** API routes próprias, integração com balcao-app.

## Stack

Next.js 16 · React 18 · TypeScript · Tailwind 3 · next-themes · @supabase/ssr · idb-keyval · porta **3050** · Docker `3050:3000`

## Estrutura

```
src/app/              layout, páginas, globals.css
src/middleware.ts     gate de autenticação (tudo protegido exceto assets)
src/components/       layout (AppShell, AppHeader, ThemeToggle), ui
src/features/         domínio por feature (medications, doses)
src/lib/db/           IndexedDB + tipos (temporário)
src/lib/supabase/     client.ts, server.ts, middleware.ts, cookie-options.ts
public/               manifest, ícones PWA
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL canônica da app (`https://med.leandrosouza.info`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL da instância Supabase (`https://supabase.leandrosouza.info`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon pública do Supabase |
| `NEXT_PUBLIC_AUTH_LOGIN_URL` | URL de login do auth-app |
| `NEXT_PUBLIC_AUTH_PROFILE_URL` | URL de perfil do auth-app |

Todas as variáveis `NEXT_PUBLIC_*` devem estar em `.env` **e** passar como `args` no `docker-compose.yml` (necessário para build-time do Next.js).

## Autenticação

Todas as rotas são protegidas pelo middleware. Sem sessão válida → redirect para `NEXT_PUBLIC_AUTH_LOGIN_URL?next=<URL absoluta>`. O SSO funciona via cookie no domínio `.leandrosouza.info` compartilhado com `auth-app`, `gym-app`, etc.

## Convenções

- Server Components por padrão; `'use client'` para interatividade
- UI em pt-BR; acento visual **brand** (teal/cyan) + slate
- Tema claro padrão; toggle no header
- Nome exibido: **Remédios**
- Tabelas Supabase com prefixo `med_` (ex.: `med_medications`, `med_dose_events`)

## Deploy (Docker Compose — no mini-server)

```bash
# Primeira vez: criar .env a partir do exemplo
cp .env.example .env
# Preencher NEXT_PUBLIC_SUPABASE_ANON_KEY

docker compose build
docker compose up -d
docker compose logs -f medicine-app
```

- Host `:3050` → container `:3000`
- Cloudflare Tunnel: `med.leandrosouza.info` → host `:3050`

Após mudanças de código:

```bash
git pull
docker compose up -d --build
```

## Git

`git@github.com:leandrosouzario/medicine-app.git` · branch `main`

## Roadmap

| Sprint | Entrega |
|--------|---------|
| S0 | Setup, tema, navegação, PWA básico |
| S1 | CRUD medicamentos + IndexedDB + geração de doses |
| S2 | Tela Hoje, marcar tomado/pulado |
| S2.5 | Autenticação Supabase SSO (atual) |
| S3 | Migração IndexedDB → Supabase (med_medications, med_dose_events + RLS) |
| S4 | PWA completo (ícones PNG, service worker) |
