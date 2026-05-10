"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormMessage } from "@/components/FormMessage";
import { deleteWgProjectAction, saveWgProjectAction, type WgProjectActionState } from "../server/actions";
import type {
  WgChecklistItem,
  WgDashboardProject,
  WgProjectStage,
  WgShoppingItem,
} from "../types";
import { WG_PROJECT_STAGE_OPTIONS } from "../types";

type WgProjectDashboardClientProps = {
  backHref: string;
  backLabel: string;
  initialProjects: WgDashboardProject[];
  isDark: boolean;
  pathLabel: string;
  projectDescription: string;
  projectTitle: string;
  viewerEmail: string | null;
  viewerRole: "admin" | "shared" | null;
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
  isDark: boolean;
  isOpen: boolean;
  project: WgDashboardProject | null;
  onClose: () => void;
};

const initialActionState: WgProjectActionState = {};

function formatCurrency(value: number) {
  return `EUR ${value.toFixed(0)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStageLabel(stage: WgProjectStage) {
  return WG_PROJECT_STAGE_OPTIONS.find((option) => option.value === stage)?.label ?? "Idea";
}

function getStageDescription(stage: WgProjectStage) {
  return WG_PROJECT_STAGE_OPTIONS.find((option) => option.value === stage)?.description ?? "";
}

function getStageIndex(stage: WgProjectStage) {
  return Math.max(
    0,
    WG_PROJECT_STAGE_OPTIONS.findIndex((option) => option.value === stage)
  );
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
  return project.stage === "funded" || project.stage === "ready-for-implementation" || project.stage === "done" || getFundingRatio(project) >= 1;
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

function AuthorizationIntro({ isDark, phase }: { isDark: boolean; phase: "authorizing" | "confirmed" }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/42 p-6 backdrop-blur-md">
      <div
        className={`w-full max-w-md rounded-[2rem] border px-8 py-10 text-center shadow-[0_24px_90px_rgba(0,0,0,0.38)] ${
          isDark ? "border-paper/12 bg-ink/92 text-paper" : "border-ink/12 bg-paper/92 text-ink"
        }`}
      >
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border transition-all duration-300 ${
            phase === "confirmed"
              ? "border-emerald-400/40 bg-emerald-400/12"
              : isDark
                ? "border-paper/16 bg-white/[0.04]"
                : "border-ink/12 bg-ink/5"
          }`}
        >
          {phase === "confirmed" ? (
            <svg className="h-9 w-9 text-emerald-300" fill="none" viewBox="0 0 24 24">
              <path d="M5 13.2 9.2 17 19 7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          ) : (
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-current border-r-current text-accent" />
          )}
        </div>
        <p className={isDark ? "mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-paper/46" : "mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-ink/46"}>
          Secure entry
        </p>
        <h2 className="mt-4 font-display text-4xl leading-none">
          {phase === "confirmed" ? "Access confirmed" : "Authorizing access"}
        </h2>
        <p className={isDark ? "mt-4 text-sm leading-7 text-paper/64" : "mt-4 text-sm leading-7 text-ink/64"}>
          {phase === "confirmed"
            ? "Opening the WG project dashboard."
            : "Checking project access through the private or shared workspace rules."}
        </p>
      </div>
    </div>
  );
}

function StageRail({ isDark, stage }: { isDark: boolean; stage: WgProjectStage }) {
  const stageIndex = getStageIndex(stage);

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {WG_PROJECT_STAGE_OPTIONS.map((option, index) => {
        const isComplete = index <= stageIndex;

        return (
          <div className="flex items-start gap-3" key={option.value}>
            <div className="mt-1 flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-mono uppercase transition ${
                  isComplete
                    ? "border-emerald-400/45 bg-emerald-400/12 text-emerald-200"
                    : isDark
                      ? "border-paper/14 bg-white/[0.04] text-paper/42"
                      : "border-ink/12 bg-ink/5 text-ink/46"
                }`}
              >
                {index + 1}
              </span>
              {index < WG_PROJECT_STAGE_OPTIONS.length - 1 ? (
                <span className={`mt-2 hidden h-8 w-px sm:block ${isComplete ? "bg-emerald-400/35" : isDark ? "bg-paper/10" : "bg-ink/10"}`} />
              ) : null}
            </div>
            <div>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Step {index + 1}
              </p>
              <p className="mt-1 text-sm">{option.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectEditorDialog({ isDark, isOpen, project, onClose }: ProjectEditorDialogProps) {
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
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/58 px-4 py-10 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-[2rem] border shadow-[0_32px_100px_rgba(0,0,0,0.34)] ${isDark ? "border-paper/12 bg-ink text-paper" : "border-ink/12 bg-paper text-ink"}`}>
        <div className={`flex items-center justify-between gap-4 border-b px-6 py-5 ${isDark ? "border-paper/10" : "border-ink/10"}`}>
          <div>
            <p className={isDark ? "font-mono text-[11px] uppercase tracking-[0.22em] text-paper/46" : "font-mono text-[11px] uppercase tracking-[0.22em] text-ink/46"}>
              {project ? "Edit WG project" : "Create WG project"}
            </p>
            <h2 className="mt-3 font-display text-3xl leading-none">{project ? project.title : "New project"}</h2>
          </div>
          <button
            className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
              isDark ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6" : "border-ink/14 text-ink hover:border-ink/40 hover:bg-ink/5"
            }`}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-6">
          {saveState.error ? <FormMessage kind="error">{saveState.error}</FormMessage> : null}
          {deleteState.error ? <FormMessage kind="error">{deleteState.error}</FormMessage> : null}

          <form action={saveFormAction} className="space-y-6">
            <input name="projectId" type="hidden" value={draft.projectId ?? ""} />
            <input name="shoppingItemsJson" type="hidden" value={JSON.stringify(draft.shoppingItems)} />
            <input name="checklistItemsJson" type="hidden" value={JSON.stringify(draft.checklistItems)} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={isDark ? "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50" : "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50"} htmlFor="wg-title">
                  Title
                </label>
                <input
                  className={`w-full rounded-[1.2rem] border px-4 py-3 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/75 text-ink focus:border-ink/34"}`}
                  id="wg-title"
                  name="title"
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  required
                  type="text"
                  value={draft.title}
                />
              </div>
              <div>
                <label className={isDark ? "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50" : "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50"} htmlFor="wg-stage">
                  Stage
                </label>
                <select
                  className={`w-full rounded-[1.2rem] border px-4 py-3 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/75 text-ink focus:border-ink/34"}`}
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
              <label className={isDark ? "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50" : "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50"} htmlFor="wg-description">
                Description
              </label>
              <textarea
                className={`min-h-28 w-full rounded-[1.2rem] border px-4 py-3 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/75 text-ink focus:border-ink/34"}`}
                id="wg-description"
                name="description"
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                required
                value={draft.description}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={isDark ? "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50" : "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50"} htmlFor="wg-budget">
                  Total budget
                </label>
                <input
                  className={`w-full rounded-[1.2rem] border px-4 py-3 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/75 text-ink focus:border-ink/34"}`}
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
                <label className={isDark ? "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50" : "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50"} htmlFor="wg-savings">
                  Current savings
                </label>
                <input
                  className={`w-full rounded-[1.2rem] border px-4 py-3 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/75 text-ink focus:border-ink/34"}`}
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

            <label className={`flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 ${isDark ? "border-paper/12 bg-white/[0.03]" : "border-ink/10 bg-ink/5"}`}>
              <input
                checked={draft.researchScopeCompleted}
                className="h-4 w-4 rounded"
                name="researchScopeCompleted"
                onChange={(event) => setDraft((current) => ({ ...current, researchScopeCompleted: event.target.checked }))}
                type="checkbox"
              />
              <span className="text-sm">Research and scope work completed</span>
            </label>

            <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-paper/12 bg-white/[0.03]" : "border-ink/10 bg-ink/5"}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                    Shopping list
                  </p>
                  <p className={isDark ? "mt-2 text-sm text-paper/64" : "mt-2 text-sm text-ink/64"}>
                    Add required items, approximate prices, and whether they are still needed.
                  </p>
                </div>
                <button
                  className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
                    isDark ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6" : "border-ink/14 text-ink hover:border-ink/40 hover:bg-ink/5"
                  }`}
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
                {draft.shoppingItems.map((item, index) => (
                  <div className="grid gap-3 rounded-[1.2rem] border p-3 md:grid-cols-[minmax(0,2fr)_130px_130px_150px_auto] md:items-center" key={item.id}>
                    <input
                      className={`rounded-[1rem] border px-3 py-2 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/80 text-ink focus:border-ink/34"}`}
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
                      className={`rounded-[1rem] border px-3 py-2 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/80 text-ink focus:border-ink/34"}`}
                      inputMode="decimal"
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          shoppingItems: current.shoppingItems.map((entry) =>
                            entry.id === item.id
                              ? {
                                  ...entry,
                                  estimatedPrice: event.target.value.trim() ? Number.parseFloat(event.target.value.replace(",", ".")) : null,
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
                      className={`rounded-[1rem] border px-3 py-2 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/80 text-ink focus:border-ink/34"}`}
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
                      className={`rounded-[1rem] border px-3 py-2 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/80 text-ink focus:border-ink/34"}`}
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
                      aria-label={`Remove shopping item ${index + 1}`}
                      className="rounded-full border border-red-400/28 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-red-100 transition hover:border-red-300/50 hover:bg-red-400/10"
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

            <div className={`rounded-[1.5rem] border p-4 ${isDark ? "border-paper/12 bg-white/[0.03]" : "border-ink/10 bg-ink/5"}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                    Checklist
                  </p>
                  <p className={isDark ? "mt-2 text-sm text-paper/64" : "mt-2 text-sm text-ink/64"}>
                    Track the concrete steps needed to move the project forward.
                  </p>
                </div>
                <button
                  className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
                    isDark ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6" : "border-ink/14 text-ink hover:border-ink/40 hover:bg-ink/5"
                  }`}
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
                {draft.checklistItems.map((item, index) => (
                  <div className="flex flex-col gap-3 rounded-[1.2rem] border p-3 md:flex-row md:items-center" key={item.id}>
                    <label className={`flex min-w-0 flex-1 items-center gap-3 rounded-[1rem] border px-3 py-2 ${isDark ? "border-paper/12 bg-black/24" : "border-ink/10 bg-white/80"}`}>
                      <input
                        checked={item.completed}
                        className="h-4 w-4 rounded"
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
                        className={`min-w-0 flex-1 bg-transparent outline-none ${isDark ? "text-paper placeholder:text-paper/34" : "text-ink placeholder:text-ink/34"}`}
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
                      aria-label={`Remove checklist item ${index + 1}`}
                      className="rounded-full border border-red-400/28 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-red-100 transition hover:border-red-300/50 hover:bg-red-400/10"
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
                <label className={isDark ? "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50" : "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50"} htmlFor="wg-contributor-notes">
                  Contributor and payment notes
                </label>
                <textarea
                  className={`min-h-28 w-full rounded-[1.2rem] border px-4 py-3 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/75 text-ink focus:border-ink/34"}`}
                  id="wg-contributor-notes"
                  name="contributorNotes"
                  onChange={(event) => setDraft((current) => ({ ...current, contributorNotes: event.target.value }))}
                  value={draft.contributorNotes}
                />
              </div>
              <div>
                <label className={isDark ? "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50" : "mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink/50"} htmlFor="wg-notes">
                  Research and scope notes
                </label>
                <textarea
                  className={`min-h-28 w-full rounded-[1.2rem] border px-4 py-3 outline-none transition ${isDark ? "border-paper/14 bg-black/28 text-paper focus:border-paper/38" : "border-ink/12 bg-white/75 text-ink focus:border-ink/34"}`}
                  id="wg-notes"
                  name="notes"
                  onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  value={draft.notes}
                />
              </div>
            </div>

            <div className={`flex flex-wrap items-center justify-between gap-3 border-t pt-5 ${isDark ? "border-paper/10" : "border-ink/10"}`}>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-paper/16 bg-paper px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={savePending}
                  type="submit"
                >
                  {savePending ? "Saving..." : project ? "Save project" : "Create project"}
                </button>
                <button
                  className={`rounded-full border px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition ${
                    isDark ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6" : "border-ink/14 text-ink hover:border-ink/40 hover:bg-ink/5"
                  }`}
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>

          {project ? (
            <form action={deleteFormAction} className={`mt-4 border-t pt-5 ${isDark ? "border-paper/10" : "border-ink/10"}`}>
              <input name="projectId" type="hidden" value={project.id} />
              <button
                className="rounded-full border border-red-400/28 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-red-100 transition hover:border-red-300/50 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
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

function ProjectDetailsDialog({
  isDark,
  isOpen,
  onClose,
  onEdit,
  project,
}: {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  project: WgDashboardProject | null;
}) {
  if (!isOpen || !project) {
    return null;
  }

  const checklist = getChecklistProgress(project);
  const fundingRatio = getFundingRatio(project);

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/52 px-4 py-10 backdrop-blur-sm">
      <div className={`w-full max-w-4xl rounded-[2rem] border shadow-[0_28px_90px_rgba(0,0,0,0.3)] ${isDark ? "border-paper/12 bg-ink text-paper" : "border-ink/12 bg-paper text-ink"}`}>
        <div className={`flex items-center justify-between gap-4 border-b px-6 py-5 ${isDark ? "border-paper/10" : "border-ink/10"}`}>
          <div>
            <p className={isDark ? "font-mono text-[11px] uppercase tracking-[0.22em] text-paper/46" : "font-mono text-[11px] uppercase tracking-[0.22em] text-ink/46"}>
              WG project details
            </p>
            <h2 className="mt-3 font-display text-3xl leading-none">{project.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-paper/16 bg-paper px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink transition hover:bg-white"
              onClick={onEdit}
              type="button"
            >
              Edit
            </button>
            <button
              className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
                isDark ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6" : "border-ink/14 text-ink hover:border-ink/40 hover:bg-ink/5"
              }`}
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${isDark ? "border-paper/14 text-paper/58" : "border-ink/12 text-ink/56"}`}>
              {getStageLabel(project.stage)}
            </span>
            <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${isDark ? "border-paper/14 text-paper/58" : "border-ink/12 text-ink/56"}`}>
              Created {formatDate(project.createdAt)}
            </span>
            <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${isDark ? "border-paper/14 text-paper/58" : "border-ink/12 text-ink/56"}`}>
              Updated {formatDate(project.updatedAt)}
            </span>
          </div>

          <p className={isDark ? "max-w-3xl leading-7 text-paper/72" : "max-w-3xl leading-7 text-ink/72"}>{project.description}</p>

          <StageRail isDark={isDark} stage={project.stage} />

          <div className="grid gap-4 md:grid-cols-3">
            <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-white/[0.035]" : "border-ink/10 bg-ink/5"}`}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Budget progress
              </p>
              <p className="mt-4 font-display text-4xl leading-none">
                {formatCurrency(project.currentSavings)} / {formatCurrency(project.totalBudget)}
              </p>
            <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.08]" : "bg-ink/10"}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent via-emerald-300 to-emerald-200"
                  style={{ width: `${project.currentSavings > 0 ? Math.max(10, fundingRatio * 100) : 0}%` }}
                />
              </div>
            </div>
            <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-white/[0.035]" : "border-ink/10 bg-ink/5"}`}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Checklist
              </p>
              <p className="mt-4 font-display text-4xl leading-none">
                {checklist.completed}/{checklist.total || 0}
              </p>
              <p className={isDark ? "mt-3 text-sm text-paper/64" : "mt-3 text-sm text-ink/64"}>
                Tasks completed
              </p>
            </div>
            <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-white/[0.035]" : "border-ink/10 bg-ink/5"}`}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Readiness
              </p>
              <p className="mt-4 font-display text-3xl leading-none">
                {isReadyForImplementation(project) ? "Ready" : "In progress"}
              </p>
              <p className={isDark ? "mt-3 text-sm text-paper/64" : "mt-3 text-sm text-ink/64"}>
                Scoped, funded, and clear enough to execute.
              </p>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-white/[0.035]" : "border-ink/10 bg-ink/5"}`}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Shopping list
              </p>
              <div className="mt-4 space-y-3">
                {project.shoppingItems.length ? (
                  project.shoppingItems.map((item) => (
                    <div className={`rounded-[1.15rem] border px-4 py-3 ${isDark ? "border-paper/10 bg-black/20" : "border-ink/10 bg-white/80"}`} key={item.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm">{item.name}</p>
                          <p className={isDark ? "mt-1 text-xs text-paper/54" : "mt-1 text-xs text-ink/54"}>
                            {item.quantity ? `Quantity: ${item.quantity}` : "Quantity not specified"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{item.estimatedPrice === null ? "No price" : formatCurrency(item.estimatedPrice)}</p>
                          <p className={isDark ? "mt-1 text-xs text-paper/54" : "mt-1 text-xs text-ink/54"}>
                            {item.status === "already-owned" ? "Already owned" : "Still needed"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={isDark ? "text-sm text-paper/62" : "text-sm text-ink/62"}>No shopping items yet.</p>
                )}
              </div>
            </div>

            <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-white/[0.035]" : "border-ink/10 bg-ink/5"}`}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Checklist
              </p>
              <div className="mt-4 space-y-3">
                {project.checklistItems.length ? (
                  project.checklistItems.map((item) => (
                    <div className={`flex items-center gap-3 rounded-[1.15rem] border px-4 py-3 ${isDark ? "border-paper/10 bg-black/20" : "border-ink/10 bg-white/80"}`} key={item.id}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${item.completed ? "border-emerald-400/45 bg-emerald-400/12 text-emerald-200" : isDark ? "border-paper/14 text-paper/42" : "border-ink/12 text-ink/42"}`}>
                        {item.completed ? "OK" : "..."}
                      </span>
                      <span className={item.completed ? (isDark ? "text-paper/86" : "text-ink/86") : isDark ? "text-paper/68" : "text-ink/68"}>
                        {item.label}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={isDark ? "text-sm text-paper/62" : "text-sm text-ink/62"}>No checklist items yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-white/[0.035]" : "border-ink/10 bg-ink/5"}`}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Contributor and payment notes
              </p>
              <p className={isDark ? "mt-4 text-sm leading-7 text-paper/68" : "mt-4 text-sm leading-7 text-ink/68"}>
                {project.contributorNotes || "No contributor or payment notes yet."}
              </p>
            </div>
            <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-white/[0.035]" : "border-ink/10 bg-ink/5"}`}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Research and scope notes
              </p>
              <p className={isDark ? "mt-4 text-sm leading-7 text-paper/68" : "mt-4 text-sm leading-7 text-ink/68"}>
                {project.notes || "No research notes yet."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  isDark,
  onEdit,
  onViewDetails,
  project,
}: {
  isDark: boolean;
  onEdit: () => void;
  onViewDetails: () => void;
  project: WgDashboardProject;
}) {
  const fundingRatio = getFundingRatio(project);
  const checklist = getChecklistProgress(project);

  return (
    <article className={`rounded-[1.9rem] border p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${isDark ? "border-paper/12 bg-white/[0.045]" : "border-ink/12 bg-white/78"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
            {getStageLabel(project.stage)}
          </p>
          <h3 className="mt-3 font-display text-3xl leading-none">{project.title}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${isDark ? "border-paper/14 text-paper/56" : "border-ink/12 text-ink/54"}`}>
          {isDoneProject(project) ? "Done" : "Active"}
        </span>
      </div>

      <p className={isDark ? "mt-5 text-sm leading-7 text-paper/68" : "mt-5 text-sm leading-7 text-ink/68"}>
        {project.description}
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Budget progress</span>
            <span className={isDark ? "text-paper/58" : "text-ink/58"}>
              {formatCurrency(project.currentSavings)} / {formatCurrency(project.totalBudget)}
            </span>
          </div>
        <div className={`mt-2 h-2.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.08]" : "bg-ink/10"}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent via-emerald-300 to-emerald-200"
              style={{ width: `${project.currentSavings > 0 ? Math.max(8, fundingRatio * 100) : 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Checklist</span>
            <span className={isDark ? "text-paper/58" : "text-ink/58"}>
              {checklist.completed}/{checklist.total || 0} tasks done
            </span>
          </div>
        <div className={`mt-2 h-2.5 overflow-hidden rounded-full ${isDark ? "bg-white/[0.08]" : "bg-ink/10"}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-300 via-accent to-indigo-300"
              style={{ width: `${checklist.completed > 0 ? Math.max(8, checklist.ratio * 100) : 0}%` }}
            />
          </div>
        </div>

        <div className={`rounded-[1.2rem] border p-3 ${isDark ? "border-paper/10 bg-black/18" : "border-ink/10 bg-ink/5"}`}>
          <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/44" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/44"}>
            Required items
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.shoppingItems.length ? (
              project.shoppingItems.slice(0, 3).map((item) => (
                <span className={`rounded-full border px-3 py-1 text-xs ${isDark ? "border-paper/10 text-paper/62" : "border-ink/10 text-ink/62"}`} key={item.id}>
                  {item.name}
                </span>
              ))
            ) : (
              <span className={isDark ? "text-sm text-paper/52" : "text-sm text-ink/52"}>No items yet</span>
            )}
          </div>
        </div>

        <div className={`rounded-[1.2rem] border p-3 ${isDark ? "border-paper/10 bg-black/18" : "border-ink/10 bg-ink/5"}`}>
          <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/44" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/44"}>
            Stage meaning
          </p>
          <p className={isDark ? "mt-3 text-sm leading-6 text-paper/64" : "mt-3 text-sm leading-6 text-ink/64"}>
            {getStageDescription(project.stage)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-full border border-paper/16 bg-paper px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink transition hover:bg-white"
          onClick={onViewDetails}
          type="button"
        >
          View details
        </button>
        <button
          className={`rounded-full border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
            isDark ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6" : "border-ink/14 text-ink hover:border-ink/40 hover:bg-ink/5"
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

export function WgProjectDashboardClient({
  backHref,
  backLabel,
  initialProjects,
  isDark,
  pathLabel,
  projectDescription,
  projectTitle,
  viewerEmail,
  viewerRole,
}: WgProjectDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("active");
  const [detailsProjectId, setDetailsProjectId] = useState<string | null>(null);
  const [editorProjectId, setEditorProjectId] = useState<string | "new" | null>(null);
  const [authPhase, setAuthPhase] = useState<"authorizing" | "confirmed" | "done">("authorizing");

  useEffect(() => {
    const confirmTimer = window.setTimeout(() => setAuthPhase("confirmed"), 520);
    const doneTimer = window.setTimeout(() => setAuthPhase("done"), 1180);

    return () => {
      window.clearTimeout(confirmTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const activeProjects = initialProjects.filter((project) => !isDoneProject(project));
  const doneProjects = initialProjects.filter((project) => isDoneProject(project));
  const allProjects = initialProjects;
  const visibleProjects =
    activeTab === "active" ? activeProjects : activeTab === "done" ? doneProjects : allProjects;
  const totalBudget = activeProjects.reduce((sum, project) => sum + project.totalBudget, 0);
  const totalSavings = activeProjects.reduce((sum, project) => sum + project.currentSavings, 0);
  const readyProjects = activeProjects.filter((project) => isReadyForImplementation(project)).length;
  const selectedProject = detailsProjectId ? initialProjects.find((project) => project.id === detailsProjectId) ?? null : null;
  const editingProject =
    editorProjectId && editorProjectId !== "new"
      ? initialProjects.find((project) => project.id === editorProjectId) ?? null
      : null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-14 md:px-8 md:pt-20">
      <div className="relative">
        {authPhase !== "done" ? <AuthorizationIntro isDark={isDark} phase={authPhase === "confirmed" ? "confirmed" : "authorizing"} /> : null}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className={`rounded-[2.2rem] border p-6 md:p-8 ${isDark ? "border-paper/12 bg-white/[0.045] text-paper" : "border-ink/12 bg-white/75 text-ink"}`}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={isDark ? "font-mono text-[11px] uppercase tracking-[0.22em] text-paper/46" : "font-mono text-[11px] uppercase tracking-[0.22em] text-ink/46"}>
                  Internal project dashboard
                </p>
                <h1 className="mt-4 max-w-4xl font-display text-[clamp(3rem,7vw,5.7rem)] leading-[0.92]">{projectTitle}</h1>
                <p className={isDark ? "mt-5 max-w-3xl text-lg leading-8 text-paper/68" : "mt-5 max-w-3xl text-lg leading-8 text-ink/68"}>
                  {projectDescription}
                </p>
              </div>
              <div className={`rounded-[1.5rem] border px-4 py-4 ${isDark ? "border-paper/12 bg-black/18" : "border-ink/12 bg-ink/5"}`}>
                <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                  Viewer
                </p>
                <p className="mt-2 text-sm">{viewerEmail ?? "Authorized visitor"}</p>
                <p className={isDark ? "mt-1 text-xs uppercase tracking-[0.18em] text-paper/44" : "mt-1 text-xs uppercase tracking-[0.18em] text-ink/44"}>
                  {viewerRole ?? "shared"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-black/18" : "border-ink/10 bg-ink/5"}`}>
                <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                  Active projects
                </p>
                <p className="mt-4 font-display text-5xl leading-none">{activeProjects.length}</p>
              </div>
              <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-black/18" : "border-ink/10 bg-ink/5"}`}>
                <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                  Ready to implement
                </p>
                <p className="mt-4 font-display text-5xl leading-none">{readyProjects}</p>
              </div>
              <div className={`rounded-[1.6rem] border p-5 ${isDark ? "border-paper/12 bg-black/18" : "border-ink/10 bg-ink/5"}`}>
                <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                  Budget tracked
                </p>
                <p className="mt-4 font-display text-4xl leading-none">
                  {formatCurrency(totalSavings)} / {formatCurrency(totalBudget)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className={`inline-flex w-fit flex-wrap gap-2 rounded-full border p-1.5 ${isDark ? "border-paper/12 bg-black/24" : "border-ink/10 bg-ink/5"}`}>
                {([
                  { id: "active", label: `Active (${activeProjects.length})` },
                  { id: "done", label: `Done (${doneProjects.length})` },
                  { id: "all", label: `All (${allProjects.length})` },
                ] as const).map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      className={`rounded-full px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition ${
                        isActive
                          ? "bg-accent text-white shadow-[0_0_24px_rgba(20,92,255,0.22)]"
                          : isDark
                            ? "text-paper/60 hover:bg-white/6 hover:text-paper"
                            : "text-ink/62 hover:bg-ink/6 hover:text-ink"
                      }`}
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <button
                className="rounded-full border border-paper/16 bg-paper px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink transition hover:bg-white"
                onClick={() => setEditorProjectId("new")}
                type="button"
              >
                Create new WG project
              </button>
            </div>

            <div className="mt-8">
              {visibleProjects.length ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  {visibleProjects.map((project) => (
                    <ProjectCard
                      isDark={isDark}
                      key={project.id}
                      onEdit={() => setEditorProjectId(project.id)}
                      onViewDetails={() => setDetailsProjectId(project.id)}
                      project={project}
                    />
                  ))}
                </div>
              ) : (
                <div className={`rounded-[1.8rem] border p-8 text-center ${isDark ? "border-paper/12 bg-black/18" : "border-ink/10 bg-ink/5"}`}>
                  <p className="font-display text-3xl leading-none">No projects in this view</p>
                  <p className={isDark ? "mt-4 text-sm leading-7 text-paper/64" : "mt-4 text-sm leading-7 text-ink/64"}>
                    Switch tabs or create a new WG project to start tracking shared work, budgets, and implementation tasks.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className={`rounded-[2.2rem] border p-6 ${isDark ? "border-paper/12 bg-white/[0.045] text-paper" : "border-ink/12 bg-white/75 text-ink"}`}>
            <p className={isDark ? "font-mono text-[11px] uppercase tracking-[0.2em] text-paper/46" : "font-mono text-[11px] uppercase tracking-[0.2em] text-ink/46"}>
              Route and access
            </p>
            <p className="mt-4 text-sm leading-7">{pathLabel}</p>
            <p className={isDark ? "mt-4 text-sm leading-7 text-paper/64" : "mt-4 text-sm leading-7 text-ink/64"}>
              This module relies on the platform access rules before any dashboard data is loaded. The dashboard UI is only a visual layer on top of that protected route.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className={`inline-flex rounded-full border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition ${
                  isDark ? "border-paper/16 text-paper hover:border-paper/40 hover:bg-white/6" : "border-ink/14 text-ink hover:border-ink/40 hover:bg-ink/5"
                }`}
                href={backHref}
              >
                {backLabel}
              </Link>
            </div>

            <div className={`mt-8 rounded-[1.5rem] border p-4 ${isDark ? "border-paper/12 bg-black/18" : "border-ink/10 bg-ink/5"}`}>
              <p className={isDark ? "font-mono text-[10px] uppercase tracking-[0.18em] text-paper/46" : "font-mono text-[10px] uppercase tracking-[0.18em] text-ink/46"}>
                Current stage guide
              </p>
              <div className="mt-4 space-y-4">
                {WG_PROJECT_STAGE_OPTIONS.map((option) => (
                  <div key={option.value}>
                    <p className="text-sm">{option.label}</p>
                    <p className={isDark ? "mt-1 text-xs leading-6 text-paper/58" : "mt-1 text-xs leading-6 text-ink/58"}>
                      {option.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ProjectDetailsDialog
        isDark={isDark}
        isOpen={Boolean(selectedProject)}
        onClose={() => setDetailsProjectId(null)}
        onEdit={() => {
          if (selectedProject) {
            setEditorProjectId(selectedProject.id);
            setDetailsProjectId(null);
          }
        }}
        project={selectedProject}
      />

      <ProjectEditorDialog
        key={editorProjectId ?? "editor-closed"}
        isDark={isDark}
        isOpen={editorProjectId !== null}
        onClose={() => setEditorProjectId(null)}
        project={editorProjectId === "new" ? null : editingProject}
      />
    </section>
  );
}
