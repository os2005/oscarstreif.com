import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { randomBytes, scryptSync } from "crypto";
import { ADMIN_EMAIL, ADMIN_PASSWORD, APP_DATA_DIR } from "./auth-config";
import type { AuthStore, StoredSession, StoredUser } from "./auth-types";

const STORE_FILENAME = "auth-store.json";

function getStorePath() {
  return path.isAbsolute(APP_DATA_DIR)
    ? path.join(APP_DATA_DIR, STORE_FILENAME)
    : path.join(process.cwd(), APP_DATA_DIR, STORE_FILENAME);
}

function ensureDataDir() {
  mkdirSync(path.dirname(getStorePath()), { recursive: true });
}

function createPasswordHash(password: string, salt = randomBytes(16).toString("hex")) {
  const passwordHash = scryptSync(password, salt, 64).toString("hex");
  return { passwordHash, passwordSalt: salt };
}

function createInitialStore(): AuthStore {
  const now = new Date().toISOString();
  const adminPassword = createPasswordHash(ADMIN_PASSWORD);

  return {
    users: [
      {
        id: randomBytes(16).toString("hex"),
        email: ADMIN_EMAIL.toLowerCase(),
        role: "admin",
        ...adminPassword,
        createdAt: now,
        updatedAt: now,
      },
    ],
    sessions: [],
    invitations: [],
  };
}

function ensureAdminUser(store: AuthStore) {
  const adminUsers = store.users.filter((user) => user.role === "admin");
  const now = new Date().toISOString();
  const nonAdminUsers = store.users.filter((user) => user.role !== "admin");
  const matchingAdmin = adminUsers.find((user) => user.email === ADMIN_EMAIL.toLowerCase());

  if (matchingAdmin) {
    return;
  }

  const adminPassword = createPasswordHash(ADMIN_PASSWORD);
  const preservedAdmin = adminUsers.find((user) => user.email === ADMIN_EMAIL.toLowerCase()) ?? adminUsers[0];

  const adminUser: StoredUser = preservedAdmin
    ? {
        ...preservedAdmin,
        email: ADMIN_EMAIL.toLowerCase(),
        role: "admin",
        ...adminPassword,
        updatedAt: now,
      }
    : {
        id: randomBytes(16).toString("hex"),
        email: ADMIN_EMAIL.toLowerCase(),
        role: "admin",
        ...adminPassword,
        createdAt: now,
        updatedAt: now,
      };

  store.users = [...nonAdminUsers, adminUser];
}

function normalizeRole(role: string | undefined) {
  if (role === "admin" || role === "shared") {
    return role;
  }

  return "shared";
}

export function readStore(): AuthStore {
  ensureDataDir();
  const storePath = getStorePath();

  if (!existsSync(storePath)) {
    const initialStore = createInitialStore();
    writeFileSync(storePath, JSON.stringify(initialStore, null, 2), "utf8");
    return initialStore;
  }

  const parsedStore = JSON.parse(readFileSync(storePath, "utf8")) as Partial<AuthStore>;

  const store: AuthStore = {
    users: (parsedStore.users ?? []).map((user) => ({
      ...user,
      role: normalizeRole(user.role),
      email: user.email.toLowerCase(),
    })),
    sessions: parsedStore.sessions ?? [],
    invitations: (parsedStore.invitations ?? []).map((invitation) => ({
      ...invitation,
      role: "shared",
      email: invitation.email.toLowerCase(),
    })),
  };

  const before = JSON.stringify(store);
  ensureAdminUser(store);
  if (JSON.stringify(store) !== before) {
    writeStore(store);
  }

  return store;
}

export function writeStore(store: AuthStore) {
  ensureDataDir();
  writeFileSync(getStorePath(), JSON.stringify(store, null, 2), "utf8");
}

export function updateStore<T>(updater: (store: AuthStore) => T): T {
  const store = readStore();
  const result = updater(store);
  writeStore(store);
  return result;
}

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function makePasswordRecord(password: string) {
  return createPasswordHash(password);
}

export function findUserByEmail(store: AuthStore, email: string) {
  return store.users.find((user) => user.email === email.toLowerCase());
}

export function createSessionRecord(userId: string): { token: string; session: StoredSession } {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString();

  return {
    token,
    session: {
      id: randomBytes(16).toString("hex"),
      userId,
      tokenHash: hashPassword(token, userId),
      createdAt: now.toISOString(),
      expiresAt,
    },
  };
}

export function hashSessionToken(token: string, userId: string) {
  return hashPassword(token, userId);
}

export function generateTemporaryPassword() {
  return randomBytes(6).toString("base64url");
}
