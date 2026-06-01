# Launch Checklist

Use this before sharing the repo publicly in GitHub, LinkedIn, recruiter screens, ContextFlow, or demo videos.

## Docs and copy
- README completed and accurate.
- Docs reviewed and matched to the implementation.
- Case study completed: `docs/CASE_STUDY.md`.
- Portfolio copy completed: `docs/PORTFOLIO_COPY.md`.
- Screenshot guidance present: `docs/screenshots/README.md`.
- Architecture diagram guidance present: `docs/diagrams/architecture.md`.

## Safety
- No secrets committed.
- `.env*` files remain ignored except safe examples.
- No private company, client, or customer data in seed content, screenshots, or docs.
- No proprietary business logic, internal prompts, or private system references.
- Optional OpenAI execution is disabled unless explicitly configured with sanitized demo data.

## Environment files
- `apps/api/.env.example` present and current.
- `apps/web/.env.example` present and current.
- Root `.env` is git-ignored.

## Local run verification
- Postgres starts locally with `docker compose up -d postgres`.
- Backend starts with `npm run dev:api`.
- `GET /health` returns ok.
- Frontend starts with `npm run dev:web`.
- Dashboard loads.
- Metrics populate.
- Workflow catalog loads.
- Seeded demo templates render schema-driven forms.
- Simulated provider runs complete successfully.
- Failed retry-eligible runs show retry actions.
- Retry flow creates linked retry runs.
- Run history filters work by status and provider.
- `GET /providers` shows safe provider configuration status.
- Architecture page loads.

## Docker verification
- `docker compose up` starts `postgres`, `api`, and `web`.
- Ports are documented: `POSTGRES_PORT`, `WEB_PORT`, `API_PORT`.

## Screenshot capture
- Dashboard metrics
- Workflow catalog
- Workflow execution form
- Execution timeline
- Failed run with retry option
- Provider configuration
- Architecture page

## GitHub metadata
Suggested repo description:
- Public fullstack AI workflow orchestration dashboard demonstrating schema-driven templates, provider-based execution, failure handling, retries, timeline logs, and operational metrics.

Suggested topics:
- nextjs
- nestjs
- postgresql
- typeorm
- workflow-automation
- ai-workflows
- provider-pattern
- operational-dashboard
- fullstack
- systems-engineering

## LinkedIn launch
- LinkedIn Featured description added.
- LinkedIn post drafted from `docs/PORTFOLIO_COPY.md`.
- Three to six screenshots or a short demo clip ready.
- MVP boundaries stated clearly: simulation-default, optional provider opt-in only, public-safe, no private data.

## Future roadmap documented only
- Anthropic provider
- Local LLM provider
- Background workers
- Scheduled retries
- Human review queue
- Evaluation scoring
- Role-based access
