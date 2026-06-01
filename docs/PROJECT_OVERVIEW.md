# AI Workflow Automation Dashboard - Project Overview

## Purpose
Build a public, sanitized portfolio project that demonstrates how an AI workflow orchestration dashboard can be structured: workflow templates, provider-based execution, run lifecycle tracking, failure handling, retries, execution timelines, and operational visibility.

The MVP uses simulated provider execution by default to keep the repo deterministic, credential-free, and safe for public GitHub. An optional OpenAI backend adapter is disabled by default and intended only for sanitized demo inputs.

## Target audience
- Recruiters and hiring teams evaluating fullstack engineering and system design
- Engineers interested in workflow orchestration and operational tooling patterns
- Anyone looking for a realistic-but-generic reference implementation of workflow UX + backend layering

## What this project demonstrates
- Fullstack TypeScript architecture (Next.js + NestJS)
- Workflow templates with schema-driven inputs (forms generated from `inputSchema`)
- Run lifecycle management (`queued` -> `running` -> `completed` / `failed`)
- Provider adapter layer (registry + `providerType`) to show future extensibility
- UI provider selection and safe provider availability reporting for demo walkthroughs
- Execution logs for traceability (ordered, UI-friendly steps)
- Failure classification and explicit retry execution for retry-eligible failed runs
- Run history filters by status and provider
- Persistence in PostgreSQL via TypeORM (workflows, runs, logs)
- Lightweight analytics for observability discussion (total/successful/failed/retried runs, success rate, average runtime, usage, recent activity)
- Public-safe demo templates: Content Summary, Meeting Notes, Lead Qualification, Blog Outline, and Customer Support Response

## What this project intentionally does not do
- Authentication/authorization, SSO, or user management
- Billing, payments, subscriptions, or usage metering
- Multi-tenant org/team management or complex roles/permissions
- Real provider execution by default; only the explicitly enabled OpenAI demo adapter is supported
- n8n execution or external workflow engine integrations
- Automatic retries, scheduled retries, human review queues, or evaluation scoring
- Private company/client data, proprietary workflows, or internal prompts
- Production-hardening claims (this is a portfolio MVP, not a SaaS)

## High-level MVP summary
The MVP lets a reviewer:
1. Browse workflow templates (catalog)
2. Create/edit/deactivate workflow templates (admin-lite CRUD)
3. Start a workflow run via schema-driven input forms
4. Observe lifecycle state transitions and ordered logs (timeline-style)
5. Inspect structured input/output payloads
6. Retry eligible failed runs while preserving the original failure record
7. Review lightweight analytics, provider distribution, filters, and provider architecture readiness

