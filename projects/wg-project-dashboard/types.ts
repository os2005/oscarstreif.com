export const WG_PROJECT_DASHBOARD_SLUG = "wg-project-dashboard";

export const WG_PROJECT_STAGE_OPTIONS = [
  {
    value: "idea",
    label: "Idea",
    description: "A rough concept with no confirmed scope, budget, or execution plan yet.",
  },
  {
    value: "planned",
    label: "Planned",
    description: "The scope, required items, and next steps are defined well enough to prepare.",
  },
  {
    value: "funded",
    label: "Funded",
    description: "Enough money has been collected to move from planning into execution readiness.",
  },
  {
    value: "ready-for-implementation",
    label: "Ready for Implementation",
    description: "The project is scoped, planned, and financially ready to execute.",
  },
  {
    value: "done",
    label: "Done",
    description: "The project has been completed.",
  },
] as const;

export type WgProjectStage = (typeof WG_PROJECT_STAGE_OPTIONS)[number]["value"];

export type WgShoppingItemStatus = "still-needed" | "already-owned";

export type WgShoppingItem = {
  id: string;
  name: string;
  estimatedPrice: number | null;
  quantity: string;
  status: WgShoppingItemStatus;
};

export type WgChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};

export type WgDashboardProject = {
  id: string;
  title: string;
  description: string;
  stage: WgProjectStage;
  shoppingItems: WgShoppingItem[];
  totalBudget: number;
  currentSavings: number;
  contributorNotes: string;
  researchScopeCompleted: boolean;
  checklistItems: WgChecklistItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WgDashboardStore = {
  storeVersion: number;
  projects: WgDashboardProject[];
};

export type WgDashboardProjectInput = Omit<WgDashboardProject, "id" | "createdAt" | "updatedAt">;
