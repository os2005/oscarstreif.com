export const ADMIN_EMAIL = "os.streif@gmail.com";
export const ADMIN_PASSWORD = "test1234";
export const AUTH_STORE_VERSION = 2;

export const SESSION_COOKIE_NAME = "oscarstreif_session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

export const AUTH_SECRET =
  process.env.AUTH_SECRET ?? "dev-only-secret-change-this-on-the-server-before-production";

export const APP_DATA_DIR =
  process.env.APP_DATA_DIR ?? (process.env.NODE_ENV === "production" ? "/var/lib/oscarstreif" : ".local-data");
