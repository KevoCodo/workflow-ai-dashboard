# Development Phases

This roadmap keeps the project focused and portfolio-friendly. Each phase should produce a demoable slice with minimal complexity.

## Phase 0: Documentation and alignment

- Create planning docs (scope, architecture, models, phases)
- Define MVP boundaries and public GitHub guardrails

## Phase 1: Project setup and base app structure

- Initialize monorepo layout (frontend + backend workspaces)
- Add repeatable local database setup (Docker Compose)

## Phase 2: Backend models and API foundation

- Implement TypeORM entities: `Workflow`, `WorkflowRun`, `WorkflowLog`
- Add REST endpoints for workflows, runs, and logs
- Validate inputs and keep error responses readable

## Phase 3: Frontend dashboard and workflow catalog

- Workflow catalog UI (list/detail)
- Run list UI (status + timestamps)
- Clean base layout with Tailwind + minimal component primitives

## Phase 4: Schema-driven forms and simulated execution

- Render input forms driven by workflow `inputSchema`
- Implement a simulation runner that updates run status and emits ordered logs
- Run detail page with timeline logs and structured output payloads

## Phase 5: Demo readiness and polish

- Seed workflows on API startup (idempotent upsert)
- Optionally seed sample runs when the DB is empty (screenshot-ready UI)
- Improve UI states and copy for demo walkthroughs

## Phase 8: Portfolio polish and public identity upgrade (completed)

- Recruiter-friendly README and docs that match the implementation
- Launch checklist for GitHub/LinkedIn readiness (no secrets, clear setup)
- Screenshot and diagram guidance for consistent, public-safe visuals

## Phase 9: Workflow template management (completed)

- Add admin-lite workflow template CRUD (create/edit/deactivate)
- Keep workflows public-safe and MVP-scoped (no visual builder, no external calls)
- Preserve existing run creation and simulated lifecycle behavior

## Phase 10: Run insights and observability layer (completed)

- Add lightweight analytics endpoints (`/analytics/*`) for dashboard visibility
- Upgrade dashboard to display workflow health, status breakdown, and recent activity
- Keep observability generic (no prompt evaluation, no heavy tracing)

## Phase 11: Provider adapter layer and architecture readiness (completed)

- Add a minimal provider adapter interface and a provider registry
- Implement a `simulated` provider (deterministic, safe, no external calls)
- Persist `providerType` on workflow templates (default: `simulated`)
- Route workflow run execution through the provider registry
- Expose `GET /providers` for architecture readiness walkthroughs

## Phase 12: Final launch and public showcase prep (completed)

- Finalize README for public GitHub + interview walkthroughs
- Review and tighten docs for accuracy and public-safe framing
- Add portfolio copy and a case study doc for reuse (resume/LinkedIn/interviews)
- Verify demo flow, Docker setup, and screenshot readiness

## Phase 13A: OpenAI provider adapter foundation (completed)

- Add an optional OpenAI backend adapter using the existing provider contract and registry
- Keep `simulated` as the default execution path and disable OpenAI unless explicitly configured
- Emit provider lifecycle logs and persist only safe provider metadata with completed outputs
- Document opt-in real-provider guardrails and environment configuration

## Phase 13B: UI wiring, demo workflow, and logging polish (completed)

- Expose provider selection in workflow create/edit forms with `simulated` as the recommended default
- Surface backend provider availability, safe run metadata, and provider lifecycle log events in the UI
- Seed a sanitized provider-demo workflow for optional provider demonstrations
- Add lightweight dashboard provider distribution using existing run/workflow data

## Phase 14A: Provider registry expansion and failure readiness (completed)

- Register `anthropic`, `local`, and `custom-webhook` as non-executable provider placeholders
- Expand safe provider status reporting with implementation and enabled state
- Preserve lifecycle/log integrity for clean placeholder failure responses
- Display coming-soon provider options in the UI without enabling execution
- Defer retry state fields until a future phase defines retry behavior

## Phase 15A: Workflow failure classification foundation (completed)

- Add centralized failure categories for provider, timeout, network, validation, system, and unknown failures
- Persist failure reason, failure category, retry eligibility, and last error timestamp on failed runs
- Calculate retry eligibility without implementing retry execution
- Surface failure metadata in run detail and dashboard observability views

## Phase 15B: Workflow event logging and execution timeline (completed)

- Add a normalized `WorkflowEvent` model for run lifecycle milestones
- Record execution events across validation, provider selection, provider request/response, completion, and failure
- Expose workflow event APIs for run-specific and recent event timelines
- Surface execution timeline panels in the dashboard and run detail UI

## Phase 16A: Retry execution endpoint foundation (completed)

- Add retry relationship fields (`retriedFromRunId`, `retryCount`, `maxRetries`) to workflow runs
- Add `POST /workflow-runs/:id/retry` to create a new linked run from failed retry-eligible runs
- Preserve original failed runs while reusing the existing workflow execution pipeline for retry attempts
- Record retry-specific workflow events and logs for timeline visibility
- Surface retry availability and a run detail retry action in the UI

## Phase 17A: Metrics cards polish (completed)

- Focus the dashboard summary on six screenshot-ready metric cards
- Include total, successful, failed, and retried runs
- Show success rate and average runtime using the existing analytics endpoint
- Avoid adding charts, graphs, trends, or date filtering

## Phase 17B: Run list filters (completed)

- Add simple run history filters for all, completed, failed, running, and retried runs
- Add provider filtering for simulated and OpenAI runs
- Preserve the existing run list layout while showing provider and retry count
- Keep empty filter states clear without adding search, sorting, charts, or date ranges

## Phase 18A: Demo workflow templates (completed)

- Seed public-safe demo templates for Content Summary, Meeting Notes, Lead Qualification, Blog Outline, and Customer Support Response
- Keep seeded templates generic, screenshot-ready, and defaulted to the simulated provider
- Add deterministic simulated outputs for each demo template
- Preserve existing workflow CRUD and provider behavior without adding builders, new providers, or complex template logic

## Phase 18B: Final portfolio wrap-up (completed)

- Finalize README structure for public portfolio review and ContextFlow preparation
- Review core docs for alignment with the implemented provider layer, retry flow, metrics, filters, and demo templates
- Update screenshot guidance and architecture diagram docs
- Keep future roadmap documented only without adding new runtime scope

## Future phases (out of scope for MVP)

- Anthropic provider behind feature flags
- Local LLM provider behind feature flags
- Background workers
- Scheduled retries
- Human review queue
- Evaluation scoring
- Role-based access
