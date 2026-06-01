"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ProviderStatus,
  ProviderType,
  Workflow,
  WorkflowFieldSchema,
  WorkflowInputSchema,
  WorkflowStatus,
} from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { api } from "../lib/api";

export type WorkflowTemplateDraft = {
  name: string;
  slug: string;
  description: string;
  category: string;
  status: WorkflowStatus;
  providerType: ProviderType;
  inputSchema: WorkflowInputSchema;
};

type FieldDraft = WorkflowFieldSchema & { optionsCsv?: string };

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function asFieldDrafts(schema: WorkflowInputSchema): FieldDraft[] {
  return (schema.fields ?? []).map((f) => ({
    ...f,
    optionsCsv:
      f.type === "select"
        ? (f.options ?? []).map((o) => o.value).join(", ")
        : "",
  }));
}

function toFieldSchema(field: FieldDraft): WorkflowFieldSchema {
  const base: WorkflowFieldSchema = {
    name: field.name,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder,
    options: field.options,
  };

  if (field.type !== "select") {
    return { ...base, options: undefined };
  }

  const options = (field.optionsCsv ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40)
    .map((value) => ({ label: value, value }));

  return { ...base, options: options.length > 0 ? options : undefined };
}

export function WorkflowTemplateEditor({
  mode,
  initial,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial: WorkflowTemplateDraft;
  onSubmit: (draft: WorkflowTemplateDraft) => Promise<Workflow>;
}) {
  const [draft, setDraft] = useState<WorkflowTemplateDraft>(initial);
  const [fields, setFields] = useState<FieldDraft[]>(() =>
    asFieldDrafts(initial.inputSchema),
  );
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "success"; workflow: Workflow }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [providers, setProviders] = useState<ProviderStatus[]>([]);

  useEffect(() => {
    let cancelled = false;
    void api
      .listProviders()
      .then((result) => {
        if (!cancelled) setProviders(result);
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProviderStatus = providers.find(
    (provider) => provider.type === draft.providerType,
  );

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "Required";
    if (!draft.slug.trim()) next.slug = "Required";
    if (!draft.description.trim()) next.description = "Required";
    if (!draft.category.trim()) next.category = "Required";

    const seen = new Set<string>();
    fields.forEach((f, idx) => {
      const key = `field_${idx}`;
      if (!f.name.trim()) next[`${key}_name`] = "Required";
      if (!f.label.trim()) next[`${key}_label`] = "Required";
      if (!f.type) next[`${key}_type`] = "Required";
      const normalized = f.name.trim();
      if (normalized) {
        if (seen.has(normalized)) next[`${key}_name`] = "Duplicate name";
        seen.add(normalized);
      }
    });
    return next;
  }, [draft, fields]);

  async function handleSubmit() {
    if (Object.keys(errors).length > 0) {
      setState({ kind: "error", message: "Please fix validation errors." });
      return;
    }

    setState({ kind: "submitting" });
    try {
      const workflow = await onSubmit({
        ...draft,
        slug: normalizeSlug(draft.slug),
        inputSchema: { fields: fields.map(toFieldSchema) },
      });
      setState({ kind: "success", workflow });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to save workflow";
      setState({ kind: "error", message });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create"
              ? "Create workflow template"
              : "Edit workflow template"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                value={draft.name}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, name: e.target.value }))
                }
              />
              {errors.name ? (
                <div className="text-xs text-rose-700">{errors.name}</div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="slug">
                Slug
              </label>
              <input
                id="slug"
                disabled={mode === "edit"}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
                value={draft.slug}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, slug: e.target.value }))
                }
              />
              <div className="text-xs text-muted-foreground">
                Lowercase with hyphens (example: <code>content-summary</code>).
              </div>
              {errors.slug ? (
                <div className="text-xs text-rose-700">{errors.slug}</div>
              ) : null}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                value={draft.description}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, description: e.target.value }))
                }
              />
              {errors.description ? (
                <div className="text-xs text-rose-700">
                  {errors.description}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="category">
                Category
              </label>
              <input
                id="category"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                value={draft.category}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, category: e.target.value }))
                }
              />
              {errors.category ? (
                <div className="text-xs text-rose-700">{errors.category}</div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                value={draft.status}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    status: e.target.value as WorkflowStatus,
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <div className="text-xs text-muted-foreground">
                Inactive workflows remain available for viewing but are visually
                de-emphasized.
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="providerType">
                Provider
              </label>
              <select
                id="providerType"
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                value={draft.providerType}
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    providerType: e.target.value as ProviderType,
                  }))
                }
              >
                <option value="simulated">
                  Simulated (safe, deterministic)
                </option>
                <option value="openai">OpenAI (optional real provider)</option>
                <option value="anthropic" disabled>
                  Anthropic (coming soon)
                </option>
                <option value="local" disabled>
                  Local LLM (coming soon)
                </option>
                <option value="custom-webhook" disabled>
                  Custom webhook (coming soon)
                </option>
              </select>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  Simulated provider is recommended for public demo usage.
                  OpenAI provider requires backend environment configuration.
                  Coming soon providers are displayed for architecture readiness
                  and cannot be selected here.
                </div>
                {selectedProviderStatus ? (
                  <Badge
                    variant={
                      selectedProviderStatus.status === "active" ||
                      selectedProviderStatus.status === "enabled"
                        ? "success"
                        : "warning"
                    }
                  >
                    {selectedProviderStatus.type}:{" "}
                    {selectedProviderStatus.status}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input schema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Add input fields used to render the workflow run form.
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => {
              const key = `field_${idx}`;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-background/40 p-3"
                >
                  <div className="grid gap-3 md:grid-cols-12">
                    <div className="space-y-1 md:col-span-3">
                      <label
                        className="text-xs font-medium"
                        htmlFor={`${key}_name`}
                      >
                        Field name
                      </label>
                      <input
                        id={`${key}_name`}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={field.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFields((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, name: value } : f,
                            ),
                          );
                        }}
                      />
                      {errors[`${key}_name`] ? (
                        <div className="text-xs text-rose-700">
                          {errors[`${key}_name`]}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1 md:col-span-4">
                      <label
                        className="text-xs font-medium"
                        htmlFor={`${key}_label`}
                      >
                        Label
                      </label>
                      <input
                        id={`${key}_label`}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={field.label}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFields((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, label: value } : f,
                            ),
                          );
                        }}
                      />
                      {errors[`${key}_label`] ? (
                        <div className="text-xs text-rose-700">
                          {errors[`${key}_label`]}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1 md:col-span-3">
                      <label
                        className="text-xs font-medium"
                        htmlFor={`${key}_type`}
                      >
                        Type
                      </label>
                      <select
                        id={`${key}_type`}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={field.type}
                        onChange={(e) => {
                          const value = e.target
                            .value as WorkflowFieldSchema["type"];
                          setFields((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, type: value } : f,
                            ),
                          );
                        }}
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Textarea</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                      </select>
                      {errors[`${key}_type`] ? (
                        <div className="text-xs text-rose-700">
                          {errors[`${key}_type`]}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-end justify-between gap-3 md:col-span-2">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={Boolean(field.required)}
                          onChange={(e) => {
                            const value = e.target.checked;
                            setFields((prev) =>
                              prev.map((f, i) =>
                                i === idx ? { ...f, required: value } : f,
                              ),
                            );
                          }}
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        className="text-xs text-rose-700 underline"
                        onClick={() => {
                          setFields((prev) => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {field.type === "select" ? (
                    <div className="mt-3 space-y-1">
                      <label
                        className="text-xs font-medium"
                        htmlFor={`${key}_options`}
                      >
                        Options (comma-separated)
                      </label>
                      <input
                        id={`${key}_options`}
                        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={field.optionsCsv ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFields((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, optionsCsv: value } : f,
                            ),
                          );
                        }}
                      />
                      <div className="text-xs text-muted-foreground">
                        These values appear in the run form dropdown.
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted/60"
              onClick={() => {
                setFields((prev) => [
                  ...prev,
                  { name: "", label: "", type: "text", required: false },
                ]);
              }}
            >
              Add field
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={state.kind === "submitting"}
          className="inline-flex items-center rounded-md border border-border bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
          onClick={() => void handleSubmit()}
        >
          {state.kind === "submitting"
            ? "Saving..."
            : mode === "create"
              ? "Create workflow"
              : "Save changes"}
        </button>
        {state.kind === "error" ? (
          <div className="text-sm text-rose-700">{state.message}</div>
        ) : null}
        {state.kind === "success" ? (
          <div className="text-sm text-emerald-700">
            Saved: <code>{state.workflow.slug}</code>
          </div>
        ) : null}
      </div>
    </div>
  );
}
