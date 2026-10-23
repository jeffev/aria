# ARIA — Automated Routine Intelligence Assistant

Dashboard web pessoal com IA (Gemini), agenda própria, tarefas, notas, clima, pesquisa global, notificações do browser e integração com Google Calendar, Teams e Discord. Inclui também um overlay desktop via Electron.

**Demo:** https://aria-demo-beta.vercel.app — entre como visitante (conta temporária, apagada em 24 h). O chat usa a sua própria chave do Gemini, cadastrada em Configurações.

---

## Estrutura do Repositório

```
aria/
├── docker-compose.yml      ← PostgreSQL local
├── app/                    ← Web app (Next.js 16)
└── desktop/                ← Overlay desktop (Electron + Vite + React)
```

---

## Stack

| Camada         | Tecnologia                                 |
|----------------|--------------------------------------------|
| Framework web  | Next.js 16 (App Router) + React 19         |
| Linguagem      | TypeScript                                 |
| Banco de dados | PostgreSQL 16 (Docker local / Supabase)    |
| ORM            | Prisma 7 + adapter `pg`                    |
| IA             | Google Gemini 1.5 Flash                    |
| Estilo         | Tailwind CSS 4                             |
| Desktop        | Electron 34 + Vite 6                       |
| Deploy web     | Vercel                                     |
| Deploy db      | Supabase                                   |

---

## Funcionalidades

- **Chat com ARIA** — conversa em texto ou voz (Web Speech API) com contexto real (tarefas + eventos) via Gemini 1.5 Flash
- **Agenda** — visualização semanal, CRUD de eventos, sincronização com Google Calendar
- **Tarefas** — CRUD com prioridade, prazo e filtros
- **Notas** — editor livre com autosave e pin
- **Clima** — Open-Meteo (sem chave de API), geolocalização do browser
- **Pesquisa global** — `Ctrl+K` com busca simultânea em tarefas, eventos e notas
- **Notificações do browser** — alertas nativos do OS para eventos nos próximos 15 minutos
- **Overlay desktop** — janela flutuante sempre visível via `Ctrl+Shift+A`

---

## Pré-requisitos

- [Node.js](https://nodejs.org) >= 20
- [Docker](https://docs.docker.com/get-docker/) (para o banco local)
- Chave de API do [Google Gemini](https://aistudio.google.com/)

---

## Setup — Web App

### 1. Subir o banco de dados

```bash
docker compose up -d
```

### 2. Configurar variáveis de ambiente

```bash
cp app/.env.example app/.env.local
```

Preencha as variáveis em `app/.env.local`:

```env
# Banco
DATABASE_URL="postgresql://aria:aria_dev@localhost:5432/aria_db"

# IA
GEMINI_API_KEY=

# Google Calendar (OAuth 2.0)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Microsoft Teams (requer aprovação TI no Azure AD)
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

### 3. Instalar dependências e rodar as migrations

```bash
cd app
npm install
npx prisma migrate dev
```

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

---

## Setup — Overlay Desktop

```bash
cd desktop
npm install
npm run dev
```

O atalho `Ctrl+Shift+A` abre/fecha o overlay. A janela fica sempre visível no canto da tela.

---

## Deploy (Produção)

### Banco — Supabase

1. Crie um projeto no [Supabase](https://supabase.com) e copie as connection strings.
2. Atualize `DATABASE_URL` e `DIRECT_URL` no painel de variáveis do Vercel.
3. Rode `npx prisma migrate deploy` apontando para o Supabase.

### Web — Vercel

1. Conecte o repositório no [Vercel](https://vercel.com).
2. Configure todas as variáveis de ambiente no painel.
3. Os cron jobs estão definidos em `app/vercel.json`.

---

## Integrações

| Integração       | Status      | Observação                                        |
|------------------|-------------|---------------------------------------------------|
| Google Calendar  | Funcional   | OAuth 2.0, sync dos próximos 14 dias              |
| Microsoft Teams  | Pendente    | Requer aprovação do TI no Azure Active Directory  |
| Discord          | Pendente    | Polling via bot token                             |

---

## Licença

Projeto pessoal — uso privado.
