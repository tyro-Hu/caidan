import type { SessionPayload } from "@/lib/app-types";

const apiBaseKey = "beibei_api_base_url";
const sessionKey = "beibei_session";

export function getDefaultApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? "https://beibeicaidan.onrender.com";
}

export function normalizeApiBase(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getStoredApiBase() {
  if (typeof window === "undefined") {
    return getDefaultApiBase();
  }

  return window.localStorage.getItem(apiBaseKey) ?? getDefaultApiBase();
}

export function setStoredApiBase(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(apiBaseKey, normalizeApiBase(value));
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

export function setStoredSession(value: SessionPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(sessionKey, JSON.stringify(value));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(sessionKey);
}
