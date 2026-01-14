---
description: Tiered Hybrid Architecture for Snowflake Native App (SPCS)
alwaysApply: true
---

# Tiered Hybrid Architecture Context

This project follows a **T-Shape Tiered Architecture** for a Snowflake Native App running in Snowpark Container Services (SPCS).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SPCS Compute Pool                                 │
│  ┌─────────────────────┐      ┌─────────────────────────────────────────┐  │
│  │   NGINX Router      │      │           FastAPI Backend               │  │
│  │   (Static Files)    │─────▶│           (All Business Logic)          │  │
│  │   Next.js Export    │      │                                         │  │
│  └─────────────────────┘      └──────────────┬──────────────┬───────────┘  │
└──────────────────────────────────────────────┼──────────────┼───────────────┘
                                               │              │
                         ┌─────────────────────┘              └─────────────────────┐
                         ▼                                                          ▼
          ┌──────────────────────────────┐                   ┌──────────────────────────────┐
          │   Zone A: Transactional      │                   │   Zone B: Analytical         │
          │   (Snowflake Postgres)       │                   │   (Cortex AI + OLAP)         │
          │   - App State                │                   │   - RAG Retrieval            │
          │   - User Sessions            │                   │   - Embeddings Search        │
          │   - CRUD Operations          │                   │   - LLM Generation           │
          └──────────────────────────────┘                   └──────────────────────────────┘
```

## Core Architectural Constraints

### 1. Frontend is a STRICT View Layer

The Next.js frontend is a **static export** served by NGINX. It has NO server-side capabilities.

**ALLOWED in Frontend:**
- React components for UI rendering
- Client-side state management (React Query, Zustand, etc.)
- Client-side form validation (display only)
- API calls to FastAPI backend via relative paths (`/api/...`)

**FORBIDDEN in Frontend:**
- Business logic
- Data validation (authoritative)
- Direct database connections
- Server-side rendering (SSR)
- API Routes (`/app/api/`)
- Server Actions

### 2. FastAPI Backend Owns ALL Logic

Every operation that involves:
- Data validation (authoritative)
- Business rules
- Database queries (Postgres or Snowflake)
- AI/ML operations (Cortex)
- Authentication/Authorization

**MUST** be implemented in the FastAPI backend.

### 3. Dual Database Architecture

| Zone | Database | Use Case | Connection Type |
|------|----------|----------|-----------------|
| Zone A | Snowflake Postgres | App state, sessions, CRUD | Async (asyncpg) |
| Zone B | Snowflake OLAP | Analytics, Cortex AI, RAG | Sync (Snowpark) |

### 4. Request Flow

```
Browser → NGINX → /api/* → FastAPI → Zone A (Postgres) OR Zone B (OLAP/Cortex)
         └─────→ /* (static) → Next.js Static Files
```

## File Organization

```
/
├── frontend/                 # Next.js Static Export
│   ├── app/                  # App Router (NO /api/ routes!)
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks (data fetching)
│   └── next.config.js        # MUST have output: 'export'
│
├── backend/                  # FastAPI Application
│   ├── api/                  # API route handlers
│   ├── core/                 # Config, dependencies
│   ├── db/                   # Database connections (Postgres + Snowpark)
│   ├── models/               # Pydantic models
│   ├── services/             # Business logic
│   └── ai_*.py               # Cortex AI integrations
│
├── nginx/                    # NGINX configuration
│   └── nginx.conf            # Routes /api/* to backend, /* to frontend
│
└── snowflake/                # Snowflake deployment
    ├── setup.sql             # Database/schema setup
    └── manifest.yml          # Native App manifest
```

## When Generating Code

1. **For UI components**: Generate in `frontend/` with client-side patterns only
2. **For data operations**: Generate in `backend/` with proper zone routing
3. **For API endpoints**: Always in `backend/api/`, never in `frontend/app/api/`
4. **For AI features**: Use `backend/ai_*.py` with RAG pattern via Zone B
