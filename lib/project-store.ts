import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { APP_DATA_DIR } from "./auth-config";
import type { ProjectMockData, ProjectStore, ProjectStatus, ProjectVisibility, StoredProject } from "./project-types";

const PROJECT_STORE_FILENAME = "project-store.json";
const PROJECT_STORE_VERSION = 1;

function createPreviewDataUri(title: string, accent: string, secondary: string, detail: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="760" rx="42" fill="#07111f" />
      <rect x="34" y="34" width="1132" height="692" rx="34" fill="url(#bg)" opacity="0.95" />
      <rect x="88" y="92" width="280" height="20" rx="10" fill="rgba(255,255,255,0.44)" />
      <rect x="88" y="140" width="520" height="96" rx="22" fill="rgba(255,255,255,0.9)" />
      <rect x="88" y="266" width="420" height="26" rx="13" fill="rgba(255,255,255,0.55)" />
      <rect x="88" y="314" width="300" height="18" rx="9" fill="rgba(255,255,255,0.38)" />
      <rect x="88" y="376" width="170" height="58" rx="29" fill="#ffffff" />
      <rect x="280" y="376" width="170" height="58" rx="29" fill="rgba(7,17,31,0.16)" stroke="rgba(255,255,255,0.55)" />
      <rect x="724" y="118" width="348" height="214" rx="28" fill="rgba(255,255,255,0.16)" />
      <rect x="764" y="164" width="132" height="132" rx="30" fill="rgba(255,255,255,0.84)" />
      <rect x="922" y="164" width="108" height="20" rx="10" fill="rgba(255,255,255,0.7)" />
      <rect x="922" y="202" width="88" height="18" rx="9" fill="rgba(255,255,255,0.44)" />
      <rect x="88" y="514" width="984" height="144" rx="30" fill="rgba(7,17,31,0.2)" />
      <text x="88" y="478" fill="#ffffff" font-size="34" font-family="Arial, sans-serif">${title}</text>
      <text x="88" y="566" fill="rgba(255,255,255,0.88)" font-size="28" font-family="Arial, sans-serif">${detail}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createSeedProject(input: {
  title: string;
  slug: string;
  description: string;
  visibility: ProjectVisibility;
  tags: string[];
  accent: string;
  secondary: string;
  detail: string;
  mock: ProjectMockData;
}): StoredProject {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    title: input.title,
    slug: input.slug,
    description: input.description,
    visibility: input.visibility,
    previewImage: createPreviewDataUri(input.title, input.accent, input.secondary, input.detail),
    tags: input.tags,
    status: "active",
    mock: input.mock,
    createdAt: now,
    updatedAt: now,
  };
}

function createDemoProjects() {
  return [
    createSeedProject({
      title: "ColdLog",
      slug: "coldlog",
      description: "A calm operating surface for temperature logging, lab runs and quick anomaly checks.",
      visibility: "open",
      tags: ["lab", "monitoring", "demo"],
      accent: "#145cff",
      secondary: "#6de0ff",
      detail: "Live logging dashboard",
      mock: {
        eyebrow: "Monitoring",
        headline: "Track temperature runs before they become expensive surprises.",
        intro:
          "ColdLog bundles live batches, threshold alerts and recent anomalies into one lightweight landing page for small teams.",
        primaryCta: "Open live board",
        secondaryCta: "View alerts",
        highlights: ["18 active sensors", "2 pending alerts", "99.4% capture rate"],
        sections: [
          {
            title: "Recent anomalies",
            body: "A compact stream flags outliers first, then links back into the full run history for context.",
          },
          {
            title: "Operator notes",
            body: "Shift notes stay attached to each batch so handovers remain readable instead of vanishing in chat.",
          },
        ],
      },
    }),
    createSeedProject({
      title: "Grow Sponsoring",
      slug: "grow-sponsoring",
      description: "A shared sponsor overview for partnerships, follow-ups and pitch-material readiness.",
      visibility: "shared",
      tags: ["shared", "partnerships", "crm"],
      accent: "#0e8f72",
      secondary: "#cde86a",
      detail: "Shared sponsorship cockpit",
      mock: {
        eyebrow: "Shared workspace",
        headline: "Keep sponsor outreach, context and next steps in one visible flow.",
        intro:
          "Grow Sponsoring is a shared project room for relationship status, intro materials and the next strongest move per partner.",
        primaryCta: "Review pipeline",
        secondaryCta: "Download one-pager",
        highlights: ["24 active leads", "7 warm intros", "3 decks updated today"],
        sections: [
          {
            title: "Partnership pipeline",
            body: "Cards group sponsors by momentum so collaborators instantly see where a nudge, call or handoff matters most.",
          },
          {
            title: "Material readiness",
            body: "Each sponsor view surfaces the latest deck, talking points and missing assets before outreach starts.",
          },
        ],
      },
    }),
    createSeedProject({
      title: "Internal Dashboard",
      slug: "internal-dashboard",
      description: "A private control room for internal metrics, access snapshots and weekly execution signals.",
      visibility: "private",
      tags: ["private", "ops", "admin"],
      accent: "#6f3cff",
      secondary: "#141b27",
      detail: "Private execution dashboard",
      mock: {
        eyebrow: "Internal ops",
        headline: "See the weekly operating picture without opening five separate tools.",
        intro:
          "The internal dashboard turns admin metrics, project health and action items into one private overview for quick steering.",
        primaryCta: "Inspect metrics",
        secondaryCta: "Check blockers",
        highlights: ["6 live projects", "1 blocker", "4 admin tasks due"],
        sections: [
          {
            title: "Execution pulse",
            body: "A compact weekly pulse shows what is moving, stalled or at risk before that drift compounds.",
          },
          {
            title: "Access controls",
            body: "Private and shared entries stay visible alongside role-sensitive actions so access reviews happen in context.",
          },
        ],
      },
    }),
  ];
}

function getProjectStorePath() {
  return path.isAbsolute(APP_DATA_DIR)
    ? path.join(APP_DATA_DIR, PROJECT_STORE_FILENAME)
    : path.join(process.cwd(), APP_DATA_DIR, PROJECT_STORE_FILENAME);
}

function ensureDataDir() {
  mkdirSync(path.dirname(getProjectStorePath()), { recursive: true });
}

function createInitialStore(): ProjectStore {
  return {
    storeVersion: PROJECT_STORE_VERSION,
    projects: createDemoProjects(),
  };
}

function normalizeVisibility(visibility: string | undefined): ProjectVisibility {
  if (visibility === "private" || visibility === "shared" || visibility === "open") {
    return visibility;
  }

  return "open";
}

function normalizeStatus(status: string | undefined): ProjectStatus {
  if (status === "draft" || status === "active" || status === "archived") {
    return status;
  }

  return "draft";
}

function normalizeProject(project: Partial<StoredProject>): StoredProject {
  const now = new Date().toISOString();

  return {
    id: project.id ?? randomUUID(),
    title: String(project.title ?? "").trim(),
    slug: String(project.slug ?? "").trim(),
    description: String(project.description ?? "").trim(),
    visibility: normalizeVisibility(project.visibility),
    previewImage: String(project.previewImage ?? "").trim(),
    tags: Array.isArray(project.tags)
      ? project.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
      : [],
    status: normalizeStatus(project.status),
    mock: project.mock
      ? {
          eyebrow: String(project.mock.eyebrow ?? "").trim(),
          headline: String(project.mock.headline ?? "").trim(),
          intro: String(project.mock.intro ?? "").trim(),
          primaryCta: String(project.mock.primaryCta ?? "").trim(),
          secondaryCta: String(project.mock.secondaryCta ?? "").trim(),
          highlights: Array.isArray(project.mock.highlights)
            ? project.mock.highlights.map((item) => String(item).trim()).filter(Boolean)
            : [],
          sections: Array.isArray(project.mock.sections)
            ? project.mock.sections
                .map((section) => ({
                  title: String(section?.title ?? "").trim(),
                  body: String(section?.body ?? "").trim(),
                }))
                .filter((section) => section.title && section.body)
            : [],
        }
      : undefined,
    createdAt: project.createdAt ?? now,
    updatedAt: project.updatedAt ?? now,
  };
}

export function readProjectStore(): ProjectStore {
  ensureDataDir();
  const storePath = getProjectStorePath();

  if (!existsSync(storePath)) {
    const initialStore = createInitialStore();
    writeFileSync(storePath, JSON.stringify(initialStore, null, 2), "utf8");
    return initialStore;
  }

  const parsedStore = JSON.parse(readFileSync(storePath, "utf8")) as Partial<ProjectStore>;
  const store: ProjectStore = {
    storeVersion: parsedStore.storeVersion ?? PROJECT_STORE_VERSION,
    projects: Array.isArray(parsedStore.projects) ? parsedStore.projects.map(normalizeProject) : [],
  };

  if (!store.projects.length) {
    store.projects = createDemoProjects();
    writeProjectStore(store);
  }

  if (store.storeVersion !== PROJECT_STORE_VERSION) {
    store.storeVersion = PROJECT_STORE_VERSION;
  }

  return store;
}

export function writeProjectStore(store: ProjectStore) {
  ensureDataDir();
  writeFileSync(getProjectStorePath(), JSON.stringify(store, null, 2), "utf8");
}

export function updateProjectStore<T>(updater: (store: ProjectStore) => T): T {
  const store = readProjectStore();
  store.storeVersion = PROJECT_STORE_VERSION;
  const result = updater(store);
  writeProjectStore(store);
  return result;
}
