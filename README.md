# Ollive AI — LLM Inference Logging & Chatbot Platform

A production-ready multi-provider LLM chatbot with a lightweight inference logging SDK, real-time ingestion pipeline, and analytics dashboard.

---

## Live Demo

- **Frontend:** [https://ollive-ai.netlify.app](https://ollive-ai.netlify.app) *(deploy link)*
- **Backend API:** [https://ollive-backend.railway.app](https://ollive-backend.railway.app) *(deploy link)*

---

## Features

### Core
- Multi-turn chatbot with persistent conversation history
- Multi-provider support via OpenRouter — GPT-4o, Claude 3.5 Sonnet, Gemini Pro, Llama 3.1, Mistral 7B
- Lightweight inference logging SDK that wraps every LLM call
- Real-time ingestion pipeline — logs sent fire-and-forget after each inference
- PostgreSQL database with sensible relational schema
- PII redaction — strips emails, phone numbers, credit cards from logs

### Frontend
- Clean light-mode UI with mint green theme
- Typewriter welcome screen with time-based greeting
- Conversation management — create, rename, delete
- Model selector pill with custom dropdown
- Markdown rendering for AI responses (code blocks, lists, bold, etc.)
- Shimmer loading states, toast notifications
- Analytics dashboard — latency, token usage, error rates, by provider/model

### Bonus
- Streaming responses (SSE) — backend fully implemented
- Docker Compose one-command setup
- Event-based log ingestion architecture

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  WelcomeScreen → ChatWindow → MessageInput → Dashboard       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / SSE
┌────────────────────────▼────────────────────────────────────┐
│                    Backend (Express + Node.js)               │
│                                                              │
│  Routes → Controllers → SDK Wrapper → OpenRouter API        │
│                │                                             │
│                └──→ Ingestion Client (fire & forget)         │
│                              │                               │
│                              ▼                               │
│                    POST /api/ingest                          │
│                    Ingestion Controller                      │
│                              │                               │
└──────────────────────────────┼──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   PostgreSQL (Neon)                          │
│   conversations │ messages │ inference_logs                  │
└─────────────────────────────────────────────────────────────┘
```

### Ingestion Flow

1. User sends a message from the frontend
2. Express route validates the request body
3. Chat controller saves the user message to the DB
4. **SDK wrapper** (`llmClient.ts`) calls OpenRouter API
5. SDK measures latency with `Date.now()` before/after the call
6. On completion (or error), SDK builds an `InferenceLogPayload`
7. `ingestionClient.ts` sends the payload to `POST /api/ingest` — **non-blocking, fire-and-forget**
8. Ingestion controller validates and saves the log to `inference_logs` table
9. AI response is saved to `messages` table and returned to frontend

### Logging Strategy

The SDK wraps every LLM call in a `try/catch/finally` block:
- `finally` always runs — logs are captured even on errors
- Logs are sent **asynchronously** — never blocks the user response
- Input/output previews are truncated to 200 chars
- PII is redacted before storing previews

---

## Schema Design

### `conversations`
```sql
id          UUID PRIMARY KEY
title       TEXT
status      ENUM(ACTIVE, CANCELLED, ARCHIVED)
createdAt   TIMESTAMP
updatedAt   TIMESTAMP
```

### `messages`
```sql
id              UUID PRIMARY KEY
conversationId  UUID → conversations.id (CASCADE DELETE)
role            ENUM(user, assistant, system)
content         TEXT
redactedContent TEXT (nullable)
createdAt       TIMESTAMP
```

### `inference_logs`
```sql
id               UUID PRIMARY KEY
conversationId   UUID → conversations.id (SET NULL on delete)
sessionId        UUID  -- groups logs within one request
provider         TEXT  -- openai, anthropic, gemini, etc.
model            TEXT  -- full model identifier
status           ENUM(SUCCESS, ERROR, CANCELLED)
latencyMs        INT
promptTokens     INT
completionTokens INT
totalTokens      INT
inputPreview     TEXT  -- first 200 chars, PII redacted
outputPreview    TEXT  -- first 200 chars, PII redacted
errorMessage     TEXT
metadata         JSONB -- temperature, maxTokens, streaming flag
createdAt        TIMESTAMP
```

### Schema Design Decisions

**Why relational (PostgreSQL) over NoSQL?**
Chat messages and inference logs have clear parent-child relationships. A conversation has many messages; a message belongs to one conversation. Relational integrity (CASCADE DELETE) ensures no orphaned messages when a conversation is deleted. This is a better fit than a document store.

**Why `conversationId` is nullable on `inference_logs`?**
Logs can be generated from the welcome screen before a conversation is formally created. Setting `conversationId` to nullable with `SET NULL` on delete means logs are preserved for analytics even if the conversation is deleted.

**Why `sessionId` on logs?**
A single user message can trigger multiple LLM calls (retries, streaming chunks). `sessionId` groups these together for accurate per-request analytics.

**Why JSONB for `metadata`?**
Model parameters (temperature, maxTokens, streaming) vary by provider and may evolve. JSONB avoids schema migrations for new parameters while keeping them queryable.

---

## Project Structure

```
ollive-ai/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   └── src/
│       ├── index.ts               # Server entry point
│       ├── app.ts                 # Express setup, middleware, routes
│       ├── sdk/
│       │   ├── llmClient.ts       # LLM wrapper — captures all metadata
│       │   └── types.ts           # Shared TypeScript types
│       ├── services/
│       │   ├── piiRedaction.ts    # Strips PII from log previews
│       │   └── ingestionClient.ts # Sends logs to ingestion endpoint
│       ├── controllers/
│       │   ├── chat.controller.ts
│       │   ├── conversation.controller.ts
│       │   ├── ingestion.controller.ts
│       │   └── dashboard.controller.ts
│       ├── routes/
│       │   ├── chat.routes.ts
│       │   ├── conversation.routes.ts
│       │   ├── ingestion.routes.ts
│       │   └── dashboard.routes.ts
│       ├── middleware/
│       │   ├── errorHandler.ts
│       │   └── validateRequest.ts
│       ├── db/
│       │   └── prisma.ts          # Singleton Prisma client
│       └── types/
│           ├── conversation.types.ts
│           ├── ingestion.types.ts
│           └── dashboard.types.ts
│
└── frontend/
    └── src/
        ├── api/
        │   └── api.ts             # Axios API client
        ├── components/
        │   ├── Sidebar.tsx        # Conversation list
        │   ├── Chatwindow.tsx     # Message display + markdown
        │   ├── MessageInput.tsx   # Input + model selector
        │   ├── Dashboard.tsx      # Analytics dashboard
        │   ├── WelcomeScreen.tsx  # Typewriter welcome
        │   └── Toast.tsx          # Custom toast notifications
        ├── App.tsx                # Main layout + state
        ├── main.tsx               # React entry point
        └── index.css              # All styles (CSS variables + components)
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free)
- An [OpenRouter](https://openrouter.ai) API key (free tier available)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ollive-ai.git
cd ollive-ai
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://..."   # Your Neon connection string
OPENROUTER_API_KEY="sk-or-v1-..." # Your OpenRouter key
PORT=8000
PII_REDACTION_ENABLED=true
```

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Backend runs at `http://localhost:8000`

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. One-command Docker setup (optional)
```bash
docker-compose up --build
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/conversation` | List all conversations |
| POST | `/api/conversation` | Create conversation |
| GET | `/api/conversation/:id/messages` | Get messages |
| PATCH | `/api/conversation/:id/title` | Update title |
| DELETE | `/api/conversation/:id` | Delete conversation |
| POST | `/api/chat` | Send message (supports streaming) |
| POST | `/api/ingest` | Ingest inference log |
| GET | `/api/dashboard` | Get analytics stats |

---

## Tradeoffs Made

| Decision | Tradeoff |
|---|---|
| OpenRouter instead of direct provider SDKs | Single API key for all providers — simpler setup, slight latency overhead vs direct calls |
| Fire-and-forget log ingestion | Logs never block user responses, but a server crash between inference and ingestion could lose a log |
| In-process ingestion (same server) | Simpler deployment vs a separate ingestion microservice — fine for this scale |
| Prisma ORM | No raw SQL needed, great DX, but adds ~50ms cold start on serverless |
| PostgreSQL over MongoDB | Better for relational chat data, but requires schema migrations for changes |
| No Redis/queue | Simpler architecture — Redis would add reliability for log delivery at scale |

---

## What I Would Improve With More Time

1. **Streaming on frontend** — SSE is implemented on the backend, wire it to the UI for token-by-token rendering
2. **Redis queue for ingestion** — decouple log ingestion from the main request path for reliability
3. **Rate limiting** — add per-IP rate limiting on the chat endpoint
4. **Auth** — add user authentication so conversations are per-user
5. **Search** — full-text search across conversation history
6. **Export** — download conversation as PDF or markdown
7. **Cost tracking** — calculate estimated cost per inference based on model pricing
8. **Retry logic** — automatic retry with exponential backoff on LLM failures

---

## Scaling Considerations

- **Ingestion pipeline** — at high volume, replace the in-process HTTP call with a Redis queue (Bull/BullMQ). A separate worker process consumes the queue and writes to the DB in batches
- **Database** — add indexes on `inference_logs.createdAt`, `inference_logs.provider`, and `messages.conversationId` for dashboard query performance
- **Horizontal scaling** — the backend is stateless, so multiple instances can run behind a load balancer. The Prisma connection pool handles concurrent DB connections
- **Read replicas** — dashboard queries (analytics) can be routed to a read replica to avoid impacting write performance

---

## Failure Handling Assumptions

- **LLM API down** — the SDK catches errors, logs them with `status: ERROR`, and the controller returns a user-friendly error message
- **DB write fails on ingestion** — logged to console, never crashes the main app (fire-and-forget)
- **Network timeout** — `ingestionClient` has a try/catch that silently fails — the user response is never affected
- **Invalid request body** — `validateRequest` middleware returns 400 before hitting the controller

---

*Built for the Ollive.ai engineering assignment — May 2025*
