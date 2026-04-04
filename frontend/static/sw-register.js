if (
  "serviceWorker" in navigator &&
  !window.location.hostname.includes("localhost")
) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js")
      .then(function (registration) {
        console.log(
          "[PWA] Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch(function (error) {
        console.log("[PWA] Service Worker registration failed:", error);
      });
  });
}
