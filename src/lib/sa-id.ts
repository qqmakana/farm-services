/**
 * South African ID number (smart ID / green book).
 * 13 digits: YYMMDD + sequence + citizenship (0 citizen / 1 PR) + 8 + Luhn check.
 * Passports and foreign IDs are not valid here.
 */

export function normalizeSaId(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

export function saIdRequiredForCountry(countryCode?: string | null): boolean {
  return String(countryCode ?? "").trim().toUpperCase() === "ZA";
}

function plausibleSaIdDob(yy: number, mm: number, dd: number): boolean {
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const nowYear = new Date().getUTCFullYear();
  for (const century of [1900, 2000]) {
    const year = century + yy;
    const d = new Date(Date.UTC(year, mm - 1, dd));
    if (
      d.getUTCFullYear() === year &&
      d.getUTCMonth() === mm - 1 &&
      d.getUTCDate() === dd &&
      year >= 1920 &&
      year <= nowYear
    ) {
      return true;
    }
  }
  return false;
}

/** DHA checksum: odd-position sum + even-digit concat × 2, then check digit. */
function saIdChecksumOk(id: string): boolean {
  let oddSum = 0;
  for (let i = 0; i < 12; i += 2) oddSum += Number(id[i]);
  let evenConcat = "";
  for (let i = 1; i < 12; i += 2) evenConcat += id[i];
  const evenDigits = String(Number(evenConcat) * 2);
  let evenSum = 0;
  for (const ch of evenDigits) evenSum += Number(ch);
  const check = (10 - ((oddSum + evenSum) % 10)) % 10;
  return check === Number(id[12]);
}

export function isValidSaIdNumber(raw: string): boolean {
  const id = normalizeSaId(raw);
  if (!/^\d{13}$/.test(id)) return false;
  const yy = Number(id.slice(0, 2));
  const mm = Number(id.slice(2, 4));
  const dd = Number(id.slice(4, 6));
  if (!plausibleSaIdDob(yy, mm, dd)) return false;
  const citizenship = Number(id[10]);
  if (citizenship !== 0 && citizenship !== 1) return false;
  return saIdChecksumOk(id);
}

export const SA_ID_REJECT_MESSAGE =
  "South Africa drivers must use a 13-digit South African ID (smart ID or green book). Passports and foreign IDs are not accepted.";
