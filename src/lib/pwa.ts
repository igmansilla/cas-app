import { registerSW } from "virtual:pwa-register";

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
const DEV_PWA_ENABLED = import.meta.env.VITE_PWA_DEV === "true";

async function clearServiceWorkerStateInDev() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
  } catch (error) {
    console.warn("No se pudo limpiar el service worker en dev", error);
  }

  return null;
}

export function ensureAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }

  if (import.meta.env.DEV && !DEV_PWA_ENABLED) {
    if (!serviceWorkerRegistrationPromise) {
      serviceWorkerRegistrationPromise = clearServiceWorkerStateInDev();
    }

    return serviceWorkerRegistrationPromise;
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