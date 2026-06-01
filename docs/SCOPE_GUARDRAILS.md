# Scope Guardrails

This project is a public portfolio showcase. It must remain generic, sanitized, and safe for public GitHub use.

## Strict MVP boundaries

- Demonstrate workflow templates, run orchestration, logs, and a clear operational dashboard UX.
- Keep deterministic, local simulation as the default execution path.
- Prefer clarity and interview-readability over scale, optimization, or production hardening.

## Features intentionally out of scope

- Authentication, authorization, SSO, or user management
- Billing, payments, subscriptions, invoices, or usage metering
- Multi-tenant organizations, teams, invites, or complex role/permission systems
- Executable external connectors and integrations beyond the explicitly opt-in OpenAI adapter (Anthropic, n8n, etc.)
- A visual workflow builder (drag-and-drop authoring, versioning, publishing pipelines)
- Background job infrastructure (queues/workers) beyond simple in-process simulation
- Scheduled retries, human review queues, evaluation scoring, or role-based access
- Production hardening claims (autoscaling, SOC2-style controls, etc.)

## Provider adapter scope (Phase 11+ / Phase 13A / Phase 14A)

- A provider adapter interface + registry exists to demonstrate architecture readiness.
- `simulated` execution is implemented, enabled by default, and remains the safest demo path.
- The optional `openai` adapter may execute only when explicitly selected and `OPENAI_PROVIDER_ENABLED=true`.
- Real provider execution is opt-in only and must use generic, sanitized demo payloads.
- Future provider types may be registered as non-executable placeholders for architecture demonstration only.
- Placeholder providers must remain disabled in the UI and fail cleanly if invoked through an API-created workflow.
- Retry execution must remain explicit and user-triggered; no automatic retries, scheduled retries, or background retry workers are introduced in the MVP.

## Template CRUD scope (Phase 9)

- Template management is admin-lite CRUD only (create/edit/deactivate workflow templates).
- This is not a production workflow automation platform and not a full authoring/builder system.

## Privacy and security rules (public GitHub safe)

- No secrets, API keys, tokens, or credentials in the repo.
- Never log or persist API keys, request headers, or sensitive environment values.
- No private business logic, internal prompts, or proprietary workflows.
- No private company/client names, datasets, or screenshots with real data.
- Keep sample inputs/outputs generic and sanitized.
- Validate inputs and keep logs safe-by-default (no sensitive payloads).
