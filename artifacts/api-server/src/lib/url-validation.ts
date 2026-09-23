export function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > 2048) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
      return null;
    }
    const normalized = parsed.toString();
    return normalized.length <= 2048 ? normalized : null;
  } catch {
    return null;
  }
}