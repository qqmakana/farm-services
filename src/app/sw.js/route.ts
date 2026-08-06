import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Combined PWA + FCM service worker at /sw.js.
 * One worker owns scope "/" so installability and push don't fight.
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const fcmReady = Boolean(
    config.apiKey && config.projectId && config.messagingSenderId && config.appId,
  );

  const fcmBlock = fcmReady
    ? `
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');
firebase.initializeApp(${JSON.stringify(config)});
var messaging = firebase.messaging();
messaging.onBackgroundMessage(function (payload) {
  var title = (payload.notification && payload.notification.title) || 'Village Ride';
  var options = {
    body: (payload.notification && payload.notification.body) || '',
    data: payload.data || {},
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };
  self.registration.showNotification(title, options);
});
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/driver';
  event.waitUntil(clients.openWindow(url));
});
`
    : "";

  const body = `/* Village Ride service worker v3 — PWA + FCM */
const CACHE = "village-ride-v3";
const PRECACHE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/get-app"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        if (response.ok && (url.pathname === "/" || url.pathname.startsWith("/icons/"))) {
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});
${fcmBlock}
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-store",
    },
  });
}
