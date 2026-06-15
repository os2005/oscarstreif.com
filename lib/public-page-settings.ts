import { existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { writeFileAtomic } from "./atomic-file";
import { APP_DATA_DIR } from "./auth-config";

export type PublicPageKey = "me" | "projects" | "cv";

export type PublicPageSettings = Record<PublicPageKey, boolean>;

const PUBLIC_PAGE_SETTINGS_FILENAME = "public-page-settings.json";
const PUBLIC_PAGE_SETTINGS_VERSION = 1;

const DEFAULT_PUBLIC_PAGE_SETTINGS: PublicPageSettings = {
  me: false,
  projects: false,
  cv: true,
};

type PublicPageSettingsStore = {
  storeVersion: number;
  pages: PublicPageSettings;
};

function getPublicPageSettingsPath() {
  return path.isAbsolute(APP_DATA_DIR)
    ? path.join(APP_DATA_DIR, PUBLIC_PAGE_SETTINGS_FILENAME)
    : path.join(process.cwd(), APP_DATA_DIR, PUBLIC_PAGE_SETTINGS_FILENAME);
}

function ensureDataDir() {
  mkdirSync(path.dirname(getPublicPageSettingsPath()), { recursive: true });
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePages(pages: Partial<PublicPageSettings> | undefined): PublicPageSettings {
  return {
    me: normalizeBoolean(pages?.me, DEFAULT_PUBLIC_PAGE_SETTINGS.me),
    projects: normalizeBoolean(pages?.projects, DEFAULT_PUBLIC_PAGE_SETTINGS.projects),
    cv: normalizeBoolean(pages?.cv, DEFAULT_PUBLIC_PAGE_SETTINGS.cv),
  };
}

export function readPublicPageSettings(): PublicPageSettings {
  ensureDataDir();
  const storePath = getPublicPageSettingsPath();

  if (!existsSync(storePath)) {
    return DEFAULT_PUBLIC_PAGE_SETTINGS;
  }

  const parsedStore = JSON.parse(readFileSync(storePath, "utf8")) as Partial<PublicPageSettingsStore>;
  return normalizePages(parsedStore.pages);
}

export function writePublicPageSettings(pages: PublicPageSettings) {
  ensureDataDir();
  const store: PublicPageSettingsStore = {
    storeVersion: PUBLIC_PAGE_SETTINGS_VERSION,
    pages: normalizePages(pages),
  };

  writeFileAtomic(getPublicPageSettingsPath(), JSON.stringify(store, null, 2));
}
