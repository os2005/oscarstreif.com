export type ExternalRedirectUrlResult =
  | {
      kind: "empty";
    }
  | {
      kind: "invalid";
    }
  | {
      kind: "valid";
      value: string;
    };

export function normalizeExternalRedirectUrl(value?: string | null): ExternalRedirectUrlResult {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return { kind: "empty" };
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalized) ? normalized : `https://${normalized}`;

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { kind: "invalid" };
    }

    return {
      kind: "valid",
      value: parsed.toString(),
    };
  } catch {
    return { kind: "invalid" };
  }
}

export function getSafeExternalRedirectUrl(value?: string | null) {
  const result = normalizeExternalRedirectUrl(value);
  return result.kind === "valid" ? result.value : undefined;
}
