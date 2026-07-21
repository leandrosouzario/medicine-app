# Remédios — Agent Guide

App de controle de medicamentos em `https://med.leandrosouza.info`.

## Ecossistema

- Listado no **hub-app** (`https://hub.leandrosouza.info`) como **Controle de Medicamentos**, com link ativo para esta app
- SSO compartilhado com `auth-app`, `gym-app`, `balcao-app` e demais apps do domínio `.leandrosouza.info`
- Mapa completo de subdomínios, portas e decisões em `../ECOSYSTEM.md`

## Escopo

- Autenticação via Supabase SSO (delegada ao `auth-app`) em `src/middleware.ts` e `src/lib/supabase/`
- UI e fluxos em `src/app/(app)/`
- Componentes em `src/components/`
- Persistência em Supabase (`med_medications`, `med_dose_events`) via `src/features/medications/`
- Agenda: horários fixos, intervalo (a cada X h), quando necessário; dias da semana
- Doses perdidas: pending com horário passado → `missed` ao sincronizar (abrir Hoje)
- Histórico: `/historico` — resumo de aderência (7 ou 30 dias), por medicamento e por dia
- Importação única do IndexedDB local (legado S1) em `LocalDataMigrator`
- Fuso horário local via cookie `tz_offset_min` (`TzSetter`) — geração de doses no servidor respeita o offset do browser
- PWA via `src/app/manifest.ts` + service worker (`public/sw.js`) com notificações locais de dose
- Ação **Tomado** na notificação grava dose via `NotificationActionHandler` + server action

**Fora de escopo:** API routes próprias, integração com balcao-app.

## Stack

Next.js 16 · React 18 · TypeScript · Tailwind 3 · next-themes · @supabase/ssr · idb-keyval · porta **3050** · Docker `3050:3000`

## Estrutura

```
src/app/              layout, páginas, globals.css
src/middleware.ts     gate de autenticação (tudo protegido exceto assets)
src/components/       layout (AppShell, AppHeader), TzSetter, ServiceWorkerRegistration, ui
src/features/medications/  CRUD, doses, sync, TimePicker, DatePicker, DaysOfWeekPicker
src/lib/dates.ts      datas locais + funções offset-aware
src/lib/tz.ts         leitura do cookie tz_offset_min (server)
src/lib/db/           IndexedDB legado (importação única)
src/lib/supabase/     client.ts, server.ts, middleware.ts, cookie-options.ts
public/               manifest.ts (via app/), sw.js, icon.svg + PNGs gerados no build
scripts/              generate-icons.mjs
supabase/migrations/  tabelas med_*
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

`git@github.com:leandrosouzario/medicine-app.git` · branch **`main`** (desenvolvimento consolidado)

## Roadmap

| Sprint | Entrega | Status |
|--------|---------|--------|
| S0 | Setup, tema, navegação, PWA básico | Concluída |
| S1 | CRUD medicamentos + geração de doses | Concluída |
| S2 | Tela Hoje, marcar tomado/pulado | Concluída |
| S2.5 | Autenticação Supabase SSO | Concluída |
| S3 | Supabase (`med_*` + RLS) + import IndexedDB | Concluída |
| S4 | PWA completo (ícones PNG, service worker) | Concluída |
| S5 | Consolidação (docs, branch main) | Concluída |
| S6 | Agenda avançada (intervalo, dias, perdido auto, DatePicker) | Concluída |
| S7 | Histórico e aderência (7/30 dias, % tomadas) | Concluída |
| S8 | Notificações: ação “Tomado” grava no BD | Concluída |

## Notificações (limitações)

- Agendamento via `setTimeout` no service worker — funciona com app em segundo plano ou aberto
- **iOS:** lembretes não são confiáveis com app fechado por longos períodos; instale na Tela de Início
- Botão **Tomado** na notificação: `postMessage` → `NotificationActionHandler` → `updateDoseEventStatus`; se o app estiver fechado, abre `/hoje?taken=<id>`
- **Snooze** (10 min) é local ao dispositivo, não persiste no Supabase
- Push server-side (fora do escopo): exigiria backend/worker no mini-server
