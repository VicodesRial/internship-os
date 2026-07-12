const SYNC_ACCESS_TOKEN_STORAGE_KEY = "internship-tracker-sync-access-token";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadStoredSyncAccessToken() {
  if (!isBrowser()) {
    return "";
  }

  return window.localStorage.getItem(SYNC_ACCESS_TOKEN_STORAGE_KEY) ?? "";
}

export function saveStoredSyncAccessToken(token: string) {
  if (!isBrowser()) {
    return;
  }

  const trimmedToken = token.trim();

  if (trimmedToken === "") {
    window.localStorage.removeItem(SYNC_ACCESS_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SYNC_ACCESS_TOKEN_STORAGE_KEY, trimmedToken);
}

export function clearStoredSyncAccessToken() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(SYNC_ACCESS_TOKEN_STORAGE_KEY);
}
