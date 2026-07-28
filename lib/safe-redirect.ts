const SAFE_ORIGIN = "https://internship-os.invalid";
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

function hasUnsafeDecodedForm(value: string) {
  let candidate = value;

  for (let pass = 0; pass < 10; pass += 1) {
    if (
      !candidate.startsWith("/") ||
      candidate.startsWith("//") ||
      candidate.includes("\\") ||
      CONTROL_CHARACTER_PATTERN.test(candidate)
    ) {
      return true;
    }

    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return false;
      candidate = decoded;
    } catch {
      return true;
    }
  }

  return true;
}

export function getSafeRelativePath(value: string | null | undefined) {
  if (!value || hasUnsafeDecodedForm(value)) return "/";

  try {
    const parsed = new URL(value, SAFE_ORIGIN);
    if (parsed.origin !== SAFE_ORIGIN) return "/";

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}
