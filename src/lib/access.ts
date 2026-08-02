/**
 * Full Practice access — local unlock for v1.
 * Book-bundle / Shopify codes can plug into tryUnlock() later
 * without changing the rest of the app.
 */

const ACCESS_KEY = "borrowed-history-journal:full-practice:v1";

/** Quiet demo codes for local unlock before commerce wiring. */
const ACCEPTED_CODES = [
  "full practice",
  "borrowed history",
  "two cent",
  "dividend",
];

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function isFullPracticeUnlocked(): boolean {
  if (!isBrowser()) return false;
  try {
    return localStorage.getItem(ACCESS_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockFullPractice(): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_KEY, "1");
}

export function lockFullPractice(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_KEY);
}

/**
 * Attempt unlock with a phrase or future book-bundle code.
 * Returns true if accepted.
 */
export function tryUnlock(code: string): boolean {
  const normalized = code.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return false;
  if (ACCEPTED_CODES.includes(normalized)) {
    unlockFullPractice();
    return true;
  }
  // Future: validate Shopify/book purchase tokens here
  return false;
}

export const BOOK_URL =
  "https://twocentphilosophy.com/products/the-borrowed-history-predicament";
