export type ApiError = {
  message: string;
  status?: number;
};

export type WorkflowStatus = "active" | "inactive";
export type WorkflowRunStatus = "queued" | "running" | "completed" | "failed";
export type FailureCategory =
  | "provider_error"
  | "timeout"
  | "network"
  | "validation"
  | "system"
  | "unknown";
export type ProviderType =
  | "simulated"
  | "openai"
  | "anthropic"
  | "local"
  | "custom-webhook";
export type ProviderAvailabilityStatus =
  | "active"
  | "disabled"
  | "enabled"
  | "missing_api_key"
  | "coming_soon";

export type ProviderStatus = {
  type: ProviderType;
  status: ProviderAvailabilityStatus;
  implemented: boolean;
  enabled: boolean;
  requiresApiKey: boolean;
  default: boolean;
};

export type ProviderMetadata = {
  provider: ProviderType;
  model?: string;
  executionTimeMs?: number;
  status?: WorkflowRunStatus;
  timestamp?: string;
};

export type WorkflowFieldSchema = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "json";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

export type WorkflowInputSchema = {
  fields: WorkflowFieldSchema[];
};

export type Workflow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: WorkflowStatus;
  providerType: ProviderType;
  inputSchema: WorkflowInputSchema;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsOverview = {
  totalWorkflows: number;
  activeWorkflows: number;
  inactiveWorkflows: number;
  totalRuns: number;
  successfulRuns: number;
  completedRuns: number;
  failedRuns: number;
  queuedRuns: number;
  runningRuns: number;
  retriedRuns: number;
  successRate: number;
  averageRuntimeMs: number;
  averageExecutionTimeMs: number;
  mostUsedWorkflow: {
    workflowId: string;
    workflowName: string;
    workflowSlug: string;
    totalRuns: number;
  } | null;
};

export type AnalyticsWorkflowUsageRow = {
  workflowId: string;
  workflowName: string;
  workflowSlug: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  successRate: number;
  averageExecutionTimeMs: number;
};

export type AnalyticsRecentActivityRow = {
  runId: string;
  workflowName: string;
  workflowSlug: string;
  status: WorkflowRunStatus;
  createdAt: string;
  completedAt: string | null;
};

export type AnalyticsStatusBreakdown = Record<WorkflowRunStatus, number>;

export type WorkflowRun = {
  id: string;
  workflowId: string;
  workflow?: Workflow;
  retriedFromRunId: string | null;
  retryCount: number;
  maxRetries: number;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  status: WorkflowRunStatus;
  errorMessage: string | null;
  failureReason: string | null;
  failureCategory: FailureCategory | null;
  retryEligible: boolean;
  lastErrorAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isProviderType(value: unknown): value is ProviderType {
  return (
    value === "simulated" ||
    value === "openai" ||
    value === "anthropic" ||
    value === "local" ||
    value === "custom-webhook"
  );
}

export function getRunProviderMetadata(
  run: WorkflowRun,
): ProviderMetadata | null {
  const metadata = run.outputPayload?.providerMetadata;
  if (!metadata || typeof metadata !== "object") return null;

  const provider = (metadata as { provider?: unknown }).provider;
  if (!isProviderType(provider)) return null;

  return metadata as ProviderMetadata;
}

export function getRunExecutionProvider(run: WorkflowRun): ProviderType {
  return (
    getRunProviderMetadata(run)?.provider ??
    run.workflow?.providerType ??
    "simulated"
  );
}

export type WorkflowLog = {
  id: string;
  workflowRunId: string;
  stepName: string;
  message: string;
  createdAt: string;
};

export type WorkflowEvent = {
  id: string;
  runId: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export function getApiBaseUrl(): string | null {
  const isServer = typeof window === "undefined";

  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const internal = isServer ? process.env.API_INTERNAL_URL?.trim() : undefined;

  const resolved = internal || configured;
  if (!resolved) return null;
  return resolved.replace(/\/+$/, "");
}

export function getApiBaseUrlOrThrow(): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_URL (copy apps/web/.env.example to apps/web/.env.local). In Docker, set API_INTERNAL_URL=http://api:3001 for server-side fetches.",
    );
  }
  return baseUrl;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrlOrThrow();

  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && method !== "GET" && method !== "HEAD") {
    headers.set("Content-Type", "application/json");
  }

  const timeoutMs = 8000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(
        `Request timed out after ${timeoutMs}ms. Check NEXT_PUBLIC_API_URL (${baseUrl}) and that the API is reachable.`,
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let details: unknown = null;
    try {
      details = await res.json();
    } catch {
      details = await res.text().catch(() => null);
    }
    const message =
      typeof details === "object" && details && "message" in details
        ? String((details as { message: unknown }).message)
        : `Request failed: ${res.status}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return (await res.json()) as T;
}

export const api = {
  async health(): Promise<{ status: "ok"; service: string }> {
    return fetchJson("/health", { cache: "no-store" });
  },
  async listWorkflows(): Promise<Workflow[]> {
    return fetchJson("/workflows", { cache: "no-store" });
  },
  async listProviders(): Promise<ProviderStatus[]> {
    return fetchJson("/providers", { cache: "no-store" });
  },
  async getWorkflow(slug: string): Promise<Workflow> {
    return fetchJson(`/workflows/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
  },
  async createWorkflow(params: {
    name: string;
    slug: string;
    description: string;
    category: string;
    status?: WorkflowStatus;
    providerType?: ProviderType;
    inputSchema: WorkflowInputSchema;
  }): Promise<Workflow> {
    return fetchJson("/workflows", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  async updateWorkflow(
    id: string,
    params: {
      name?: string;
      description?: string;
      category?: string;
      status?: WorkflowStatus;
      providerType?: ProviderType;
      inputSchema?: WorkflowInputSchema;
    },
  ): Promise<Workflow> {
    return fetchJson(`/workflows/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(params),
    });
  },
  async deactivateWorkflow(id: string): Promise<Workflow> {
    return fetchJson(`/workflows/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
  async analyticsOverview(): Promise<AnalyticsOverview> {
    return fetchJson("/analytics/overview", { cache: "no-store" });
  },
  async analyticsWorkflowUsage(): Promise<AnalyticsWorkflowUsageRow[]> {
    return fetchJson("/analytics/workflow-usage", { cache: "no-store" });
  },
  async analyticsRecentActivity(): Promise<AnalyticsRecentActivityRow[]> {
    return fetchJson("/analytics/recent-activity", { cache: "no-store" });
  },
  async analyticsStatusBreakdown(): Promise<AnalyticsStatusBreakdown> {
    return fetchJson("/analytics/status-breakdown", { cache: "no-store" });
  },
  async listRuns(): Promise<WorkflowRun[]> {
    return fetchJson("/workflow-runs", { cache: "no-store" });
  },
  async getRun(id: string): Promise<WorkflowRun> {
    return fetchJson(`/workflow-runs/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
  },
  async createRun(params: {
    workflowSlug: string;
    inputPayload: Record<string, unknown>;
  }): Promise<WorkflowRun> {
    return fetchJson("/workflow-runs", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },
  async retryRun(id: string): Promise<WorkflowRun> {
    return fetchJson(`/workflow-runs/${encodeURIComponent(id)}/retry`, {
      method: "POST",
    });
  },
  async listRunLogs(runId: string): Promise<WorkflowLog[]> {
    return fetchJson(`/workflow-runs/${encodeURIComponent(runId)}/logs`, {
      cache: "no-store",
    });
  },
  async listRunEvents(runId: string): Promise<WorkflowEvent[]> {
    return fetchJson(`/workflow-runs/${encodeURIComponent(runId)}/events`, {
      cache: "no-store",
    });
  },
  async listRecentWorkflowEvents(limit = 25): Promise<WorkflowEvent[]> {
    return fetchJson(
      `/workflow-events/recent?limit=${encodeURIComponent(String(limit))}`,
      {
        cache: "no-store",
      },
    );
  },
};
