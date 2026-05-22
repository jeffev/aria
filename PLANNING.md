# ARIA — Automated Routine Intelligence Assistant

> Dashboard web pessoal com IA (Gemini), agenda própria, tarefas, notas, clima, pesquisa global, notificações do browser e integração com Google Calendar, Teams e Discord.

*Última atualização: 2026-05-02*

---

## Decisões de Arquitetura

| Decisão              | Escolha                                      |
|----------------------|----------------------------------------------|
| Plataforma           | Web (browser)                                |
| Interface            | Dashboard + chat com input texto/áudio       |
| IA                   | Google Gemini 1.5 Flash (gratuito)           |
| ORM                  | Prisma 7 + adapter `@prisma/adapter-pg`      |
| Dev local            | Docker Compose (PostgreSQL) + Next.js dev    |
| Cloud                | Vercel (app + cron) + Supabase (PostgreSQL)  |
| Teams                | Microsoft Graph API — somente leitura        |
| Discord              | Discord REST API — somente leitura           |
| Google Calendar      | OAuth 2.0 — somente leitura, sync para Agenda|
| Agenda               | Própria do app; fontes externas alimentam ela |
| Arduino (v2)         | ESP32 via HTTP — mesmo backend               |

---

## Stack

| Camada         | Local                    | Cloud (produção)              |
|----------------|--------------------------|-------------------------------|
| Framework      | Next.js 16 (App Router)  | Vercel (free)                 |
| Banco de dados | PostgreSQL 16 (Docker)   | Supabase PostgreSQL (free)    |
| ORM            | Prisma 7                 | Prisma 7 (mesma config)       |
| IA             | Gemini 1.5 Flash API     | Gemini 1.5 Flash API          |
| Áudio input    | Web Speech API (browser) | Web Speech API (browser)      |
| Clima          | Open-Meteo (sem API key) | Open-Meteo (sem API key)      |
| Estilo         | CSS-in-JS inline + vars  | Idem                          |
| Cron jobs      | Manual / `/api/cron/*`   | Vercel Cron Jobs              |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL (Docker Compose)                    │
│                                                             │
│   Next.js :3000  ──────────►  PostgreSQL :5432 (Docker)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CLOUD (produção)                          │
│                                                             │
│   Vercel (Next.js + Cron)  ─────►  Supabase (PostgreSQL)   │
└─────────────────────────────────────────────────────────────┘

APIs externas consumidas:
  - Google Gemini API       (IA / chat)
  - Open-Meteo API          (clima, sem auth)
  - Google Calendar API     (OAuth 2.0, leitura)
  - Microsoft Graph API     (Teams, OAuth — requer TI)
  - Discord REST API        (polling, bot token)
  - Nominatim / OSM         (geocodificação reversa, sem auth)

Futuro (Fase 2):
  - Arduino ESP32 ─── HTTP ──► mesmas API routes do Next.js
```

---

## Estrutura de Pastas

```
aria/
├── docker-compose.yml
├── PLANNING.md
├── FUTURE_FEATURES.md
└── app/                              ← projeto Next.js
    ├── prisma/
    │   ├── schema.prisma
    │   ├── prisma.config.ts
    │   └── migrations/
    ├── generated/prisma/             ← gerado, não commitar
    ├── app/
    │   ├── (dashboard)/
    │   │   ├── layout.tsx            ← sidebar + event-notifications
    │   │   ├── page.tsx              ← dashboard (server component)
    │   │   ├── agenda/page.tsx
    │   │   ├── tarefas/page.tsx
    │   │   ├── notas/page.tsx
    │   │   ├── notificacoes/page.tsx
    │   │   └── configuracoes/page.tsx
    │   └── api/
    │       ├── agenda/route.ts
    │       ├── agenda/[id]/route.ts
    │       ├── tarefas/route.ts
    │       ├── tarefas/[id]/route.ts
    │       ├── notas/route.ts
    │       ├── notas/[id]/route.ts
    │       ├── gemini/route.ts
    │       ├── search/route.ts
    │       ├── google/auth/route.ts
    │       ├── google/callback/route.ts
    │       ├── google/sync/route.ts
    │       └── cron/
    │           ├── teams-sync/route.ts
    │           ├── discord-sync/route.ts
    │           └── briefing/route.ts
    ├── components/
    │   ├── sidebar.tsx               ← search + weather embutidos
    │   ├── chat.tsx                  ← Gemini + Web Speech API
    │   ├── search.tsx                ← pesquisa global (Ctrl+K)
    │   ├── weather.tsx               ← Open-Meteo widget
    │   └── event-notifications.tsx  ← Web Notifications API
    ├── lib/
    │   ├── prisma.ts                 ← Pool pg + PrismaPg adapter
    │   ├── gemini.ts
    │   ├── teams.ts
    │   ├── discord.ts
    │   └── google-calendar.ts
    ├── .env.local                    ← não commitar
    ├── .env.example                  ← template documentado
    └── vercel.json                   ← cron jobs cloud
```

---

## Schema do Banco (atual)

```prisma
model Task         { id, title, description?, priority, dueDate?, done, createdAt, updatedAt }
model Event        { id, title, description?, startAt, endAt?, allDay, source, sourceId?, createdAt, updatedAt }
model Note         { id, title, content, pinned, createdAt, updatedAt }
model Setting      { key (PK), value, updatedAt }
model Notification { id, source, sourceId, content, read, receivedAt }
model AiMessage    { id, role, content, createdAt }

enum Priority           { LOW | MEDIUM | HIGH }
enum EventSource        { MANUAL | TEAMS | GOOGLE_CALENDAR }
enum NotificationSource { TEAMS | DISCORD }
```

---

## Variáveis de Ambiente

```env
# Banco — Local
DATABASE_URL="postgresql://aria:aria_dev@localhost:5432/aria_db"

# Banco — Cloud (Supabase)
# DATABASE_URL="postgresql://postgres.[ref]:[senha]@pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://postgres.[ref]:[senha]@pooler.supabase.com:5432/postgres"

# IA
GEMINI_API_KEY=

# Google Calendar (OAuth 2.0)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Microsoft Teams (requer aprovação TI)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=
MICROSOFT_REFRESH_TOKEN=

# Discord
DISCORD_TOKEN=
DISCORD_USER_ID=

# Cron protection (cloud)
CRON_SECRET=
```

---

## Funcionalidades Implementadas

### Core
- [x] Dashboard com stat cards (reuniões hoje, tarefas pendentes, notificações)
- [x] Chat com ARIA (Gemini 1.5 Flash) — texto e áudio (Web Speech API)
- [x] Contexto real injetado no prompt (tarefas + próximos eventos)
- [x] Histórico de conversa persistido no banco

### Agenda
- [x] Visualização semanal (seg–dom) com navegação
- [x] CRUD completo de eventos manuais
- [x] Eventos com título, descrição, data, hora início/fim, dia inteiro
- [x] Suporte a múltiplas fontes (MANUAL, TEAMS, GOOGLE_CALENDAR)
- [x] Eventos de fontes externas são somente leitura

### Tarefas
- [x] CRUD completo com prioridade (Alta/Média/Baixa) e prazo
- [x] Filtros: Pendentes / Todas / Concluídas
- [x] Alerta visual de prazo vencido
- [x] Ordenação automática por status e prazo

### Notas
- [x] Editor de texto livre com autosave (800ms debounce)
- [x] Fixar nota no topo (pin)
- [x] Preview de conteúdo na lista

### Pesquisa Global
- [x] Atalho Ctrl+K
- [x] Busca simultânea em tarefas, eventos e notas
- [x] Debounce 300ms, navega para a página correta

### Widget de Clima
- [x] Open-Meteo API (gratuito, sem chave)
- [x] Geolocalização do browser
- [x] Temperatura, sensação térmica, condição, cidade

### Notificações do Browser
- [x] Permissão solicitada ao entrar
- [x] Polling a cada 1 min para eventos nos próximos 15 min
- [x] Notificação nativa do OS, sem repetição na sessão

### Google Calendar
- [x] OAuth 2.0 completo (auth → callback → refresh token no banco)
- [x] Sync dos próximos 14 dias (upsert por sourceId)
- [x] Página de configurações com status de conexão e botão de sync

### Infraestrutura
- [x] Docker Compose (PostgreSQL local)
- [x] Prisma 7 com driver adapter (`pg` + `PrismaPg`)
- [x] API routes de cron com proteção por `CRON_SECRET`
- [x] `vercel.json` com cron jobs configurados (cloud)
- [x] `.env.example` documentado

---

## Pendente / Próximos Passos

### Integrações
- [ ] **Microsoft Teams** — requer aprovação TI no Azure AD
- [ ] **Discord** — implementar polling e salvar notificações no banco
- [ ] **Página de Notificações** — listar e marcar como lidas

### Qualidade
- [ ] Tratamento de erro nas API routes (try/catch + respostas padronizadas)
- [ ] Loading states no dashboard (dados do servidor)
- [ ] Briefing diário com IA implementado no cron

### Cloud
- [ ] Criar projeto Supabase
- [ ] Criar projeto Vercel e conectar ao Git
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Rodar `prisma migrate deploy` no Supabase
- [ ] Testar cron jobs em produção

---

## Aviso — Teams Corporativo

Requer que o **TI da empresa aprove** o app no Azure Active Directory. Verificar antes de iniciar. Alternativa: conta Microsoft pessoal (perde acesso ao calendário corporativo).

---

## Migração Local → Cloud (checklist)

- [ ] Supabase: criar projeto, copiar connection strings
- [ ] Vercel: criar projeto, conectar repositório Git, configurar env vars
- [ ] Rodar `npx prisma migrate deploy` apontando para Supabase
- [ ] Verificar cron jobs no painel Vercel
- [ ] Testar Google OAuth com redirect URI de produção
- [ ] Adicionar URI de produção no Google Cloud Console
