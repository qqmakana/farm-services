const KEY = "village_ride_simple_mode";

export function isSimpleMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function setSimpleMode(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, on ? "1" : "0");
  document.documentElement.classList.toggle("vr-simple-mode", on);
}

export function applySimpleModeClass(): void {
  if (typeof window === "undefined") return;
  document.documentElement.classList.toggle("vr-simple-mode", isSimpleMode());
}
