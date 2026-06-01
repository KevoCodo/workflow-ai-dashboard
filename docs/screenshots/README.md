# Screenshot Guide

Use only generic, sanitized data. The API can seed sample runs to make the UI screenshot-ready when the database is empty.

## Required screenshots
- `dashboard-metrics.png`: dashboard metric cards showing total, successful, failed, retried, success rate, and average runtime.
- `workflow-catalog.png`: workflow catalog showing seeded public-safe templates, category, provider, and description.
- `workflow-execution-form.png`: seeded demo workflow detail with provider status and schema-driven input form.
- `execution-timeline.png`: run detail page showing normalized execution timeline events and ordered logs.
- `failed-run-retry.png`: failed retry-eligible run showing failure metadata and retry action.
- `provider-configuration.png`: provider architecture/status page or provider section showing simulated active and OpenAI optional/disabled state.
- `architecture-page.png`: architecture page showing the system/provider overview.

## Capture tips
- Prefer a consistent desktop viewport such as 1280px wide.
- Keep browser chrome minimal for portfolio images.
- Use only seeded or fake sample data.
- Keep OpenAI disabled unless you are intentionally capturing the optional configuration state.
- If you access the web UI by a non-localhost hostname/IP, set `NEXT_ALLOWED_DEV_ORIGINS` and restart the web dev server.
