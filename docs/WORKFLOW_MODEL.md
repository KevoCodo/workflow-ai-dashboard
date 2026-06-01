# Workflow Model

This document defines the core concepts used throughout the dashboard. The MVP intentionally uses a small, generic model that is easy to understand and extend.

## Core concepts

### Workflow (template)

A workflow is a predefined template that describes:

- A category and description (for catalog UX)
- The expected input fields (`inputSchema`) used to render forms
- The execution provider type (`providerType`) used by the backend to route runs

**Key fields (implemented)**

- `id`, `name`, `slug`, `description`, `category`, `status`
- `providerType` (`simulated` | `openai` | `anthropic` | `local` | `custom-webhook`; defaults to `simulated`)
- `inputSchema` (a small JSON shape for UI rendering; not full JSON Schema)
- `createdAt`, `updatedAt`

### ProviderType (architecture readiness)

The provider adapter layer is an architecture readiness feature: it allows the execution backend to be swapped without changing the workflow/run API contract.

- Executable providers: `simulated` and optional `openai`
- Placeholder-only provider values: `anthropic`, `local`, and `custom-webhook`
- `simulated` remains the default for new or legacy workflows without `providerType`
- `openai` executes only when explicitly selected and enabled through environment configuration
- Placeholder providers return `Provider not yet implemented.` and preserve the normal failed-run lifecycle and logs without making an external call
- Unknown provider values fail cleanly instead of silently selecting a real provider

### Provider selection behavior (Phase 13B)

- Workflow create/edit forms expose implemented providers and display placeholder providers as disabled `coming soon` options.
- New workflows and seeded demo workflows default to `simulated`.
- The UI may show availability from `GET /providers`, but selecting `openai` never bypasses backend configuration checks.
- When OpenAI is disabled or missing configuration, the run fails with a public-safe message and remains traceable through provider lifecycle logs.

### WorkflowRun

A workflow run is a single execution instance of a workflow. It stores:

- Which workflow was executed
- The user-provided input payload
- Execution status and timestamps
- A final output payload (if completed)
- Failure details (if failed)

**Key fields (implemented)**

- `id`, `workflowId`
- `status` (`queued` | `running` | `completed` | `failed`)
- `inputPayload` (JSON), `outputPayload` (JSON or null)
- `errorMessage` (string or null)
- `failureReason`, `failureCategory`, `retryEligible`, `lastErrorAt` for structured failure observability
- `retriedFromRunId`, `retryCount`, and `maxRetries` for explicit retry history
- `startedAt`, `completedAt`
- `createdAt`, `updatedAt`

### Failure classification

Failed workflow runs are classified into predictable categories:

- `provider_error`
- `timeout`
- `network`
- `validation`
- `system`
- `unknown`

`timeout`, `network`, and `provider_error` failures are marked retry eligible because they are usually transient enough to retry. `validation`, `system`, and `unknown` failures are not retry eligible by default.

Retry eligibility is metadata; retry execution is a separate explicit action. A failed run can be retried only when:

- The original run exists and has status `failed`
- `retryEligible` is `true`
- `retryCount` is lower than `maxRetries`
- The workflow template still exists
- The selected provider is implemented and enabled

Retries never overwrite the failed run. The retry endpoint creates a new workflow run with the same input payload and workflow, sets `retriedFromRunId` to the original run id, increments `retryCount`, preserves `maxRetries`, and executes through the existing provider pipeline.

### WorkflowLog

A workflow log is an append-only record emitted during a run. In the MVP, logs are UI-friendly (step + message + timestamp).

**Key fields (implemented)**

- `id`, `workflowRunId`
- `stepName`
- `message`
- `metadata` (safe JSON metadata, used for retry run links when available)
- `createdAt`

### WorkflowEvent

A workflow event is a normalized lifecycle record used for execution timelines and future audit history.

**Key fields (implemented)**

- `id`
- `runId`
- `type`
- `message`
- `createdAt`

Supported event types:

- `RUN_CREATED`
- `RUN_STARTED`
- `PROVIDER_SELECTED`
- `PROVIDER_REQUEST_SENT`
- `PROVIDER_RESPONSE_RECEIVED`
- `VALIDATION_STARTED`
- `VALIDATION_FAILED`
- `RUN_COMPLETED`
- `RUN_FAILED`
- `RETRY_REQUESTED`
- `RETRY_APPROVED`
- `RETRY_REJECTED`
- `RETRY_RUN_CREATED`
- `RETRIED_FROM_RUN`

## Execution statuses

- `queued`: accepted and waiting to start
- `running`: actively executing steps
- `completed`: finished successfully with an output
- `failed`: finished with an error

## Provider execution lifecycle (MVP)

Execution is synchronous inside the API service:

- A run is created as `queued` with an initial log entry.
- The service logs a predictable sequence of steps:
  - `queued`
  - `validation`
  - `routing`
  - `provider_resolved`
  - `provider_execution_started`
  - provider-specific safe log entries (for simulation, `simulated_processing` and `formatting`)
  - `provider_execution_completed` (or `provider_execution_failed`)
  - `completed` (or `failed`)
- The run is updated to `running`, then `completed` with an output payload (or `failed` with an error message).
- The service also records normalized workflow events for dashboard and run-detail timelines. Events are read-only observability records; they do not trigger automatic retries or review workflows.

The optional OpenAI adapter may call the OpenAI API only for explicitly configured, sanitized demo workflows. No external workflow tools are called.

`POST /workflow-runs/:id/retry` is the explicit retry action. It creates a new run instead of mutating the original failed run, so retry history remains visible and audit-friendly.

## Seed data (demo readiness)

- Workflows are seeded on API startup (idempotent insert by `slug`; existing templates are not duplicated).
- Seeded demo templates such as `content-summary`, `meeting-notes`, `lead-qualification`, `blog-outline`, and `customer-support-response` use `providerType: simulated` by default; they can be switched to `openai` explicitly for configured local demos.
- Sample runs can also be seeded for screenshot-ready UI (only when the database has zero runs).

## Workflow template management (admin-lite)

The MVP includes lightweight template CRUD so the catalog can be edited without turning this into a full workflow builder.

- Create templates: `POST /workflows`
- Update templates: `PATCH /workflows/:id` (slug is intentionally stable)
- Delete behavior: `DELETE /workflows/:id` deactivates the template (sets status to `inactive`) instead of hard deleting, so existing workflow runs remain valid.

### Active vs inactive templates

- `active`: shown normally in the catalog and intended to be run.
- `inactive`: still viewable (and keeps historical runs intact), but should be visually de-emphasized.

### Input schema shape

The `inputSchema` value is a small JSON structure used for form rendering (not full JSON Schema):

```ts
inputSchema: {
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "textarea" | "number" | "select" | "json";
    required?: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string }>; // select only
  }>;
}
```

## Run insights and observability (Phase 10)

To support operational dashboard discussion without overbuilding, the API exposes lightweight analytics endpoints that aggregate existing run/workflow data:

- Total workflows (active/inactive)
- Total runs + status breakdown (queued/running/completed/failed)
- Total, successful, failed, and retried runs
- Success rate for the dashboard overview (successful runs / total runs)
- Average runtime for completed runs with `startedAt` + `completedAt`
- Recent activity (latest runs)
- Workflow usage summary (runs and health per workflow)

These metrics are derived from Postgres data and are intentionally not a full tracing or prompt-evaluation system.
