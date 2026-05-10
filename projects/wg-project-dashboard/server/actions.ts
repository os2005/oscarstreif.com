"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { findProjectBySlug } from "@/lib/projects";
import { getCurrentUser } from "@/lib/auth";
import { getProjectAccessDecision } from "@/lib/project-access";
import {
  deleteWgProject,
  upsertWgProject,
} from "../data/store";
import type {
  WgChecklistItem,
  WgDashboardProjectInput,
  WgProjectStage,
  WgShoppingItem,
} from "../types";
import { WG_PROJECT_DASHBOARD_SLUG, WG_PROJECT_STAGE_OPTIONS } from "../types";

export type WgProjectActionState = {
  error?: string;
  success?: string;
};

function revalidateDashboardPaths() {
  revalidatePath("/shared");
  revalidatePath(`/shared/${WG_PROJECT_DASHBOARD_SLUG}`);
}

async function ensureDashboardAccess() {
  const project = findProjectBySlug(WG_PROJECT_DASHBOARD_SLUG);
  const user = await getCurrentUser();

  if (!project) {
    return { ok: false as const, error: "The WG Project Dashboard runtime record is missing." };
  }

  const decision = getProjectAccessDecision(project, user);

  if (decision.kind !== "allowed") {
    return { ok: false as const, error: "You are not allowed to change this dashboard." };
  }

  return { ok: true as const };
}

function parseMoneyField(value: FormDataEntryValue | null, label: string) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return 0;
  }

  const parsed = Number.parseFloat(rawValue.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < 0) {
    return `${label} must be a valid non-negative number.`;
  }

  return Number(parsed.toFixed(2));
}

function parseJsonField<T>(value: FormDataEntryValue | null, fieldName: string) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return [] as T;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    throw new Error(`Invalid ${fieldName} payload.`);
  }
}

function parseShoppingItems(items: unknown) {
  if (!Array.isArray(items)) {
    return { ok: false as const, error: "Shopping items must be an array." };
  }

  const normalizedItems: WgShoppingItem[] = [];

  for (const item of items) {
    const candidate = item as Partial<WgShoppingItem>;
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";

    if (!name) {
      continue;
    }

    const quantity = typeof candidate.quantity === "string" ? candidate.quantity.trim() : "";
    const estimatedPriceRaw = (candidate as { estimatedPrice?: unknown }).estimatedPrice;
    let estimatedPrice: number | null = null;

    const hasEstimatedPriceValue =
      estimatedPriceRaw !== null &&
      estimatedPriceRaw !== undefined &&
      !(typeof estimatedPriceRaw === "string" && estimatedPriceRaw.trim() === "");

    if (hasEstimatedPriceValue) {
      const parsed =
        typeof estimatedPriceRaw === "number"
          ? estimatedPriceRaw
          : Number.parseFloat(String(estimatedPriceRaw).trim().replace(",", "."));

      if (!Number.isFinite(parsed) || parsed < 0) {
        return { ok: false as const, error: `Shopping item "${name}" has an invalid estimated price.` };
      }

      estimatedPrice = Number(parsed.toFixed(2));
    }

    normalizedItems.push({
      id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : randomUUID(),
      name,
      estimatedPrice,
      quantity,
      status: candidate.status === "already-owned" ? "already-owned" : "still-needed",
    });
  }

  return { ok: true as const, payload: normalizedItems };
}

function parseChecklistItems(items: unknown) {
  if (!Array.isArray(items)) {
    return { ok: false as const, error: "Checklist items must be an array." };
  }

  const normalizedItems: WgChecklistItem[] = [];

  for (const item of items) {
    const candidate = item as Partial<WgChecklistItem>;
    const label = typeof candidate.label === "string" ? candidate.label.trim() : "";

    if (!label) {
      continue;
    }

    normalizedItems.push({
      id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : randomUUID(),
      label,
      completed: Boolean(candidate.completed),
    });
  }

  return { ok: true as const, payload: normalizedItems };
}

function parseProjectInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const stage = String(formData.get("stage") ?? "idea");
  const contributorNotes = String(formData.get("contributorNotes") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const totalBudget = parseMoneyField(formData.get("totalBudget"), "Total budget");
  const currentSavings = parseMoneyField(formData.get("currentSavings"), "Current savings");

  if (!title) {
    return { ok: false as const, error: "Please provide a project title." };
  }

  if (!description) {
    return { ok: false as const, error: "Please provide a short project description." };
  }

  if (!WG_PROJECT_STAGE_OPTIONS.some((option) => option.value === stage)) {
    return { ok: false as const, error: "Please choose a valid project stage." };
  }

  if (typeof totalBudget === "string") {
    return { ok: false as const, error: totalBudget };
  }

  if (typeof currentSavings === "string") {
    return { ok: false as const, error: currentSavings };
  }

  try {
    const shoppingItems = parseShoppingItems(parseJsonField<unknown[]>(formData.get("shoppingItemsJson"), "shopping items"));
    if (!shoppingItems.ok) {
      return shoppingItems;
    }

    const checklistItems = parseChecklistItems(parseJsonField<unknown[]>(formData.get("checklistItemsJson"), "checklist items"));
    if (!checklistItems.ok) {
      return checklistItems;
    }

    const payload: WgDashboardProjectInput = {
      title,
      description,
      stage: stage as WgProjectStage,
      shoppingItems: shoppingItems.payload,
      totalBudget,
      currentSavings,
      contributorNotes,
      researchScopeCompleted: formData.has("researchScopeCompleted"),
      checklistItems: checklistItems.payload,
      notes,
    };

    return { ok: true as const, payload };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Invalid project payload.",
    };
  }
}

export async function saveWgProjectAction(
  _: WgProjectActionState,
  formData: FormData
): Promise<WgProjectActionState> {
  const access = await ensureDashboardAccess();

  if (!access.ok) {
    return { error: access.error };
  }

  const parsed = parseProjectInput(formData);

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  upsertWgProject(projectId, parsed.payload);
  revalidateDashboardPaths();

  return {
    success: projectId ? "WG project updated successfully." : "WG project created successfully.",
  };
}

export async function deleteWgProjectAction(
  _: WgProjectActionState,
  formData: FormData
): Promise<WgProjectActionState> {
  const access = await ensureDashboardAccess();

  if (!access.ok) {
    return { error: access.error };
  }

  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    return { error: "Project not found." };
  }

  const deletedProject = deleteWgProject(projectId);

  if (!deletedProject) {
    return { error: "Project not found." };
  }

  revalidateDashboardPaths();

  return {
    success: "WG project deleted successfully.",
  };
}
