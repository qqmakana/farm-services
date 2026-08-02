/** One-shot browser GPS — Uber/Bolt style map centering. */

export type GpsCoords = { lat: number; lng: number };

export function requestCurrentGps(options?: {
  timeoutMs?: number;
  maximumAgeMs?: number;
}): Promise<GpsCoords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: options?.timeoutMs ?? 15_000,
        maximumAge: options?.maximumAgeMs ?? 60_000,
      },
    );
  });
}
