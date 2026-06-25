# Remédios — Agent Guide

App de controle de medicamentos em `https://med.leandrosouza.info`.

## Escopo

- UI e fluxos em `src/app/(app)/`
- Componentes em `src/components/`
- Persistência local em `src/lib/db/` (IndexedDB via idb-keyval)
- PWA em `public/manifest.webmanifest`

**Fora de escopo (MVP):** auth, Supabase, API routes, integração com balcao-app.

## Stack

Next.js 16 · React 18 · TypeScript · Tailwind 3 · next-themes · idb-keyval · porta **3050** · Docker `3050:3000`

## Estrutura

```
src/app/              layout, páginas, globals.css
src/components/       layout (AppShell, ThemeToggle), ui
src/features/         domínio por feature (medications, doses)
src/lib/db/           IndexedDB + tipos
public/               manifest, ícones PWA
```

## Convenções

- Server Components por padrão; `'use client'` para interatividade
- UI em pt-BR; acento visual **brand** (teal/cyan) + slate
- Tema claro padrão; toggle no header
- Nome exibido: **Remédios**

## Deploy (Docker Compose)

```bash
cp .env.example .env
docker compose build
docker compose up -d
docker compose logs -f medicine-app
```

- Host `:3050` → container `:3000`
- Cloudflare Tunnel: `med.leandrosouza.info` → host `:3050`

Dev local (sem Docker): `npm run dev` na porta 3050.

## Git

`git@github.com:leandrosouzario/medicine-app.git` · branch `main`

## Roadmap

| Sprint | Entrega |
|--------|---------|
| S0 | Setup, tema, navegação, PWA básico |
| S1 | CRUD medicamentos + IndexedDB + geração de doses |
| S2 | Tela Hoje, marcar tomado/pulado |
| S3 | PWA completo (ícones PNG, service worker) |
| v1 | Login Supabase + sync |
