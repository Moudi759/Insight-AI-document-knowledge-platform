<div align="center">

# ✦ Insight

**Turn your documents into knowledge.**

An AI-powered document and knowledge platform. Upload PDFs, notes and research;
Insight extracts, chunks and indexes them so you can ask questions and get
answers grounded in your own library — with cited sources.

[Features](#-features) · [Tech stack](#-tech-stack) · [Architecture](#-architecture-overview) · [Getting started](#-getting-started) · [Deployment](#-deployment)

</div>

---

## About

Insight is a full-stack SaaS-style application: a personal workspace where every
document you upload becomes searchable, retrievable knowledge. Ask
*"What are the main findings?"* and the retrieval pipeline finds the relevant
passages, streams a grounded answer, and cites exactly where each claim came
from.

It ships as a complete product experience — marketing landing page,
authentication, dashboard with analytics, document library with processing
pipeline, three-pane document viewer with side-by-side AI chat, conversation
history, collections, global search, and settings — all responsive from 390px
phones to 1440px desktops, dark-first with an optional light theme.

## ✨ Features

| Area | Highlights |
| --- | --- |
| **AI chat** | Streaming responses (NDJSON over fetch), markdown + code blocks, copy & regenerate, suggested questions, stop generation |
| **RAG pipeline** | Upload → text extraction → semantic chunking → embeddings → cosine-similarity retrieval → grounded answer with source chips |
| **Documents** | Drag-and-drop upload with progress, live processing status polling, grid/list library, search/sort/filter, rename, delete, download |
| **Document viewer** | Native PDF viewing via authenticated file streaming; extracted-text reader for TXT/MD/DOCX; info sidebar; docked AI assistant panel |
| **Search** | Global search across titles, conversations and extracted text with highlighted snippets, debouncing, plus a ⌘K command palette |
| **Collections** | Group documents into colored collections with manage/rename/delete flows |
| **Conversations** | Auto-titled history page, resume any thread, per-document context switching |
| **Analytics** | Recharts dashboards: uploads & questions over time, storage usage, most-used document, activity timeline |
| **Settings** | Profile, appearance (dark/light/system), password change, notifications, AI temperature & citation preferences |

## 📸 Screenshots

> Add screenshots here after running the app locally:
>
> ```
> docs/screenshots/landing.png      — Landing hero
> docs/screenshots/dashboard.png    — Dashboard overview
> docs/screenshots/viewer.png       — Document viewer + AI panel
> docs/screenshots/chat.png         — Streaming AI chat
> ```

## 🛠 Tech stack

- **Framework** — Next.js 15 (App Router), React 19, TypeScript (strict)
- **UI** — Tailwind CSS, shadcn/ui-style component system (Radix primitives),
  Lucide icons, Sonner toasts, next-themes
- **Data** — PostgreSQL, Prisma ORM
- **Auth** — Auth.js / NextAuth v5 (credentials provider, JWT sessions, bcrypt)
- **AI** — Any OpenAI-compatible API (streaming chat + embeddings)
- **Parsing** — pdf-parse (PDF), mammoth (DOCX), native (TXT/MD)
- **Validation** — Zod + React Hook Form
- **Charts** — Recharts

## 🧠 Architecture overview

```
src/
├── app/
│   ├── (marketing)/          # Terms & privacy
│   ├── (auth)/               # Login / register (split-screen layout)
│   ├── (dashboard)/          # Protected app shell
│   │   ├── dashboard/        # Overview stats, recents, activity
│   │   ├── documents/[id]/   # Library + 3-pane viewer
│   │   ├── chat/[id]/        # AI chat + conversation rail
│   │   ├── collections/  search/  analytics/  settings/  conversations/
│   └── api/                  # REST endpoints (documents, chat, search, …)
├── components/
│   ├── ui/                   # Design-system primitives (button, dialog, …)
│   ├── layout/ documents/ chat/ collections/ search/ analytics/ settings/
│   └── landing/              # Marketing sections
├── lib/
│   ├── server/
│   │   ├── ai/               # Provider abstraction: chat.ts, embeddings.ts, rag.ts
│   │   ├── documents/        # extraction.ts, chunking.ts, service.ts, processing.ts
│   │   ├── auth.ts           # NextAuth config
│   │   ├── storage.ts        # Swappable local object storage
│   │   └── api-helpers.ts    # requireUserId, unified error mapping
│   ├── validations/          # Zod schemas
│   └── db.ts                 # Prisma singleton
├── hooks/use-chat-stream.ts  # Shared NDJSON streaming client
└── types/                    # Shared DTOs
```

**Design decisions worth knowing**

- **Provider-agnostic AI.** `lib/server/ai` is the seam. With `AI_API_KEY`
  set, requests stream from any OpenAI-compatible endpoint. Without a key,
  Insight runs a **local demo engine**: deterministic hashing embeddings plus
  an extractive answer composer — the entire RAG loop works offline.
- **Embeddings in Postgres.** Vectors are stored as JSON arrays and compared
  in the retrieval service. Swapping to pgvector or an external vector DB only
  touches `rag.ts`.
- **Ownership everywhere.** Every document/conversation query is scoped by
  `userId`; files stream through an authenticated API route, never as static
  assets. Client-supplied IDs are never trusted for identity.
- **Background processing.** Uploads respond immediately (`QUEUED`) while
  extraction/chunking/embedding runs server-side; clients poll until
  `READY`/`FAILED`.

## 🚀 Getting started

### Prerequisites

- Node.js 18.18+ (20+ recommended)
- A PostgreSQL database (local, Docker, Neon, Supabase…)

### 1. Install

```bash
npm install
cp .env.example .env.local   # then fill in the values below
```

### 2. Environment variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/insight
AUTH_SECRET=generate-with: openssl rand -base64 32

# Optional — leave empty to run in demo mode
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
```

### 3. Database setup

```bash
npx prisma migrate dev     # create schema
npm run db:seed            # populate demo data (recommended)
```

### 4. Run

```bash
npm run dev                # http://localhost:3000
```

Sign in with the seeded demo account:

```
Email:    demo@insight.app
Password: demo1234
```

### Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (+ prisma generate) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Strict TypeScript check |
| `npm run db:migrate` | Create/apply a migration |
| `npm run db:push` | Push schema without migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## ☁️ Deployment (Vercel)

1. Push the repo to GitHub and import it on [Vercel](https://vercel.com).
2. Add environment variables: `DATABASE_URL`, `AUTH_SECRET`,
   `NEXTAUTH_URL` (your production URL), and optionally `AI_API_KEY` /
   `AI_BASE_URL` / `AI_CHAT_MODEL` / `AI_EMBEDDING_MODEL`.
3. Provision Postgres (Vercel Postgres, Neon, Supabase…) and apply the schema:
   `npx prisma migrate deploy`.
4. Deploy. File uploads use the local driver by default — for multi-region or
   ephemeral filesystems, point `STORAGE_DRIVER=s3` and adapt
   `src/lib/server/storage.ts` to your bucket SDK.

## 🔐 Security notes

- Passwords hashed with bcrypt (12 rounds); sessions are signed JWTs.
- Zod validation on every mutating endpoint; strict file-type/size checks.
- **Rate limiting** on auth, registration, uploads and chat (fixed-window,
  per-instance — back with Redis for multi-instance deployments).
- **Plan enforcement**: document count and monthly question quotas are
  enforced server-side (`PLAN_DOCUMENT_LIMIT`, `PLAN_MONTHLY_QUESTIONS`).
- Per-user row scoping on all reads/writes; storage keys namespaced per user.
- Same-origin-only login redirects (open-redirect guard); sanitized
  user-facing processing errors.
- Secrets only via environment variables; nothing sensitive reaches the client.

## 🗺 Future improvements

- pgvector index + hybrid (vector + BM25) retrieval
- OCR fallback for scanned PDFs
- OAuth providers & team workspaces with roles
- S3/R2 storage driver out of the box
- Distributed rate limiting (Redis/Upstash) and durable job queue for processing
- Streaming tool-calls for multi-document comparison answers
- Email digest delivery for the weekly-summary preference
- E2E tests (Playwright) and CI workflow

---

Built with Next.js, Prisma and PostgreSQL.
