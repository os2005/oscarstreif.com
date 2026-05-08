import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { APP_DATA_DIR } from "./auth-config";
import type { ProjectStore, ProjectStatus, ProjectVisibility, StoredProject } from "./project-types";

const PROJECT_STORE_FILENAME = "project-store.json";
const PROJECT_STORE_VERSION = 1;

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
    projects: [],
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
