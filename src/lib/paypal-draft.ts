const DRAFT_KEY = "vr_paypal_draft_v1";
const APPROVE_KEY = "vr_paypal_approve_v1";
const DRAFT_COOKIE = "vr_paypal_draft_v1";
const APPROVE_COOKIE = "vr_paypal_approve_v1";

export type PaypalDraftFlow = "job" | "shop";

function writeCookie(name: string, value: string | null) {
  try {
    if (value == null) {
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
      return;
    }
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=3600; SameSite=Lax`;
  } catch {
    /* private mode */
  }
}

function readCookie(name: string): string | null {
  try {
    const parts = document.cookie.split("; ");
    for (const part of parts) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      if (part.slice(0, eq) === name) {
        return decodeURIComponent(part.slice(eq + 1));
      }
    }
  } catch {
    /* private mode */
  }
  return null;
}

export function stashPaypalBooking(
  draft: unknown,
  flow: PaypalDraftFlow = "job",
) {
  const payload = JSON.stringify({ flow, draft });
  try {
    sessionStorage.setItem(DRAFT_KEY, payload);
  } catch {
    /* private mode */
  }
  writeCookie(DRAFT_COOKIE, payload);
}

export function readPaypalBooking<T = unknown>(): T | null {
  const wrapped = readPaypalStash<T>();
  return wrapped?.draft ?? null;
}

export function readPaypalStash<T = unknown>(): {
  flow: PaypalDraftFlow;
  draft: T;
} | null {
  try {
    const raw =
      (typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(DRAFT_KEY)
        : null) || readCookie(DRAFT_COOKIE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "flow" in parsed &&
      "draft" in parsed
    ) {
      const wrap = parsed as { flow: PaypalDraftFlow; draft: T };
      return {
        flow: wrap.flow === "shop" ? "shop" : "job",
        draft: wrap.draft,
      };
    }
    return { flow: "job", draft: parsed as T };
  } catch {
    return null;
  }
}

export function stashPaypalApproveUrl(url: string | null | undefined) {
  try {
    if (url) sessionStorage.setItem(APPROVE_KEY, url);
    else sessionStorage.removeItem(APPROVE_KEY);
  } catch {
    /* private mode */
  }
  writeCookie(APPROVE_COOKIE, url ?? null);
}

export function readPaypalApproveUrl(): string | null {
  try {
    return (
      sessionStorage.getItem(APPROVE_KEY) || readCookie(APPROVE_COOKIE)
    );
  } catch {
    return readCookie(APPROVE_COOKIE);
  }
}

export function clearPaypalBooking() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem(APPROVE_KEY);
  } catch {
    /* private mode */
  }
  writeCookie(DRAFT_COOKIE, null);
  writeCookie(APPROVE_COOKIE, null);
}
