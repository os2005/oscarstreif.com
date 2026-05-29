"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteWgProjectAction, saveWgProjectAction, type WgProjectActionState } from "../server/actions";
import type {
  WgChecklistItem,
  WgDashboardProject,
  WgProjectStage,
  WgShoppingItem,
} from "../types";
import { WG_PROJECT_STAGE_OPTIONS } from "../types";

type WgProjectDashboardClientProps = {
  initialProjects: WgDashboardProject[];
  projectDescription: string;
  projectTitle: string;
  projectVisibility: "open" | "shared" | "private";
  viewerEmail: string | null;
};

type DashboardTab = "active" | "done" | "all";

type ProjectDraft = {
  projectId: string | null;
  title: string;
  description: string;
  stage: WgProjectStage;
  totalBudget: string;
  currentSavings: string;
  contributorNotes: string;
  researchScopeCompleted: boolean;
  checklistItems: WgChecklistItem[];
  notes: string;
  shoppingItems: WgShoppingItem[];
};

type ProjectEditorDialogProps = {
  isOpen: boolean;
  project: WgDashboardProject | null;
  onClose: () => void;
};

const initialActionState: WgProjectActionState = {};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStageMeta(stage: WgProjectStage) {
  return WG_PROJECT_STAGE_OPTIONS.find((option) => option.value === stage) ?? WG_PROJECT_STAGE_OPTIONS[0];
}

function getFundingRatio(project: Pick<WgDashboardProject, "currentSavings" | "totalBudget">) {
  if (project.totalBudget <= 0) {
    return project.currentSavings > 0 ? 1 : 0;
  }

  return Math.max(0, Math.min(1, project.currentSavings / project.totalBudget));
}

function getChecklistProgress(project: Pick<WgDashboardProject, "checklistItems">) {
  const total = project.checklistItems.length;
  const completed = project.checklistItems.filter((item) => item.completed).length;

  return {
    completed,
    total,
    ratio: total ? completed / total : 0,
  };
}

function isDoneProject(project: Pick<WgDashboardProject, "stage">) {
  return project.stage === "done";
}

function isFundedProject(project: Pick<WgDashboardProject, "currentSavings" | "totalBudget" | "stage">) {
  return (
    project.stage === "funded" ||
    project.stage === "ready-for-implementation" ||
    project.stage === "done" ||
    getFundingRatio(project) >= 1
  );
}

function isReadyForImplementation(
  project: Pick<WgDashboardProject, "currentSavings" | "researchScopeCompleted" | "stage" | "totalBudget">
) {
  return (
    project.stage === "ready-for-implementation" ||
    project.stage === "done" ||
    (project.researchScopeCompleted && isFundedProject(project) && project.stage !== "idea")
  );
}

function getReadinessLabel(
  project: Pick<WgDashboardProject, "currentSavings" | "researchScopeCompleted" | "stage" | "totalBudget">
) {
  if (project.stage === "done") {
    return "Completed";
  }

  if (isReadyForImplementation(project)) {
    return "Ready to execute";
  }

  if (!project.researchScopeCompleted) {
    return "Scope still open";
  }

  if (!isFundedProject(project)) {
    return "Funding in progress";
  }

  return "Planning in progress";
}

function createDraft(project: WgDashboardProject | null): ProjectDraft {
  if (!project) {
    return {
      projectId: null,
      title: "",
      description: "",
      stage: "idea",
      totalBudget: "",
      currentSavings: "",
      contributorNotes: "",
      researchScopeCompleted: false,
      checklistItems: [{ id: crypto.randomUUID(), label: "", completed: false }],
      notes: "",
      shoppingItems: [{ id: crypto.randomUUID(), name: "", estimatedPrice: null, quantity: "", status: "still-needed" }],
    };
  }

  return {
    projectId: project.id,
    title: project.title,
    description: project.description,
    stage: project.stage,
    totalBudget: project.totalBudget ? String(project.totalBudget) : "",
    currentSavings: project.currentSavings ? String(project.currentSavings) : "",
    contributorNotes: project.contributorNotes,
    researchScopeCompleted: project.researchScopeCompleted,
    checklistItems: project.checklistItems.length
      ? project.checklistItems.map((item) => ({ ...item }))
      : [{ id: crypto.randomUUID(), label: "", completed: false }],
    notes: project.notes,
    shoppingItems: project.shoppingItems.length
      ? project.shoppingItems.map((item) => ({ ...item }))
      : [{ id: crypto.randomUUID(), name: "", estimatedPrice: null, quantity: "", status: "still-needed" }],
  };
}

function AppMessage({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind: "error" | "success";
}) {
  const styles =
    kind === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function StagePill({ stage }: { stage: WgProjectStage }) {
  const meta = getStageMeta(stage);
  const tone =
    stage === "done"
      ? "border-emerald-300 bg-emerald-100 text-emerald-800"
      : stage === "ready-for-implementation"
        ? "border-sky-300 bg-sky-100 text-sky-800"
        : stage === "funded"
          ? "border-amber-300 bg-amber-100 text-amber-800"
          : stage === "planned"
            ? "border-violet-300 bg-violet-100 text-violet-800"
            : "border-slate-300 bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {meta.label}
    </span>
  );
}

function StageTimeline({ stage }: { stage: WgProjectStage }) {
  const activeIndex = Math.max(
    0,
    WG_PROJECT_STAGE_OPTIONS.findIndex((option) => option.value === stage)
  );

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {WG_PROJECT_STAGE_OPTIONS.map((option, index) => {
        const complete = index <= activeIndex;

        return (
          <div className="rounded-2xl border border-slate-200 bg-white/75 px-3 py-3" key={option.value}>
            <div className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  complete ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-slate-700">{option.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AuthorizationIntro({ phase }: { phase: "authorizing" | "confirmed" }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#eff3e8]/88 px-6 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white px-8 py-10 text-center shadow-[0_40px_100px_rgba(15,23,42,0.16)]">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
            phase === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
          }`}
        >
          {phase === "confirmed" ? (
            <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24">
              <path d="M5 13.2 9.2 17 19 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          ) : (
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
          )}
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">WG workspace</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          {phase === "confirmed" ? "Access confirmed" : "Authorizing access"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {phase === "confirmed"
            ? "Opening the operational dashboard."
            : "Verifying workspace permissions and loading the latest project state."}
        </p>
      </div>
    </div>
  );
}

function ProjectEditorDialog({ isOpen, onClose, project }: ProjectEditorDialogProps) {
  const router = useRouter();
  const [saveState, saveFormAction, savePending] = useActionState(saveWgProjectAction, initialActionState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteWgProjectAction, initialActionState);
  const [draft, setDraft] = useState<ProjectDraft>(() => createDraft(project));

  useEffect(() => {
    if (saveState.success || deleteState.success) {
      onClose();
      router.refresh();
    }
  }, [deleteState.success, onClose, router, saveState.success]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-[28px] border border-slate-200 bg-[#f8faf7] shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {project ? "Edit project" : "Create project"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {project ? project.title : "New WG project"}
            </h2>
          </div>
          <button
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {saveState.error ? <AppMessage kind="error">{saveState.error}</AppMessage> : null}
          {deleteState.error ? <AppMessage kind="error">{deleteState.error}</AppMessage> : null}

          <form action={saveFormAction} className="space-y-6">
            <input name="projectId" type="hidden" value={draft.projectId ?? ""} />
            <input name="shoppingItemsJson" type="hidden" value={JSON.stringify(draft.shoppingItems)} />
            <input name="checklistItemsJson" type="hidden" value={JSON.stringify(draft.checklistItems)} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="wg-title">Title</FieldLabel>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  id="wg-title"
                  name="title"
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  required
                  type="text"
                  value={draft.title}
                />
              </div>
              <div>
                <FieldLabel htmlFor="wg-stage">Stage</FieldLabel>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  id="wg-stage"
                  name="stage"
                  onChange={(event) => setDraft((current) => ({ ...current, stage: event.target.value as WgProjectStage }))}
                  value={draft.stage}
                >
                  {WG_PROJECT_STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="wg-description">Description</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                id="wg-description"
                name="description"
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                required
                value={draft.description}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="wg-budget">Estimated total budget</FieldLabel>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  id="wg-budget"
                  inputMode="decimal"
                  name="totalBudget"
                  onChange={(event) => setDraft((current) => ({ ...current, totalBudget: event.target.value }))}
                  placeholder="48"
                  type="text"
                  value={draft.totalBudget}
                />
              </div>
              <div>
                <FieldLabel htmlFor="wg-savings">Current savings</FieldLabel>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  id="wg-savings"
                  inputMode="decimal"
                  name="currentSavings"
                  onChange={(event) => setDraft((current) => ({ ...current, currentSavings: event.target.value }))}
                  placeholder="20"
                  type="text"
                  value={draft.currentSavings}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input
                checked={draft.researchScopeCompleted}
                className="h-4 w-4 rounded border-slate-300"
                name="researchScopeCompleted"
                onChange={(event) => setDraft((current) => ({ ...current, researchScopeCompleted: event.target.checked }))}
                type="checkbox"
              />
              Research and scope work completed
            </label>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Shopping list</p>
                  <p className="mt-1 text-sm text-slate-500">Track required items, rough prices, and whether they are still needed.</p>
                </div>
                <button
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      shoppingItems: [
                        ...current.shoppingItems,
                        { id: crypto.randomUUID(), name: "", estimatedPrice: null, quantity: "", status: "still-needed" },
                      ],
                    }))
                  }
                  type="button"
                >
                  Add item
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {draft.shoppingItems.map((item) => (
                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-[#f8faf7] p-3 md:grid-cols-[minmax(0,2fr)_130px_130px_150px_auto] md:items-center" key={item.id}>
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          shoppingItems: current.shoppingItems.map((entry) =>
                            entry.id === item.id ? { ...entry, name: event.target.value } : entry
                          ),
                        }))
                      }
                      placeholder="Item name"
                      type="text"
                      value={item.name}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400"
                      inputMode="decimal"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          shoppingItems: current.shoppingItems.map((entry) =>
                            entry.id === item.id
                              ? {
                                  ...entry,
                                  estimatedPrice: event.target.value.trim()
                                    ? Number.parseFloat(event.target.value.replace(",", "."))
                                    : null,
                                }
                              : entry
                          ),
                        }))
                      }
                      placeholder="Price"
                      type="text"
                      value={item.estimatedPrice === null ? "" : String(item.estimatedPrice)}
                    />
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          shoppingItems: current.shoppingItems.map((entry) =>
                            entry.id === item.id ? { ...entry, quantity: event.target.value } : entry
                          ),
                        }))
                      }
                      placeholder="Qty"
                      type="text"
                      value={item.quantity}
                    />
                    <select
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          shoppingItems: current.shoppingItems.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, status: event.target.value === "already-owned" ? "already-owned" : "still-needed" }
                              : entry
                          ),
                        }))
                      }
                      value={item.status}
                    >
                      <option value="still-needed">Still needed</option>
                      <option value="already-owned">Already owned</option>
                    </select>
                    <button
                      className="rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          shoppingItems:
                            current.shoppingItems.length > 1
                              ? current.shoppingItems.filter((entry) => entry.id !== item.id)
                              : [{ id: crypto.randomUUID(), name: "", estimatedPrice: null, quantity: "", status: "still-needed" }],
                        }))
                      }
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Checklist</p>
                  <p className="mt-1 text-sm text-slate-500">Keep execution tasks visible and easy to update.</p>
                </div>
                <button
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      checklistItems: [...current.checklistItems, { id: crypto.randomUUID(), label: "", completed: false }],
                    }))
                  }
                  type="button"
                >
                  Add task
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {draft.checklistItems.map((item) => (
                  <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-[#f8faf7] p-3 md:flex-row md:items-center" key={item.id}>
                    <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <input
                        checked={item.completed}
                        className="h-4 w-4 rounded border-slate-300"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            checklistItems: current.checklistItems.map((entry) =>
                              entry.id === item.id ? { ...entry, completed: event.target.checked } : entry
                            ),
                          }))
                        }
                        type="checkbox"
                      />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            checklistItems: current.checklistItems.map((entry) =>
                              entry.id === item.id ? { ...entry, label: event.target.value } : entry
                            ),
                          }))
                        }
                        placeholder="Checklist item"
                        type="text"
                        value={item.label}
                      />
                    </label>
                    <button
                      className="rounded-full border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          checklistItems:
                            current.checklistItems.length > 1
                              ? current.checklistItems.filter((entry) => entry.id !== item.id)
                              : [{ id: crypto.randomUUID(), label: "", completed: false }],
                        }))
                      }
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="wg-contributor-notes">Contributor and payment notes</FieldLabel>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  id="wg-contributor-notes"
                  name="contributorNotes"
                  onChange={(event) => setDraft((current) => ({ ...current, contributorNotes: event.target.value }))}
                  value={draft.contributorNotes}
                />
              </div>
              <div>
                <FieldLabel htmlFor="wg-notes">Research and scope notes</FieldLabel>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  id="wg-notes"
                  name="notes"
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  value={draft.notes}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={savePending}
                  type="submit"
                >
                  {savePending ? "Saving..." : project ? "Save project" : "Create project"}
                </button>
                <button
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>

          {project ? (
            <form action={deleteFormAction} className="border-t border-slate-200 pt-5">
              <input name="projectId" type="hidden" value={project.id} />
              <button
                className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletePending}
                type="submit"
              >
                {deletePending ? "Deleting..." : "Delete project"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  eyebrow,
  tone,
  value,
}: {
  eyebrow: string;
  tone: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</p>
      <p className={`mt-4 text-4xl font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}

function ProjectCard({
  project,
  selected,
  onSelect,
  onEdit,
}: {
  project: WgDashboardProject;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const fundingRatio = getFundingRatio(project);
  const checklist = getChecklistProgress(project);
  const readinessLabel = getReadinessLabel(project);

  return (
    <article
      className={`rounded-[28px] border p-5 transition ${
        selected
          ? "border-slate-900 bg-slate-900 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]"
          : "border-slate-200 bg-white text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StagePill stage={project.stage} />
          <h3 className="mt-4 text-2xl font-semibold tracking-tight">{project.title}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            selected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {readinessLabel}
        </span>
      </div>

      <p className={`mt-4 text-sm leading-7 ${selected ? "text-slate-200" : "text-slate-600"}`}>{project.description}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className={selected ? "text-slate-300" : "text-slate-500"}>Funding</span>
            <span>{formatCurrency(project.currentSavings)} / {formatCurrency(project.totalBudget)}</span>
          </div>
          <div className={`mt-2 h-2.5 overflow-hidden rounded-full ${selected ? "bg-white/10" : "bg-slate-200"}`}>
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${project.currentSavings > 0 ? Math.max(8, fundingRatio * 100) : 0}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className={selected ? "text-slate-300" : "text-slate-500"}>Checklist</span>
            <span>{checklist.completed}/{checklist.total || 0}</span>
          </div>
          <div className={`mt-2 h-2.5 overflow-hidden rounded-full ${selected ? "bg-white/10" : "bg-slate-200"}`}>
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${checklist.completed > 0 ? Math.max(8, checklist.ratio * 100) : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.shoppingItems.slice(0, 3).map((item) => (
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              selected ? "bg-white/10 text-slate-100" : "bg-slate-100 text-slate-600"
            }`}
            key={item.id}
          >
            {item.name}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            selected ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-700"
          }`}
          onClick={onSelect}
          type="button"
        >
          View details
        </button>
        <button
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            selected ? "border-white/20 text-white hover:bg-white/10" : "border-slate-300 text-slate-700 hover:bg-slate-100"
          }`}
          onClick={onEdit}
          type="button"
        >
          Edit
        </button>
      </div>
    </article>
  );
}

function EmptyState({ tabLabel }: { tabLabel: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
      <h3 className="text-2xl font-semibold tracking-tight text-slate-900">No projects in {tabLabel.toLowerCase()}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Create a new WG project to start tracking funding, tasks, and implementation readiness.
      </p>
    </div>
  );
}

function ProjectDetailPanel({ project }: { project: WgDashboardProject | null }) {
  if (!project) {
    return (
      <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Project details</p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Select a project</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Choose an active or completed project to inspect budget, tasks, notes, and shopping items in one place.
        </p>
      </aside>
    );
  }

  const checklist = getChecklistProgress(project);
  const fundingRatio = getFundingRatio(project);
  const readinessLabel = getReadinessLabel(project);

  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StagePill stage={project.stage} />
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{readinessLabel}</span>
      </div>

      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{project.title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{project.description}</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-[22px] bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">Funding</span>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(project.currentSavings)} / {formatCurrency(project.totalBudget)}</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${project.currentSavings > 0 ? Math.max(8, fundingRatio * 100) : 0}%` }} />
          </div>
        </div>

        <div className="rounded-[22px] bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">Checklist</span>
            <span className="text-sm font-semibold text-slate-900">{checklist.completed}/{checklist.total || 0}</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-sky-400" style={{ width: `${checklist.completed > 0 ? Math.max(8, checklist.ratio * 100) : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Stage timeline</p>
        <div className="mt-3">
          <StageTimeline stage={project.stage} />
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Shopping list</p>
        <div className="mt-3 space-y-3">
          {project.shoppingItems.length ? (
            project.shoppingItems.map((item) => (
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.quantity ? `Quantity: ${item.quantity}` : "Quantity not specified"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.estimatedPrice === null ? "No price" : formatCurrency(item.estimatedPrice)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.status === "already-owned" ? "Already owned" : "Still needed"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No shopping items yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Checklist</p>
        <div className="mt-3 space-y-3">
          {project.checklistItems.length ? (
            project.checklistItems.map((item) => (
              <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3" key={item.id}>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    item.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {item.completed ? "OK" : "..."}
                </span>
                <span className={item.completed ? "text-slate-900" : "text-slate-600"}>{item.label}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No checklist items yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contributor and payment notes</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{project.contributorNotes || "No contributor or payment notes yet."}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Research and scope notes</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{project.notes || "No research or scope notes yet."}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>Created {formatDate(project.createdAt)}</span>
        <span>Updated {formatDate(project.updatedAt)}</span>
      </div>
    </aside>
  );
}

export function WgProjectDashboardClient({
  initialProjects,
  projectDescription,
  projectTitle,
  projectVisibility,
  viewerEmail,
}: WgProjectDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("active");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjects[0]?.id ?? null);
  const [editorProjectId, setEditorProjectId] = useState<string | "new" | null>(null);
  const [authPhase, setAuthPhase] = useState<"authorizing" | "confirmed" | "done">("authorizing");

  useEffect(() => {
    const confirmTimer = window.setTimeout(() => setAuthPhase("confirmed"), 420);
    const doneTimer = window.setTimeout(() => setAuthPhase("done"), 1040);

    return () => {
      window.clearTimeout(confirmTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const activeProjects = initialProjects.filter((project) => !isDoneProject(project));
  const doneProjects = initialProjects.filter((project) => isDoneProject(project));
  const visibleProjects =
    activeTab === "active" ? activeProjects : activeTab === "done" ? doneProjects : initialProjects;
  const totalBudget = activeProjects.reduce((sum, project) => sum + project.totalBudget, 0);
  const totalSavings = activeProjects.reduce((sum, project) => sum + project.currentSavings, 0);
  const readyProjects = activeProjects.filter((project) => isReadyForImplementation(project)).length;
  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId)
    ?? initialProjects.find((project) => project.id === selectedProjectId)
    ?? visibleProjects[0]
    ?? null;
  const editingProject =
    editorProjectId && editorProjectId !== "new"
      ? initialProjects.find((project) => project.id === editorProjectId) ?? null
      : null;

  return (
    <main
      className="min-h-dvh bg-[#edf3ef] text-slate-900"
      data-wg-app-root
      style={{
        fontFamily:
          "Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div className="relative mx-auto max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8">
        {authPhase !== "done" ? <AuthorizationIntro phase={authPhase === "confirmed" ? "confirmed" : "authorizing"} /> : null}

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 bg-[#f7faf8] px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.2)]">
                    WG
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Shared flat operations workspace</p>
                    <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{projectTitle}</h1>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    {projectVisibility} access
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                    {viewerEmail ?? "Authorized session"}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-900 px-5 py-5 text-white sm:px-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Workspace overview</p>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-[15px]">
                    {projectDescription}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100">Planning</span>
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100">Funding</span>
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100">Execution readiness</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <SummaryCard eyebrow="Active projects" tone="text-slate-950" value={String(activeProjects.length)} />
                  <SummaryCard eyebrow="Ready to implement" tone="text-emerald-700" value={String(readyProjects)} />
                  <SummaryCard eyebrow="Tracked funding" tone="text-sky-700" value={`${formatCurrency(totalSavings)} / ${formatCurrency(totalBudget)}`} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-5 sm:px-8 sm:py-8 xl:grid-cols-[260px_minmax(0,1fr)_390px]">
            <aside className="rounded-[28px] border border-slate-200 bg-[#f8faf8] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Navigation</p>
              <div className="mt-4 grid gap-2">
                {([
                  { id: "active", label: `Active projects`, count: activeProjects.length },
                  { id: "done", label: `Completed`, count: doneProjects.length },
                  { id: "all", label: `All tracked`, count: initialProjects.length },
                ] as const).map((tab) => {
                  const active = activeTab === tab.id;

                  return (
                    <button
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                        active
                          ? "bg-slate-900 text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)]"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      type="button"
                    >
                      <span className="font-medium">{tab.label}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Current focus</p>
                <p className="mt-3 text-base font-semibold text-slate-900">
                  {selectedProject ? selectedProject.title : "Choose a project"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use the workspace to coordinate budgets, buying lists, and implementation readiness without exposing private WG data.
                </p>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Project board</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {activeTab === "done" ? "Completed work" : activeTab === "all" ? "All WG projects" : "Active WG projects"}
                  </h2>
                </div>

                <button
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  onClick={() => setEditorProjectId("new")}
                  type="button"
                >
                  Create project
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {visibleProjects.length ? (
                  visibleProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      onEdit={() => setEditorProjectId(project.id)}
                      onSelect={() => setSelectedProjectId(project.id)}
                      project={project}
                      selected={selectedProject?.id === project.id}
                    />
                  ))
                ) : (
                  <EmptyState tabLabel={activeTab === "done" ? "Done" : activeTab === "all" ? "All projects" : "Active"} />
                )}
              </div>
            </section>

            <div className="xl:sticky xl:top-6 xl:self-start">
              <ProjectDetailPanel project={selectedProject} />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-[#f7faf8] px-5 py-4 sm:px-8">
            <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>Standalone WG workspace under the existing access-controlled platform.</p>
              <p>Project route: /shared/wg-project-dashboard</p>
            </div>
          </div>
        </section>
      </div>

      <ProjectEditorDialog
        isOpen={editorProjectId !== null}
        key={editorProjectId ?? "editor-closed"}
        onClose={() => setEditorProjectId(null)}
        project={editorProjectId === "new" ? null : editingProject}
      />
    </main>
  );
}
