// Service Worker for Sports Organisation Management System
// Provides basic caching for offline functionality

const CACHE_NAME = "sports-org-v1";
const urlsToCache = ["/", "/app.css"];

self.addEventListener("install", function (event) {
  // Skip caching for now to avoid errors
  self.skipWaiting();
});

self.addEventListener("fetch", function (event) {
  // Pass through all requests for now
  return;
});

self.addEventListener("activate", function (event) {
  // Take control immediately
  event.waitUntil(self.clients.claim());
});
