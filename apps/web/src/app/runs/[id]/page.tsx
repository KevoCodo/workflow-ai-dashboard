import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { JsonBlock } from "../../../components/json-block";
import {
  getApiBaseUrl,
  getApiBaseUrlOrThrow,
  getRunExecutionProvider,
  getRunProviderMetadata,
  type ProviderStatus,
  type WorkflowEvent,
  type WorkflowLog,
  type WorkflowRun,
} from "../../../lib/api";
import { RunStatusBadge } from "../../../components/status-badges";
import { Badge } from "../../../components/ui/badge";
import { RetryRunPanel } from "../../../components/retry-run-panel";
import { formatDateTime, formatRelativeTime } from "../../../lib/time";

async function getRun(id: string): Promise<WorkflowRun> {
  const baseUrl = getApiBaseUrlOrThrow();
  const res = await fetch(
    `${baseUrl}/workflow-runs/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Run not found: ${id}`);
  }
  return (await res.json()) as WorkflowRun;
}

async function getRunLogs(id: string): Promise<WorkflowLog[]> {
  const baseUrl = getApiBaseUrlOrThrow();
  const res = await fetch(
    `${baseUrl}/workflow-runs/${encodeURIComponent(id)}/logs`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`Logs not found for run: ${id}`);
  }
  return (await res.json()) as WorkflowLog[];
}

async function getRunEvents(id: string): Promise<WorkflowEvent[]> {
  const baseUrl = getApiBaseUrlOrThrow();
  const res = await fetch(
    `${baseUrl}/workflow-runs/${encodeURIComponent(id)}/events`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`Events not found for run: ${id}`);
  }
  return (await res.json()) as WorkflowEvent[];
}

async function getProviders(): Promise<ProviderStatus[]> {
  const baseUrl = getApiBaseUrlOrThrow();
  const res = await fetch(`${baseUrl}/providers`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Providers not available");
  }
  return (await res.json()) as ProviderStatus[];
}

function displayRunError(run: WorkflowRun): string | null {
  if (!run.errorMessage) return null;
  const runProviderType = getRunExecutionProvider(run);
  if (
    runProviderType === "openai" &&
    (run.errorMessage.includes("OPENAI_API_KEY") ||
      run.errorMessage.includes("OpenAI provider is disabled") ||
      run.errorMessage.includes("not enabled for this local environment"))
  ) {
    return "OpenAI provider is not enabled for this local environment. Use simulated provider or configure the backend environment variables.";
  }
  return run.errorMessage;
}

function formatFailureCategory(value: string | null): string {
  if (!value) return "-";
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

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apiBaseUrl = getApiBaseUrl();
  let run: WorkflowRun | null = null;
  let logs: WorkflowLog[] = [];
  let events: WorkflowEvent[] = [];
  let providers: ProviderStatus[] = [];
  let errorMessage: string | null = null;

  try {
    [run, logs, events, providers] = await Promise.all([
      getRun(id),
      getRunLogs(id),
      getRunEvents(id),
      getProviders().catch(() => []),
    ]);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load run";
  }

  if (!run) {
    return (
      <div className="space-y-6">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Run details</h1>
          <p className="text-sm text-muted-foreground">
            Unable to load run details.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link className="underline" href="/runs">
              Back to runs
            </Link>
            <Link className="underline" href="/">
              Back to dashboard
            </Link>
          </div>
        </section>

        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30">
          <CardHeader>
            <CardTitle className="text-rose-800">API unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-rose-800">
            <div>
              Ensure the API is running and the web app is configured with{" "}
              <code>NEXT_PUBLIC_API_URL</code>.
            </div>
            <div className="text-xs text-rose-700">
              Current API base URL:{" "}
              <code>{apiBaseUrl ?? "not configured"}</code>
            </div>
            {errorMessage ? (
              <details className="pt-2 text-xs text-rose-700">
                <summary className="cursor-pointer select-none">
                  Details
                </summary>
                <div className="mt-2 whitespace-pre-wrap">{errorMessage}</div>
              </details>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  const orderedLogs = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const orderedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const providerMetadata = getRunProviderMetadata(run);
  const visibleError = displayRunError(run);
  const runProviderType = getRunExecutionProvider(run);
  const providerStatus =
    providers.find((provider) => provider.type === runProviderType) ?? null;
  const providerLifecycleSteps = new Set([
    "provider_resolved",
    "provider_execution_started",
    "provider_execution_completed",
    "provider_execution_failed",
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {run.workflow?.name ?? "Run details"}
            </h1>
            <div className="mt-1 text-xs text-muted-foreground">
              Run ID: <code>{id}</code>
            </div>
          </div>
          <RunStatusBadge status={run.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link className="underline" href="/runs">
            Back to runs
          </Link>
          <Link className="underline" href="/workflows">
            Back to workflows
          </Link>
          {run.workflow?.slug ? (
            <Link
              className="underline"
              href={`/workflows/${run.workflow.slug}`}
            >
              View workflow
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Run summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Workflow</div>
                <div className="font-medium text-foreground/90">
                  {run.workflow?.name ?? run.workflowId}
                </div>
                <div className="text-xs text-muted-foreground">
                  <code>{run.workflow?.slug ?? run.workflowId}</code>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div>
                  <RunStatusBadge status={run.status} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Provider</div>
                <div className="font-medium text-foreground/90">
                  {runProviderType}
                </div>
                {run.workflow?.providerType &&
                run.workflow.providerType !== runProviderType ? (
                  <div className="text-xs text-muted-foreground">
                    Current workflow provider:{" "}
                    <code>{run.workflow.providerType}</code>
                  </div>
                ) : null}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Started</div>
                <div>
                  {formatDateTime(run.startedAt)}{" "}
                  <span className="text-muted-foreground/70">
                    ({formatRelativeTime(run.startedAt)})
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Completed</div>
                <div>
                  {formatDateTime(run.completedAt)}{" "}
                  <span className="text-muted-foreground/70">
                    ({formatRelativeTime(run.completedAt)})
                  </span>
                </div>
              </div>
            </div>

            {run.retriedFromRunId ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">
                    Retry attempt {run.retryCount ?? 0} of {run.maxRetries ?? 3}
                  </Badge>
                  <span className="text-xs font-medium">
                    This run was created from a failed retry-eligible run.
                  </span>
                </div>
                <div className="mt-2 text-xs">
                  Retried from: <code>{run.retriedFromRunId}</code>
                </div>
              </div>
            ) : null}

            {visibleError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30">
                <div className="text-xs font-medium">
                  Provider execution failed
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={failureCategoryVariant(run.failureCategory)}>
                    {formatFailureCategory(run.failureCategory)}
                  </Badge>
                  <Badge variant={run.retryEligible ? "warning" : "neutral"}>
                    Retry eligible: {run.retryEligible ? "yes" : "no"}
                  </Badge>
                </div>
                <dl className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                  <div>
                    <dt>Provider</dt>
                    <dd>
                      <code>{runProviderType}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Last error</dt>
                    <dd>{formatDateTime(run.lastErrorAt)}</dd>
                  </div>
                </dl>
                <div className="mt-2 text-sm">
                  {run.failureReason ?? visibleError}
                </div>
              </div>
            ) : null}

            <RetryRunPanel run={run} providerStatus={providerStatus} />

            {providerMetadata ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-xs font-medium text-foreground/80">
                  Provider metadata
                </div>
                <dl className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                  <div>
                    <dt>Provider</dt>
                    <dd className="font-medium text-foreground/90">
                      {providerMetadata.provider}
                    </dd>
                  </div>
                  {providerMetadata.model ? (
                    <div>
                      <dt>Model</dt>
                      <dd className="font-medium text-foreground/90">
                        {providerMetadata.model}
                      </dd>
                    </div>
                  ) : null}
                  {typeof providerMetadata.executionTimeMs === "number" ? (
                    <div>
                      <dt>Execution time</dt>
                      <dd className="font-medium text-foreground/90">
                        {providerMetadata.executionTimeMs}ms
                      </dd>
                    </div>
                  ) : null}
                  {providerMetadata.status ? (
                    <div>
                      <dt>Status</dt>
                      <dd className="font-medium text-foreground/90">
                        {providerMetadata.status}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Execution timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {orderedEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No events available.
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[9px] top-2 h-[calc(100%-16px)] w-px bg-border" />
                <ul className="space-y-4">
                  {orderedEvents.map((event) => (
                    <li key={event.id} className="relative pl-7">
                      <div className="absolute left-1 top-2 h-4 w-4 rounded-full border border-border bg-background shadow-sm" />
                      <div className="flex items-start justify-between gap-3">
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
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Execution logs</CardTitle>
          </CardHeader>
          <CardContent>
            {orderedLogs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No logs available.
              </div>
            ) : (
              <div className="grid gap-2">
                {orderedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border bg-background/40 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {providerLifecycleSteps.has(log.stepName) ? (
                        <Badge variant="neutral">{log.stepName}</Badge>
                      ) : (
                        <code className="text-xs text-muted-foreground">
                          {log.stepName}
                        </code>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {log.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Input payload</CardTitle>
          </CardHeader>
          <CardContent>
            <JsonBlock value={run.inputPayload} />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Output payload</CardTitle>
          </CardHeader>
          <CardContent>
            {run.outputPayload ? (
              <JsonBlock value={run.outputPayload} />
            ) : (
              <div className="text-sm text-muted-foreground">
                No output available (run not completed or failed early).
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
