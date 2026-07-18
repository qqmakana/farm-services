/** Normalize SA-style person names for fuzzy comparison. */
export function normalizePersonName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\b(mr|mrs|ms|miss|dr|prof)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(name: string): string[] {
  return normalizePersonName(name).split(" ").filter((t) => t.length > 1);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const cur =
        a[i - 1] === b[j - 1]
          ? row[j - 1]
          : 1 + Math.min(row[j - 1], prev, row[j]);
      row[j - 1] = prev;
      prev = cur;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

function tokenClose(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))) {
    return true;
  }
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshtein(a, b);
  return dist <= (maxLen <= 4 ? 1 : 2);
}

/**
 * Score 0–1: fraction of profile name tokens found on the document name.
 * Auto-approve threshold is typically >= 0.6.
 */
export function nameMatchScore(
  profileName: string,
  documentName: string | null | undefined,
): number {
  if (!documentName?.trim()) return 0;
  const profile = tokens(profileName);
  const doc = tokens(documentName);
  if (!profile.length || !doc.length) return 0;

  let hits = 0;
  for (const p of profile) {
    if (doc.some((d) => tokenClose(p, d))) hits += 1;
  }
  return hits / profile.length;
}

export function namesLikelyMatch(
  profileName: string,
  documentName: string | null | undefined,
  threshold = 0.6,
): boolean {
  return nameMatchScore(profileName, documentName) >= threshold;
}
