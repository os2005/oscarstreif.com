import "server-only";

import { existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { APP_DATA_DIR } from "@/lib/auth-config";
import { writeFileAtomic } from "@/lib/atomic-file";
import type {
  WgChecklistItem,
  WgDashboardProject,
  WgDashboardProjectInput,
  WgDashboardStore,
  WgProjectStage,
  WgShoppingItem,
  WgShoppingItemStatus,
} from "../types";
import { WG_PROJECT_DASHBOARD_SLUG, WG_PROJECT_STAGE_OPTIONS } from "../types";

const STORE_VERSION = 1;
const STORE_FILENAME = "store.json";
const LOCAL_DATA_DIR = path.join(process.cwd(), "data", "projects", WG_PROJECT_DASHBOARD_SLUG);

function getStorePath() {
  if (process.env.NODE_ENV === "production" && path.isAbsolute(APP_DATA_DIR)) {
    return path.join(APP_DATA_DIR, "projects", WG_PROJECT_DASHBOARD_SLUG, STORE_FILENAME);
  }

  return path.join(LOCAL_DATA_DIR, STORE_FILENAME);
}

function ensureStoreDir() {
  mkdirSync(path.dirname(getStorePath()), { recursive: true });
}

function createDefaultProjects(): WgDashboardProject[] {
  return [
    {
      id: "wg-powerbank-station",
      title: "Powerbank Charging Station",
      description:
        "A small shared station with permanently charged powerbanks for the flat, so someone can quickly grab one before leaving.",
      stage: "planned",
      shoppingItems: [
        {
          id: "powerbank-1",
          name: "Additional 20,000 mAh powerbank",
          estimatedPrice: 28,
          quantity: "1",
          status: "still-needed",
        },
        {
          id: "power-strip-1",
          name: "Power strip",
          estimatedPrice: 8,
          quantity: "1",
          status: "still-needed",
        },
        {
          id: "charger-cable-set",
          name: "USB-C chargers and charging cables",
          estimatedPrice: 12,
          quantity: "1 set",
          status: "still-needed",
        },
      ],
      totalBudget: 48,
      currentSavings: 20,
      contributorNotes: "Shared budget pot currently has EUR 20 reserved from kitchen reimbursements.",
      researchScopeCompleted: true,
      checklistItems: [
        { id: "powerbank-check-1", label: "Check existing powerbanks", completed: true },
        { id: "powerbank-buy-1", label: "Buy one additional powerbank", completed: false },
        { id: "power-strip-buy-1", label: "Buy power strip", completed: false },
        { id: "charging-location-1", label: "Set up fixed charging location", completed: false },
        { id: "cable-label-1", label: "Label cables and powerbanks", completed: false },
      ],
      notes:
        "Placement should stay near the front door but away from kitchen moisture. A small wall shelf may still be enough.",
      createdAt: "2026-05-10T09:00:00.000Z",
      updatedAt: "2026-05-10T09:00:00.000Z",
    },
    {
      id: "wg-cleaning-station",
      title: "Shared Cleaning Supply Station",
      description:
        "Centralize the most-used cleaning supplies in one visible spot so restocking and weekly cleaning are easier to coordinate.",
      stage: "funded",
      shoppingItems: [
        {
          id: "cleaning-bins",
          name: "Stackable storage bins",
          estimatedPrice: 18,
          quantity: "2",
          status: "still-needed",
        },
        {
          id: "labels-pack",
          name: "Labels and marker set",
          estimatedPrice: 6,
          quantity: "1",
          status: "still-needed",
        },
        {
          id: "spray-bottles",
          name: "Reusable spray bottles",
          estimatedPrice: 10,
          quantity: "3",
          status: "already-owned",
        },
      ],
      totalBudget: 36,
      currentSavings: 36,
      contributorNotes: "Two flatmates already transferred their share. No further collection needed.",
      researchScopeCompleted: true,
      checklistItems: [
        { id: "inventory-cleaning", label: "Inventory current supplies", completed: true },
        { id: "cabinet-measurements", label: "Measure cabinet and hallway storage space", completed: true },
        { id: "buy-bins", label: "Buy storage bins and labels", completed: false },
        { id: "assign-restocking", label: "Assign a simple restocking routine", completed: false },
      ],
      notes:
        "If the hallway shelf works, this project can move directly into implementation next grocery run.",
      createdAt: "2026-05-10T09:10:00.000Z",
      updatedAt: "2026-05-10T09:10:00.000Z",
    },
    {
      id: "wg-toolbox-corner",
      title: "Tool Box and Repair Corner",
      description:
        "Create a compact shared repair corner with the basic tools and spare materials needed for small fixes in the flat.",
      stage: "done",
      shoppingItems: [
        {
          id: "toolbox-case",
          name: "Toolbox case",
          estimatedPrice: 22,
          quantity: "1",
          status: "already-owned",
        },
        {
          id: "screw-pack",
          name: "Mixed screws and wall plugs",
          estimatedPrice: 12,
          quantity: "1 pack",
          status: "already-owned",
        },
        {
          id: "basic-tools",
          name: "Shared hammer, pliers, and screwdrivers",
          estimatedPrice: 34,
          quantity: "1 set",
          status: "already-owned",
        },
      ],
      totalBudget: 68,
      currentSavings: 68,
      contributorNotes: "Covered through the shared maintenance budget in April.",
      researchScopeCompleted: true,
      checklistItems: [
        { id: "repair-scope", label: "Define the essential tool set", completed: true },
        { id: "buy-tools", label: "Buy missing tools and consumables", completed: true },
        { id: "setup-corner", label: "Set up the repair corner", completed: true },
        { id: "label-storage", label: "Label drawers and spare parts", completed: true },
      ],
      notes:
        "The entry cupboard is now the permanent repair spot. Remaining improvement would be a printed inventory card.",
      createdAt: "2026-05-10T09:20:00.000Z",
      updatedAt: "2026-05-10T09:20:00.000Z",
    },
  ];
}

function createInitialStore(): WgDashboardStore {
  return {
    storeVersion: STORE_VERSION,
    projects: createDefaultProjects(),
  };
}

function normalizeStage(stage: string | undefined): WgProjectStage {
  if (WG_PROJECT_STAGE_OPTIONS.some((option) => option.value === stage)) {
    return stage as WgProjectStage;
  }

  return "idea";
}

function normalizeShoppingItemStatus(status: string | undefined): WgShoppingItemStatus {
  return status === "already-owned" ? "already-owned" : "still-needed";
}

function normalizeCurrency(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Number(value.toFixed(2)));
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = Number.parseFloat(value.trim().replace(",", "."));
    return Number.isFinite(normalized) ? Math.max(0, Number(normalized.toFixed(2))) : 0;
  }

  return 0;
}

function normalizeShoppingItems(items: unknown): WgShoppingItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const candidate = item as Partial<WgShoppingItem>;
      const name = typeof candidate.name === "string" ? candidate.name.trim() : "";

      if (!name) {
        return null;
      }

      return {
        id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : randomUUID(),
        name,
        estimatedPrice:
          candidate.estimatedPrice === null || candidate.estimatedPrice === undefined
            ? null
            : normalizeCurrency(candidate.estimatedPrice),
        quantity: typeof candidate.quantity === "string" ? candidate.quantity.trim() : "",
        status: normalizeShoppingItemStatus(candidate.status),
      };
    })
    .filter((item): item is WgShoppingItem => item !== null);
}

function normalizeChecklistItems(items: unknown): WgChecklistItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const candidate = item as Partial<WgChecklistItem>;
      const label = typeof candidate.label === "string" ? candidate.label.trim() : "";

      if (!label) {
        return null;
      }

      return {
        id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : randomUUID(),
        label,
        completed: Boolean(candidate.completed),
      };
    })
    .filter((item): item is WgChecklistItem => item !== null);
}

function normalizeProject(project: Partial<WgDashboardProject>): WgDashboardProject {
  const now = new Date().toISOString();

  return {
    id: typeof project.id === "string" && project.id.trim() ? project.id.trim() : randomUUID(),
    title: typeof project.title === "string" ? project.title.trim() : "",
    description: typeof project.description === "string" ? project.description.trim() : "",
    stage: normalizeStage(project.stage),
    shoppingItems: normalizeShoppingItems(project.shoppingItems),
    totalBudget: normalizeCurrency(project.totalBudget),
    currentSavings: normalizeCurrency(project.currentSavings),
    contributorNotes: typeof project.contributorNotes === "string" ? project.contributorNotes.trim() : "",
    researchScopeCompleted: Boolean(project.researchScopeCompleted),
    checklistItems: normalizeChecklistItems(project.checklistItems),
    notes: typeof project.notes === "string" ? project.notes.trim() : "",
    createdAt: typeof project.createdAt === "string" && project.createdAt.trim() ? project.createdAt : now,
    updatedAt: typeof project.updatedAt === "string" && project.updatedAt.trim() ? project.updatedAt : now,
  };
}

function normalizeStore(store: Partial<WgDashboardStore>): WgDashboardStore {
  const normalizedProjects = Array.isArray(store.projects) ? store.projects.map(normalizeProject) : [];

  return {
    storeVersion: STORE_VERSION,
    projects: normalizedProjects.length ? normalizedProjects : createDefaultProjects(),
  };
}

export function readWgProjectDashboardStore(): WgDashboardStore {
  ensureStoreDir();
  const storePath = getStorePath();

  if (!existsSync(storePath)) {
    const initialStore = createInitialStore();
    writeWgProjectDashboardStore(initialStore);
    return initialStore;
  }

  try {
    const parsedStore = JSON.parse(readFileSync(storePath, "utf8")) as Partial<WgDashboardStore>;
    const store = normalizeStore(parsedStore);
    writeWgProjectDashboardStore(store);
    return store;
  } catch {
    const initialStore = createInitialStore();
    writeWgProjectDashboardStore(initialStore);
    return initialStore;
  }
}

export function writeWgProjectDashboardStore(store: WgDashboardStore) {
  ensureStoreDir();
  writeFileAtomic(getStorePath(), JSON.stringify(store, null, 2));
}

export function updateWgProjectDashboardStore<T>(updater: (store: WgDashboardStore) => T): T {
  const store = readWgProjectDashboardStore();
  store.storeVersion = STORE_VERSION;
  const result = updater(store);
  writeWgProjectDashboardStore(store);
  return result;
}

export function upsertWgProject(projectId: string | null, input: WgDashboardProjectInput) {
  return updateWgProjectDashboardStore((store) => {
    const now = new Date().toISOString();
    const normalizedInput = normalizeProject({
      ...input,
      id: projectId ?? randomUUID(),
      createdAt: now,
      updatedAt: now,
    });

    const existingProject = projectId ? store.projects.find((project) => project.id === projectId) : null;

    if (existingProject) {
      existingProject.title = normalizedInput.title;
      existingProject.description = normalizedInput.description;
      existingProject.stage = normalizedInput.stage;
      existingProject.shoppingItems = normalizedInput.shoppingItems;
      existingProject.totalBudget = normalizedInput.totalBudget;
      existingProject.currentSavings = normalizedInput.currentSavings;
      existingProject.contributorNotes = normalizedInput.contributorNotes;
      existingProject.researchScopeCompleted = normalizedInput.researchScopeCompleted;
      existingProject.checklistItems = normalizedInput.checklistItems;
      existingProject.notes = normalizedInput.notes;
      existingProject.updatedAt = now;

      return existingProject;
    }

    const project: WgDashboardProject = {
      ...normalizedInput,
      id: normalizedInput.id,
      createdAt: now,
      updatedAt: now,
    };

    store.projects.unshift(project);
    return project;
  });
}

export function deleteWgProject(projectId: string) {
  return updateWgProjectDashboardStore((store) => {
    const project = store.projects.find((entry) => entry.id === projectId);

    if (!project) {
      return null;
    }

    store.projects = store.projects.filter((entry) => entry.id !== projectId);
    return project;
  });
}
