export type Role = "admin" | "shared";

export type StoredUser = {
  id: string;
  email: string;
  role: Role;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredSession = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
};

export type StoredInvitation = {
  id: string;
  email: string;
  role: Exclude<Role, "admin">;
  createdByUserId: string;
  createdAt: string;
};

export type AuthStore = {
  users: StoredUser[];
  sessions: StoredSession[];
  invitations: StoredInvitation[];
};

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
};

export type AccessResult = {
  allowed: boolean;
  user: SessionUser;
};
