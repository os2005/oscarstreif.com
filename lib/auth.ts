import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_SECRET, SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "./auth-config";
import {
  createSessionRecord,
  findUserByEmail,
  generateTemporaryPassword,
  hashSessionToken,
  hashPassword,
  makePasswordRecord,
  readStore,
  updateStore,
} from "./auth-store";
import type { AccessResult, Role, SessionUser, StoredUser } from "./auth-types";

function signValue(value: string) {
  return createHmac("sha256", AUTH_SECRET).update(value).digest("hex");
}

function serializeCookieValue(token: string, userId: string) {
  const payload = `${userId}:${token}`;
  return `${payload}:${signValue(payload)}`;
}

function parseCookieValue(rawValue: string | undefined) {
  if (!rawValue) return null;
  const parts = rawValue.split(":");
  if (parts.length !== 3) return null;

  const [userId, token, signature] = parts;
  const payload = `${userId}:${token}`;
  const expectedSignature = signValue(payload);

  if (
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  return { userId, token };
}

function toSessionUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const parsedCookie = parseCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!parsedCookie) {
    return null;
  }

  const store = readStore();
  const session = store.sessions.find(
    (entry) =>
      entry.userId === parsedCookie.userId &&
      entry.tokenHash === hashSessionToken(parsedCookie.token, parsedCookie.userId)
  );

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    updateStore((mutableStore) => {
      mutableStore.sessions = mutableStore.sessions.filter((entry) => entry.id !== session.id);
    });
    return null;
  }

  const user = store.users.find((entry) => entry.id === parsedCookie.userId);
  return user ? toSessionUser(user) : null;
}

export async function requireUser(redirectTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`);
  }
  return user;
}

export async function getAccessForRole(requiredRole: Role): Promise<AccessResult | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (requiredRole === "shared") {
    return { allowed: true, user };
  }

  return {
    allowed: user.role === "admin",
    user,
  };
}

export async function loginWithCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const store = readStore();
  const user = findUserByEmail(store, normalizedEmail);

  if (!user) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const candidateHash = hashPassword(password, user.passwordSalt);

  if (
    candidateHash.length !== user.passwordHash.length ||
    !timingSafeEqual(Buffer.from(candidateHash), Buffer.from(user.passwordHash))
  ) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const { token, session } = createSessionRecord(user.id);
  updateStore((mutableStore) => {
    mutableStore.sessions = mutableStore.sessions.filter((entry) => entry.userId !== user.id);
    mutableStore.sessions.push(session);
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, serializeCookieValue(token, user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return { ok: true as const, role: user.role };
}

export async function logoutCurrentUser() {
  const cookieStore = await cookies();
  const parsedCookie = parseCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (parsedCookie) {
    updateStore((mutableStore) => {
      mutableStore.sessions = mutableStore.sessions.filter(
        (entry) =>
          !(
            entry.userId === parsedCookie.userId &&
            entry.tokenHash === hashSessionToken(parsedCookie.token, parsedCookie.userId)
          )
      );
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function changeCurrentUserPassword(currentPassword: string, nextPassword: string) {
  const user = await requireUser("/settings");
  const store = readStore();
  const storedUser = store.users.find((entry) => entry.id === user.id);

  if (!storedUser) {
    return { ok: false as const, error: "Account not found." };
  }

  const currentHash = hashPassword(currentPassword, storedUser.passwordSalt);
  if (
    currentHash.length !== storedUser.passwordHash.length ||
    !timingSafeEqual(Buffer.from(currentHash), Buffer.from(storedUser.passwordHash))
  ) {
    return { ok: false as const, error: "Current password is incorrect." };
  }

  const nextPasswordRecord = makePasswordRecord(nextPassword);

  updateStore((mutableStore) => {
    mutableStore.users = mutableStore.users.map((entry) =>
      entry.id === storedUser.id
        ? {
            ...entry,
            ...nextPasswordRecord,
            updatedAt: new Date().toISOString(),
          }
        : entry
    );
  });

  return { ok: true as const };
}

export async function createSharedInvitation(email: string) {
  const user = await requireUser("/settings");

  if (user.role !== "admin") {
    return { ok: false as const, error: "Only admins can create invitations." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const temporaryPassword = generateTemporaryPassword();

  const result = updateStore((mutableStore) => {
    if (findUserByEmail(mutableStore, normalizedEmail)) {
      return { ok: false as const, error: "A user with this email already exists." };
    }

    const passwordRecord = makePasswordRecord(temporaryPassword);
    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      role: "shared",
      ...passwordRecord,
      createdAt: now,
      updatedAt: now,
    };

    mutableStore.users.push(newUser);
    mutableStore.invitations.push({
      id: crypto.randomUUID(),
      email: normalizedEmail,
      role: "shared",
      createdByUserId: user.id,
      createdAt: now,
    });

    return { ok: true as const };
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true as const,
    email: normalizedEmail,
    password: temporaryPassword,
    role: "shared" as const,
  };
}
