import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  enableIndexedDbPersistence,
  initializeFirestore
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAEvUvbhv2vXj8qa1G6r9S8HSr2cFUv_bM',
  authDomain: 'studio-7634777517-713ea.firebaseapp.com',
  projectId: 'studio-7634777517-713ea',
  storageBucket: 'studio-7634777517-713ea.firebasestorage.app',
  messagingSenderId: '142898689875',
  appId: '1:142898689875:web:726d61b0a2590e7e4c93a6',
  measurementId: 'G-3JZQJD550E'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Force long-polling to fix "pending requests" issue on some networks/hosting
export const db = initializeFirestore(
  firebaseApp,
  {
    experimentalForceLongPolling: true,
    useFetchStreams: false
  }
);

// Offline persistence (best-effort)
export const firestorePersistence = {
  enabled: false,
  error: null
};

enableIndexedDbPersistence(db)
  .then(() => {
    firestorePersistence.enabled = true;
  })
  .catch((err) => {
    // Multiple tabs / unsupported browser etc.
    firestorePersistence.enabled = false;
    firestorePersistence.error = err?.code || err?.message || 'unknown';
  });

export const firebaseProjectId = firebaseConfig.projectId;
export const firebaseConfigSource = {
  usingEnv: true,
};
