export function getSafeExternalUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (trimmedValue === "") {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(value: string) {
  return value.trim() === "" || getSafeExternalUrl(value) !== null;
}
