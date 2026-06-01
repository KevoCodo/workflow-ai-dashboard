"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  api,
  getApiBaseUrl,
  getRunExecutionProvider,
  type AnalyticsOverview,
  type AnalyticsRecentActivityRow,
  type AnalyticsStatusBreakdown,
  type AnalyticsWorkflowUsageRow,
  type ProviderType,
  type WorkflowEvent,
  type WorkflowRun,
} from "../lib/api";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { RunStatusBadge } from "../components/status-badges";
import {
  formatDateTime,
  formatDurationMs,
  formatRelativeTime,
} from "../lib/time";

type DashboardState =
  | { kind: "loading" }
  | { kind: "error"; message: string; details?: string }
  | {
      kind: "ready";
      apiOk: boolean;
      overview: AnalyticsOverview;
      recent: AnalyticsRecentActivityRow[];
      usage: AnalyticsWorkflowUsageRow[];
      breakdown: AnalyticsStatusBreakdown;
      providerCounts: Record<ProviderType, number>;
      recentFailures: WorkflowRun[];
      recentEvents: WorkflowEvent[];
    };

function formatCount(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

function formatPercent(n: number) {
  if (!Number.isFinite(n)) return "-";
  return `${n.toFixed(1)}%`;
}

function countRunsByProvider(
  runs: WorkflowRun[],
): Record<ProviderType, number> {
  return runs.reduce(
    (counts, run) => {
      const provider = getRunExecutionProvider(run);
      counts[provider] += 1;
      return counts;
    },
    {
      simulated: 0,
      openai: 0,
      anthropic: 0,
      local: 0,
      "custom-webhook": 0,
    } as Record<ProviderType, number>,
  );
}

function formatFailureCategory(value: string | null) {
  if (!value) return "unclassified";
  return value.replace(/_/g, " ");
}

function failureCategoryVariant(
  value: string | null,
): "neutral" | "warning" | "danger" {
  if (
    value === "provider_error" ||
    value === "timeout" ||
    value === "network"
  ) {
    return "warning";
  }
  if (value === "system" || value === "unknown") return "danger";
  return "neutral";
}

function workflowEventVariant(
  type: string,
): "success" | "warning" | "danger" | "neutral" {
  if (type === "RUN_COMPLETED" || type === "PROVIDER_RESPONSE_RECEIVED") {
    return "success";
  }
  if (
    type === "RUN_FAILED" ||
    type === "VALIDATION_FAILED" ||
    type === "RETRY_REJECTED"
  ) {
    return "danger";
  }
  if (
    type === "PROVIDER_REQUEST_SENT" ||
    type === "RUN_STARTED" ||
    type === "RETRY_REQUESTED" ||
    type === "RETRY_APPROVED" ||
    type === "RETRY_RUN_CREATED" ||
    type === "RETRIED_FROM_RUN"
  ) {
    return "warning";
  }
  return "neutral";
}

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({ kind: "loading" });
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [health, overview, usage, recent, breakdown, runs, events] =
          await Promise.all([
            api.health().catch(() => null),
            api.analyticsOverview(),
            api.analyticsWorkflowUsage(),
            api.analyticsRecentActivity(),
            api.analyticsStatusBreakdown(),
            api.listRuns(),
            api.listRecentWorkflowEvents(12),
          ]);
        if (cancelled) return;
        setState({
          kind: "ready",
          apiOk: Boolean(health?.status === "ok"),
          overview,
          usage,
          recent,
          breakdown,
          providerCounts: countRunsByProvider(runs),
          recentFailures: runs
            .filter((run) => run.status === "failed")
            .slice(0, 5),
          recentEvents: events,
        });
      } catch (e) {
        if (cancelled) return;
        const details = e instanceof Error ? e.message : "Failed to load data";
        setState({
          kind: "error",
          message:
            "Unable to reach the API. Start the backend and confirm NEXT_PUBLIC_API_URL is set.",
          details,
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    if (state.kind !== "ready") return null;

    const maxUsage =
      state.usage.reduce((max, row) => Math.max(max, row.totalRuns), 0) || 0;
    const totalByStatus =
      state.breakdown.queued +
      state.breakdown.running +
      state.breakdown.completed +
      state.breakdown.failed;

    return { maxUsage, totalByStatus };
  }, [state]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="max-w-3xl text-base text-muted-foreground">
              Operational overview of workflow health, run lifecycle state, and
              observable execution logs. Simulated execution remains the
              default; optional OpenAI execution is explicitly configured.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">Public showcase</Badge>
              <Badge variant="neutral">Simulated execution</Badge>
              <Badge variant="neutral">Optional OpenAI adapter</Badge>
              <Badge variant="neutral">No auth in MVP</Badge>
              {state.kind === "ready" ? (
                <Badge variant={state.apiOk ? "success" : "neutral"}>
                  API: {state.apiOk ? "ok" : "unknown"}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/workflows"
              className="inline-flex items-center rounded-md border border-border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              Browse workflows
            </Link>
            <Link
              href="/runs"
              className="inline-flex items-center rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted/60"
            >
              View runs
            </Link>
          </div>
        </div>
      </section>

      {state.kind === "error" && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30">
          <CardHeader>
            <CardTitle className="text-rose-800">API unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-rose-800">
            <div>{state.message}</div>
            <div className="text-xs text-rose-700">
              Current API base URL:{" "}
              <code>{apiBaseUrl ?? "not configured"}</code>
            </div>
            {state.details ? (
              <details className="pt-2 text-xs text-rose-700">
                <summary className="cursor-pointer select-none">
                  Details
                </summary>
                <div className="mt-2 whitespace-pre-wrap">{state.details}</div>
              </details>
            ) : null}
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {state.kind === "ready"
                ? formatCount(state.overview.totalRuns)
                : "-"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {state.kind === "ready"
                ? state.overview.totalRuns > 0
                  ? "All recorded workflow runs"
                  : "No runs recorded yet"
                : "Loading run history..."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Successful Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {state.kind === "ready"
                ? formatCount(
                    state.overview.successfulRuns ??
                      state.overview.completedRuns,
                  )
                : "-"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {state.kind === "ready"
                ? "Runs completed successfully"
                : "Loading run history..."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {state.kind === "ready"
                ? formatCount(state.overview.failedRuns)
                : "-"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {state.kind === "ready"
                ? "Runs ending in failed status"
                : "Loading run history..."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retried Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {state.kind === "ready"
                ? formatCount(state.overview.retriedRuns ?? 0)
                : "-"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {state.kind === "ready"
                ? "Runs created from retry attempts"
                : "Loading retry metrics..."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {state.kind === "ready"
                ? formatPercent(state.overview.successRate)
                : "-"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {state.kind === "ready"
                ? state.overview.totalRuns > 0
                  ? "Successful runs / total runs"
                  : "No runs recorded yet"
                : "Loading metrics..."}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Runtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
              {state.kind === "ready"
                ? formatDurationMs(
                    state.overview.averageRuntimeMs ??
                      state.overview.averageExecutionTimeMs,
                  )
                : "-"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {state.kind === "ready"
                ? (state.overview.successfulRuns ??
                    state.overview.completedRuns) > 0
                  ? "Average for completed runs"
                  : "No completed runs yet"
                : "Loading metrics..."}
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {state.kind === "ready" && state.recent.length > 0 ? (
              <ul className="space-y-2">
                {state.recent.slice(0, 10).map((row) => (
                  <li
                    key={row.runId}
                    className="rounded-lg border border-border bg-background/40 transition-colors hover:bg-muted/40"
                  >
                    <Link
                      href={`/runs/${row.runId}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {row.workflowName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <code>{row.workflowSlug}</code> ·{" "}
                          {formatRelativeTime(row.createdAt)} ·{" "}
                          {formatDateTime(row.createdAt)}
                        </div>
                      </div>
                      <RunStatusBadge status={row.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">
                No recent runs yet. Create one from a workflow detail page.
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground">
              <Link className="underline" href="/runs">
                View all runs
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.kind === "ready" ? (
              (["queued", "running", "completed", "failed"] as const).map(
                (k) => {
                  const count = state.breakdown[k];
                  const pct =
                    summary!.totalByStatus > 0
                      ? Math.round((count / summary!.totalByStatus) * 100)
                      : 0;
                  return (
                    <div key={k} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{k}</span>
                        <span>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/60">
                        <div
                          className="h-2 rounded-full bg-primary/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              )
            ) : (
              <div className="text-sm text-muted-foreground">
                Loading breakdown...
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Execution Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Recent normalized workflow events, newest first. This timeline is
              designed for future retries, review steps, provider expansion, and
              audit history without adding those behaviors yet.
            </div>
            {state.kind === "ready" && state.recentEvents.length > 0 ? (
              <div className="relative">
                <div className="absolute left-[9px] top-2 h-[calc(100%-16px)] w-px bg-border" />
                <ul className="space-y-4">
                  {state.recentEvents.map((event) => (
                    <li key={event.id} className="relative pl-7">
                      <span
                        className="absolute left-1 top-2 h-4 w-4 rounded-full border border-border bg-background shadow-sm"
                        aria-hidden="true"
                      />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <Badge variant={workflowEventVariant(event.type)}>
                          {event.type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(event.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {event.message}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Run ID: <code>{event.runId}</code>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No workflow events recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Failure Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Recent failed runs grouped with structured failure metadata. Retry
              eligibility is informational only; retries are not implemented in
              this MVP.
            </div>
            {state.kind === "ready" && state.recentFailures.length > 0 ? (
              <div className="space-y-3">
                {state.recentFailures.map((run) => (
                  <Link
                    key={run.id}
                    href={`/runs/${run.id}`}
                    className="block rounded-lg border border-border bg-background/40 p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {run.workflow?.name ?? run.workflowId}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Last error: {formatDateTime(run.lastErrorAt)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={failureCategoryVariant(run.failureCategory)}
                        >
                          {formatFailureCategory(run.failureCategory)}
                        </Badge>
                        <Badge
                          variant={run.retryEligible ? "warning" : "neutral"}
                        >
                          Retry eligible: {run.retryEligible ? "yes" : "no"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {run.failureReason ??
                        run.errorMessage ??
                        "No reason recorded."}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No classified failures available.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Provider Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Runs grouped by their workflow&apos;s configured provider.
              Simulated remains the recommended public demo default.
            </div>
            {state.kind === "ready" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {(
                  [
                    "simulated",
                    "openai",
                    "anthropic",
                    "local",
                    "custom-webhook",
                  ] as const
                ).map((provider) => (
                  <div
                    key={provider}
                    className="rounded-lg border border-border bg-background/40 p-3"
                  >
                    <div className="text-xs text-muted-foreground">
                      {provider}
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">
                      {formatCount(state.providerCounts[provider])}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {provider === "simulated" || provider === "openai"
                        ? "configured run"
                        : "placeholder run"}
                      {state.providerCounts[provider] === 1 ? "" : "s"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Loading provider distribution...
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Workflow Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Usage and health summary by workflow template (runs, success rate,
              average runtime).
            </div>
            {state.kind === "ready" && state.usage.length > 0 ? (
              <div className="space-y-3">
                {state.usage.slice(0, 8).map((row) => {
                  const pct =
                    summary!.maxUsage > 0
                      ? Math.round((row.totalRuns / summary!.maxUsage) * 100)
                      : 0;
                  return (
                    <div key={row.workflowId} className="space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <Link
                            className="font-medium underline"
                            href={`/workflows/${row.workflowSlug}`}
                          >
                            {row.workflowName}
                          </Link>{" "}
                          <span className="text-xs text-muted-foreground">
                            (<code>{row.workflowSlug}</code>)
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Runs: {row.totalRuns} · Success:{" "}
                          {formatPercent(row.successRate)} · Avg:{" "}
                          {formatDurationMs(row.averageExecutionTimeMs)}
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/60">
                        <div
                          className="h-2 rounded-full bg-primary/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No workflow usage yet. Create a run to populate insights.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
