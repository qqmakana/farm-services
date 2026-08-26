/** Play Store listing for the Village Ride TWA. */
export const PLAY_STORE_PACKAGE = "app.villageride.twa";

export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;

/**
 * False while the listing is internal/closed testing — people who are not
 * testers cannot install from Play. Share/install must use the home-screen
 * web app instead. Flip to true when the Play listing is public.
 */
export const PLAY_LISTING_PUBLIC = false;
