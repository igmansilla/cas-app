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

    const serviceWorkerRegistration = await ensureAppServiceWorker();
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
    });
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
