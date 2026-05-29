import "server-only";

import { randomInt } from "crypto";
import { existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";
import { writeFileAtomic } from "./atomic-file";
import { APP_DATA_DIR } from "./auth-config";

export type TreffpunktMode = "median" | "mean" | "fair" | "hoodometer";

export type TreffpunktScenarioPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  weight: number;
};

export type TreffpunktScenario = {
  code: string;
  people: TreffpunktScenarioPoint[];
  mode: TreffpunktMode;
  lambda: number;
  createdAt: string;
  updatedAt: string;
};

type TreffpunktScenarioStore = {
  storeVersion: number;
  scenarios: Record<string, TreffpunktScenario>;
};

export type TreffpunktScenarioInput = {
  people?: unknown;
  mode?: unknown;
  lambda?: unknown;
};

const STORE_VERSION = 1;
const STORE_FILENAME = "treffpunkt-scenarios.json";
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function getStorePath() {
  return path.isAbsolute(APP_DATA_DIR)
    ? path.join(APP_DATA_DIR, STORE_FILENAME)
    : path.join(process.cwd(), APP_DATA_DIR, STORE_FILENAME);
}

function ensureStoreDir() {
  mkdirSync(path.dirname(getStorePath()), { recursive: true });
}

function createEmptyStore(): TreffpunktScenarioStore {
  return {
    storeVersion: STORE_VERSION,
    scenarios: {},
  };
}

function normalizeCode(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeMode(value: unknown): TreffpunktMode {
  return value === "mean" || value === "fair" || value === "median" || value === "hoodometer"
    ? value
    : "median";
}

function normalizeWeight(value: unknown) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value.replace(",", "."))
        : 1;

  if (!Number.isFinite(numericValue)) return 1;
  return Math.min(99, Math.max(1, Math.round(numericValue)));
}

function normalizeLatitude(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(numericValue) ? Math.min(90, Math.max(-90, numericValue)) : null;
}

function normalizeLongitude(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(numericValue) ? Math.min(180, Math.max(-180, numericValue)) : null;
}

function normalizePoint(value: unknown, index: number): TreffpunktScenarioPoint | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TreffpunktScenarioPoint>;
  const lat = normalizeLatitude(candidate.lat);
  const lng = normalizeLongitude(candidate.lng);

  if (lat === null || lng === null) return null;

  return {
    id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim().slice(0, 80) : `p-${index + 1}`,
    lat,
    lng,
    label:
      typeof candidate.label === "string" && candidate.label.trim()
        ? candidate.label.trim().slice(0, 80)
        : `Wohnort ${index + 1}`,
    weight: normalizeWeight(candidate.weight),
  };
}

function normalizePeople(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 80)
    .map(normalizePoint)
    .filter((point): point is TreffpunktScenarioPoint => point !== null);
}

function normalizeLambda(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(numericValue)) return 0.8;
  return Math.min(3, Math.max(0, numericValue));
}

function normalizeScenario(value: unknown): TreffpunktScenario | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<TreffpunktScenario>;
  const code = typeof candidate.code === "string" ? normalizeCode(candidate.code) : "";
  const people = normalizePeople(candidate.people);

  if (!code || !people.length) return null;

  const now = new Date().toISOString();
  return {
    code,
    people,
    mode: normalizeMode(candidate.mode),
    lambda: normalizeLambda(candidate.lambda),
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : now,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : now,
  };
}

function normalizeStore(value: unknown): TreffpunktScenarioStore {
  if (!value || typeof value !== "object") return createEmptyStore();
  const candidate = value as Partial<TreffpunktScenarioStore>;
  const sourceScenarios = candidate.scenarios && typeof candidate.scenarios === "object" ? candidate.scenarios : {};
  const scenarios: Record<string, TreffpunktScenario> = {};

  for (const scenario of Object.values(sourceScenarios)) {
    const normalizedScenario = normalizeScenario(scenario);
    if (normalizedScenario) {
      scenarios[normalizedScenario.code] = normalizedScenario;
    }
  }

  return {
    storeVersion: STORE_VERSION,
    scenarios,
  };
}

function readStore() {
  ensureStoreDir();
  const storePath = getStorePath();

  if (!existsSync(storePath)) {
    return createEmptyStore();
  }

  try {
    return normalizeStore(JSON.parse(readFileSync(storePath, "utf8")) as unknown);
  } catch {
    return createEmptyStore();
  }
}

function writeStore(store: TreffpunktScenarioStore) {
  ensureStoreDir();
  writeFileAtomic(getStorePath(), JSON.stringify(store, null, 2));
}

function createScenarioCode(store: TreffpunktScenarioStore) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    let code = "";

    for (let index = 0; index < 7; index += 1) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }

    if (!store.scenarios[code]) return code;
  }

  return `${Date.now().toString(36)}${randomInt(999).toString(36)}`;
}

export function createTreffpunktScenario(input: TreffpunktScenarioInput) {
  const store = readStore();
  const now = new Date().toISOString();
  const people = normalizePeople(input.people);

  if (!people.length) {
    throw new Error("A scenario needs at least one Wohnort.");
  }

  const code = createScenarioCode(store);
  const scenario: TreffpunktScenario = {
    code,
    people,
    mode: normalizeMode(input.mode),
    lambda: normalizeLambda(input.lambda),
    createdAt: now,
    updatedAt: now,
  };

  store.scenarios[code] = scenario;
  store.storeVersion = STORE_VERSION;
  writeStore(store);
  return scenario;
}

export function findTreffpunktScenario(rawCode: string) {
  const code = normalizeCode(rawCode);
  if (!code) return null;
  return readStore().scenarios[code] ?? null;
}
