import { registerSW } from "virtual:pwa-register";

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
const DEV_PWA_ENABLED = import.meta.env.VITE_PWA_DEV === "true";
const SW_ACTIVATION_TIMEOUT_MS = 10_000;

async function waitForActivatedServiceWorker(
  registration: ServiceWorkerRegistration,
): Promise<ServiceWorkerRegistration | null> {
  if (registration.active?.state === "activated") {
    return registration;
  }

  let readyRegistration: ServiceWorkerRegistration | null = null;
  try {
    readyRegistration = await navigator.serviceWorker.ready;
    if (readyRegistration.active?.state === "activated") {
      return readyRegistration;
    }
  } catch {
    readyRegistration = null;
  }

  const candidate = readyRegistration ?? registration;
  const worker = candidate.installing ?? candidate.waiting ?? candidate.active;

  if (!worker) {
    return null;
  }

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, SW_ACTIVATION_TIMEOUT_MS);

    const onStateChange = () => {
      if (worker.state === "activated") {
        clearTimeout(timeout);
        worker.removeEventListener("statechange", onStateChange);
        resolve();
      }
    };

    worker.addEventListener("statechange", onStateChange);
    onStateChange();
  });

  return candidate.active?.state === "activated" ? candidate : null;
}

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
            void waitForActivatedServiceWorker(registration).then((activeRegistration) => {
              resolve(activeRegistration);
            });
            return;
          }

          navigator.serviceWorker.ready
            .then((readyRegistration) =>
              waitForActivatedServiceWorker(readyRegistration).then((activeRegistration) => {
                resolve(activeRegistration);
              }),
            )
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