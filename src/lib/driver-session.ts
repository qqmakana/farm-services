/** Selected driver for the driver app shell (demo / until auth is linked). */

const KEY = "village_ride_driver_id";

export function getSelectedDriverId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setSelectedDriverId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, id);
}

export function clearSelectedDriverId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
