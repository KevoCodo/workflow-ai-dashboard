# Portfolio Talking Points

Use these points for interview walkthroughs, GitHub/LinkedIn copy, or a short demo video. Everything is intentionally generic and public-safe.

## What this project is
- A public portfolio MVP that demonstrates a workflow automation dashboard with simulated “AI-style” execution.
- Clear boundaries between UI (Next.js), API (NestJS), and persistence (Postgres + TypeORM).

## What this project is not
- Not a production SaaS.
- No authentication, billing, or multi-tenant admin complexity.
- No n8n integration; the optional OpenAI backend adapter is disabled by default.

## Architectural decisions (why)
- Simulation-first execution: keeps the demo deterministic, repeatable, and safe for public GitHub use.
- Logs as a first-class model: every run emits step logs for execution traceability and debuggability.
- Schema-driven inputs: workflows define input fields; the UI renders forms from `inputSchema`.
- Thin controllers / readable services: orchestration logic lives in services; controllers stay minimal.
- Pragmatic persistence: Postgres + TypeORM is familiar, realistic, and easy to reason about.

## Demo flow (30–60 seconds)
1. Open the dashboard to show seeded workflows and sample runs.
2. Open a seeded demo workflow such as Content Summary or Customer Support Response and show its provider explanation and input form.
3. Open the run detail page to show:
   - run status + timestamps
   - provider lifecycle logs
   - safe provider metadata and input/output payloads
4. Return to the dashboard to show updated stats and provider distribution.

## Key engineering concepts demonstrated
- Domain modeling: `Workflow`, `WorkflowRun`, `WorkflowLog`
- State transitions: `queued` → `running` → `completed` / `failed`
- Validation boundaries (DTO validation + workflow schema checks)
- Observable execution: ordered logs + structured outputs
- Public-safe demo data: seeded workflows + seeded sample runs (only when DB is empty)

## How to talk about “AI” without overselling
- This MVP demonstrates AI workflow orchestration UX and architecture patterns.
- Execution is simulated by default so reviewers can focus on:
  - lifecycle management
  - validation and safe defaults
  - logs and output handling
  - clear interfaces for future integrations

## Future enhancement ideas (optional discussion)
- Real provider connectors behind feature flags
- Streaming run updates (SSE/WebSockets)
- Job queue + worker for async execution
- Auth only if a demo scenario needs it
- Workflow builder UI for authoring templates
