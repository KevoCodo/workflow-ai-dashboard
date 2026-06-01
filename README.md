# AI Workflow Automation Dashboard

## Project Overview
AI Workflow Automation Dashboard is a public-safe fullstack portfolio project that demonstrates workflow orchestration patterns for AI-enabled operations: schema-driven workflow templates, provider-based execution, run lifecycle tracking, execution timelines, failure handling, retries, and lightweight metrics.

Many "AI automation" demos stop at prompts. Real operational value comes from repeatable workflows, structured inputs/outputs, execution visibility, and traceability. This project shows those patterns without requiring private data, external credentials, authentication, billing, or production SaaS scope.

## What This Project Demonstrates
- Fullstack engineering (Next.js UI + NestJS API + PostgreSQL persistence)
- Workflow orchestration (templates, routing, lifecycle states)
- Provider adapter architecture (execution abstraction + registry)
- Schema-driven UI forms (workflow-defined inputs)
- Simulated AI execution (deterministic, credential-free) with an optional OpenAI adapter
- Execution logging (timeline-style steps per run)
- Lightweight observability metrics (total, successful, failed, retried runs, success rate, average runtime)
- Operational dashboard design (status-driven UX, traceability)
- Public-safe AI systems thinking (opt-in real-provider execution with safe defaults)

## Tech Stack
- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: NestJS REST API, TypeScript, TypeORM
- Database: PostgreSQL
- Local infra: Docker Compose

## Core Features
- Workflow template catalog (seeded) and admin-lite template CRUD (create/edit/deactivate)
- Schema-driven workflow input forms generated from `inputSchema`
- Workflow runs with deterministic lifecycle: `queued` -> `running` -> `completed` / `failed`
- Run history filters by status and provider
- Run detail pages with ordered logs, normalized execution events, failure metadata, and structured output payloads
- Failed-run retry flow for retry-eligible failures; retries create a new linked run and preserve the original failed run
- Analytics endpoints + dashboard observability views with simple metric cards
- Provider adapter layer (`simulated` by default; optional feature-flagged `openai`; future placeholders visible but non-executable)
- Workflow create/edit provider selector with backend-reported availability status
- Seeded public-safe demo templates: Content Summary, Meeting Notes, Lead Qualification, Blog Outline, and Customer Support Response

## Architecture Overview
```
Browser (Next.js UI)
  |
  | REST/JSON
  v
NestJS API
  |-- Workflow Service
  |-- Workflow Run / Retry Service
  |-- Failure Classifier
  |-- Event + Log Services
  |-- Metrics / Analytics Service
  |
  | resolve provider
  v
Provider Registry
  |-- Simulated Provider (default, deterministic, no external calls)
  |-- OpenAI Provider (optional, disabled by default)
  `-- Provider Placeholders (anthropic, local, custom-webhook; non-executable)
  |
  | TypeORM
  v
PostgreSQL (workflow, workflow_run, workflow_log, workflow_event)
```

## Provider Architecture
Workflows include `providerType` (default: `simulated`). The API resolves a provider through a small registry and executes via an interface so future providers can be added behind feature flags without changing the workflow/run API contract.

Executable providers:
- `simulated` (default; deterministic, public-safe, credential-free)
- `openai` (optional backend adapter; only executes when `OPENAI_PROVIDER_ENABLED=true` and an API key is configured)

Registered placeholders:
- `anthropic`, `local`, and `custom-webhook` are intentionally non-executable catalog entries that demonstrate registry growth and return a clean failed result if invoked through the API.

OpenAI execution is opt-in and intended only for sanitized demo inputs. Do not submit private, client, proprietary, or credential-bearing data to real providers.

The workflow template editor exposes executable provider choices and displays future providers as disabled `coming soon` options. `simulated` remains the recommended default for public walkthroughs; selecting `openai` does not execute anything until a run is created and the API environment explicitly enables/configures the adapter.

`GET /providers` reports UI-safe provider readiness:

```json
[
  { "type": "simulated", "status": "active", "implemented": true, "enabled": true, "requiresApiKey": false, "default": true },
  { "type": "openai", "status": "disabled", "implemented": true, "enabled": false, "requiresApiKey": true, "default": false },
  { "type": "anthropic", "status": "coming_soon", "implemented": false, "enabled": false, "requiresApiKey": true, "default": false }
]
```

For `openai`, status becomes `enabled` only when the feature flag and API key are configured, or `missing_api_key` when enabled without a key.

Not implemented (intentionally out of scope):
- Anthropic, local model, and custom webhook provider execution
- n8n or other workflow engines

## Workflow Execution Lifecycle
- Statuses: `queued`, `running`, `completed`, `failed`
- Typical log steps:
  - `queued`
  - `validation`
  - `routing`
  - `provider_resolved`
  - `provider_execution_started`
  - `simulated_processing`
  - `formatting`
  - `provider_execution_completed` (or `provider_execution_failed`)
  - `completed` (or `failed`)

## Failure Handling & Retries
Failed runs store a public-safe failure reason, failure category, retry eligibility flag, and last error timestamp. Failure categories are `provider_error`, `timeout`, `network`, `validation`, `system`, and `unknown`.

Retries are explicit user actions through `POST /workflow-runs/:id/retry`. The retry flow validates that the original run failed, is retry eligible, has retry attempts remaining, still has a workflow template, and uses an implemented/enabled provider. A retry creates a linked run with `retriedFromRunId` and an incremented `retryCount`; the original failed run stays unchanged for traceability.

## Metrics & Observability
The dashboard focuses on screenshot-ready operational metrics:
- Total runs
- Successful runs
- Failed runs
- Retried runs
- Success rate
- Average runtime

Additional observability views include recent activity, provider distribution, workflow usage, status breakdowns, and normalized execution timelines.

## Demo Workflows
The API seeds a small public-safe template set for screenshots, interviews, and local demos:
- `Content Summary` (`content-summary`) - content, audience, tone
- `Meeting Notes` (`meeting-notes`) - notes, follow-up style
- `Lead Qualification` (`lead-qualification`) - lead details, business type
- `Blog Outline` (`blog-outline`) - topic, audience, keyword
- `Customer Support Response` (`customer-support-response`) - customer message, tone

Each seeded template defaults to the `simulated` provider. OpenAI remains optional and only executes when explicitly selected and configured in the backend environment.

## Demo Flow
1. View workflow templates (catalog)
2. Open a seeded demo template such as `Content Summary`, `Meeting Notes`, or `Customer Support Response`
3. Keep `simulated` selected for the recommended demo path, or select `openai` to show opt-in provider architecture
4. Submit sanitized schema-driven workflow input
5. Run provider execution
6. Review execution status transitions and provider lifecycle logs
7. Inspect structured output and safe provider metadata
8. For retry-eligible failures, create a linked retry run from the run detail page
9. Review dashboard analytics and provider distribution
10. Review provider architecture (`GET /providers` + Architecture page)

## Local Setup
### Prerequisites
- Node.js 20+
- Docker Desktop (for Postgres)

### Install & Run (web + api locally, Postgres in Docker)
1. Install dependencies: `npm install`
2. Start Postgres: `docker compose up -d postgres`
3. Create local env files:
   - Web: copy `apps/web/.env.example` to `apps/web/.env.local`
   - API: copy `apps/api/.env.example` to `apps/api/.env.local`
4. Start web + api together: `npm run dev`

Run separately:
- Web: `npm run dev:web`
- API: `npm run dev:api`

Services:
- Web: http://localhost:3000
- API: http://localhost:3001 (`GET /health`)
- Postgres: localhost:5432

## Environment Variables
### Web (`apps/web/.env.local`)
- `NEXT_PUBLIC_API_URL` (example: `http://localhost:3001`)
- `NEXT_ALLOWED_DEV_ORIGINS` (only needed when accessing the dev server by non-localhost hostname/IP)

### API (`apps/api/.env.local`)
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `PORT` (default `3001`)
- `TYPEORM_SYNCHRONIZE` (default `true` for local dev)
- `SEED_SAMPLE_RUNS` (seeds demo runs when DB has zero runs; disabled in production)
- `SIMULATION_STEP_DELAY_MS` (optional; default `120`)
- `OPENAI_PROVIDER_ENABLED` (optional; defaults to `false`; must be `true` before the OpenAI adapter can execute)
- `OPENAI_API_KEY` (optional; required only when the OpenAI adapter is enabled)
- `OPENAI_MODEL` (optional OpenAI model configuration; example default `gpt-4o-mini`)
- `ANTHROPIC_API_KEY`, `LOCAL_LLM_BASE_URL`, `CUSTOM_WEBHOOK_URL` (documented empty placeholders only; no execution wiring in the MVP)

## Docker
### Postgres only
- `docker compose up -d postgres`

### Full stack (optional)
- `docker compose up`

Optional overrides (useful if ports are already taken):
- `POSTGRES_PORT` (host port -> container 5432)
- `WEB_PORT` (host port -> container 3000)
- `API_PORT` (host port -> container 3001)

If you open the web UI via a non-localhost address (for example, a WSL/Docker/VM IP like `http://172.31.x.x:3000`), set:
- `NEXT_PUBLIC_API_URL=http://172.31.x.x:3001`

## API Endpoint Summary
- Health: `GET /health`
- Workflows:
  - `GET /workflows`
  - `GET /workflows/:slug`
  - `POST /workflows`
  - `PATCH /workflows/:id`
  - `DELETE /workflows/:id` (deactivates; keeps runs valid)
- Workflow runs:
  - `GET /workflow-runs`
  - `GET /workflow-runs/:id`
  - `POST /workflow-runs`
  - `POST /workflow-runs/:id/retry`
    - Creates a new run from a failed retry-eligible run; the original failed run is preserved
  - `GET /workflow-runs/:id/logs`
- Analytics:
  - `GET /analytics/overview`
  - `GET /analytics/workflow-usage`
  - `GET /analytics/recent-activity`
  - `GET /analytics/status-breakdown`
- Providers:
  - `GET /providers`
    - Reports provider implementation, enabled state, API-key requirement, default provider, and safe availability status

## Screenshots
See `docs/screenshots/README.md` for a suggested screenshot list. Recommended set:
- Dashboard metrics
- Workflow catalog
- Workflow execution form
- Execution timeline
- Failed run with retry option
- Provider configuration
- Architecture page

## Project Status
- Status: MVP complete and ready for public showcase
- Execution: simulated provider by default; optional OpenAI adapter disabled by default

## MVP Boundaries
- No authentication
- No billing
- No real provider execution unless explicitly enabled with sanitized demo data
- No real n8n execution
- No private business/client data
- Simulated provider remains the default and credential-free demo path
- Anthropic, local, and custom webhook integrations are registry placeholders only
- Public portfolio showcase only (not production-hardened)

## Future Roadmap
Documented future work only, not implemented in this MVP:
- Anthropic provider
- Local LLM provider
- Background workers
- Scheduled retries
- Human review queue
- Evaluation scoring
- Role-based access

## Public-safe disclaimer
- No secrets committed
- No private company/client data
- No proprietary business logic

## Docs
- `docs/PROJECT_OVERVIEW.md`
- `docs/TECH_STACK.md`
- `docs/SCOPE_GUARDRAILS.md`
- `docs/ARCHITECTURE.md`
- `docs/WORKFLOW_MODEL.md`
- `docs/DEVELOPMENT_PHASES.md`
- `docs/CASE_STUDY.md`
- `docs/PORTFOLIO_COPY.md`
- `docs/LAUNCH_CHECKLIST.md`
