# Architecture Diagram

Use this text diagram in README discussions, interviews, ContextFlow, or as the source for a rendered diagram.

```text
Next.js UI
  |-- Dashboard metrics
  |-- Workflow catalog + schema forms
  |-- Run history filters
  |-- Run detail timeline
  |-- Provider configuration view
  |
  | REST/JSON
  v
NestJS API
  |-- Workflow Service
  |     |-- template CRUD
  |     `-- input schema validation
  |
  |-- Workflow Run / Retry Service
  |     |-- create run
  |     |-- execute run
  |     `-- create linked retry run
  |
  |-- Failure Classifier
  |     |-- provider_error
  |     |-- timeout
  |     |-- network
  |     |-- validation
  |     |-- system
  |     `-- unknown
  |
  |-- Provider Registry
  |     |-- Simulated Provider (default, deterministic)
  |     |-- OpenAI Provider (optional, disabled by default)
  |     `-- Placeholder Providers (non-executable)
  |
  |-- Event Log
  |     |-- workflow_log
  |     `-- workflow_event
  |
  |-- Metrics Service
  |     |-- overview cards
  |     |-- status breakdown
  |     |-- workflow usage
  |     `-- recent activity
  |
  | TypeORM
  v
PostgreSQL
  |-- workflow
  |-- workflow_run
  |-- workflow_log
  `-- workflow_event
```

## Notes
- The simulated provider is the default execution path and does not call external services.
- The OpenAI provider is optional and only executes when explicitly enabled and configured.
- Retry execution is user-triggered and creates a linked run instead of mutating the original failed run.
- Future providers, workers, scheduled retries, review queues, and evaluation scoring are roadmap items only.
