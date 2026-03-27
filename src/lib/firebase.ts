import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import { ensureAppServiceWorker } from './pwa';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let messagingPromise: Promise<Messaging | null> | null = null;

async function getTokenWithFallback(
  messaging: Messaging,
  vapidKey: string,
  serviceWorkerRegistration: ServiceWorkerRegistration,
) {
  try {
    return await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError' && 'serviceWorker' in navigator) {
      const readyRegistration = await navigator.serviceWorker.ready;
      return getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: readyRegistration,
      });
    }

    throw error;
  }
}

type NotificationPermissionState = NotificationPermission | 'unsupported';

function notificationsAreSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!notificationsAreSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

async function ensureNotificationPermission(): Promise<NotificationPermissionState> {
  if (!notificationsAreSupported()) {
    return 'unsupported';
  }

  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }

  return Notification.permission;
}

async function getMessagingInstance() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!messagingPromise) {
    messagingPromise = isSupported()
      .then((supported) => (supported ? getMessaging(app) : null))
      .catch((error) => {
        console.log('Firebase Messaging no está soportado en este entorno.', error);
        return null;
      });
  }

  return messagingPromise;
}

export const requestForToken = async () => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) {
      return null;
    }

    const permission = await ensureNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notificaciones no habilitadas. Estado:', permission);
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.log('No se encontro VITE_FIREBASE_VAPID_KEY.');
      return null;
    }

    const serviceWorkerRegistration = await ensureAppServiceWorker();
    if (!serviceWorkerRegistration) {
      console.log('Service worker no disponible en este entorno. Se omite token FCM.');
      return null;
    }

    const currentToken = await getTokenWithFallback(messaging, vapidKey, serviceWorkerRegistration);
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  let unsubscribe: (() => void) | undefined;

  void getMessagingInstance().then((messaging) => {
    if (!messaging) {
      return;
    }

    unsubscribe = onMessage(messaging, (payload) => {
      callback(payload);
    });
  });

  return () => {
    unsubscribe?.();
  };
};
