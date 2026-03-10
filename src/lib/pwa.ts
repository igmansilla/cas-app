import { registerSW } from "virtual:pwa-register";

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function ensureAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }

  if (!serviceWorkerRegistrationPromise) {
    serviceWorkerRegistrationPromise = new Promise((resolve) => {
      registerSW({
        immediate: true,
        onRegisteredSW(_swScriptUrl, registration) {
          if (registration) {
            resolve(registration);
            return;
          }

          navigator.serviceWorker.ready
            .then((readyRegistration) => resolve(readyRegistration))
            .catch(() => resolve(null));
        },
        onRegisterError(error) {
          console.error("No se pudo registrar el service worker de la app", error);
          resolve(null);
        },
      });
    });
  }

  return serviceWorkerRegistrationPromise;
}