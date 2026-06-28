import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence, 
  browserPopupRedirectResolver,
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut as fbSignOut, 
  getRedirectResult 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../firebase-applet-config.json';
import { safeStorage } from './utils/storage';
import { getEnvValue } from './utils/env';

// Prioritize environment variables from window runtime, Vite, falling back to firebase-applet-config.json
const firebaseConfig = {
  apiKey: getEnvValue('VITE_FIREBASE_API_KEY') || firebaseAppletConfig.apiKey,
  authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN') || firebaseAppletConfig.authDomain,
  projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID') || firebaseAppletConfig.projectId,
  storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET') || firebaseAppletConfig.storageBucket,
  messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID') || firebaseAppletConfig.messagingSenderId,
  appId: getEnvValue('VITE_FIREBASE_APP_ID') || firebaseAppletConfig.appId,
  measurementId: getEnvValue('VITE_FIREBASE_MEASUREMENT_ID') || (firebaseAppletConfig as any).measurementId || ""
};

export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth safely with robust persistence fallbacks to prevent "SecurityError: The operation is insecure" in sandboxed environments
const getSafePersistence = () => {
  const persistences = [];
  
  // Test if we are in an iframe (sandboxed environments block local storage/indexedDB access)
  let isIframe = false;
  try {
    isIframe = typeof window !== 'undefined' && window.self !== window.top;
  } catch (e) {
    isIframe = true;
  }
  
  // Test localStorage
  let isLocalStorageAvailable = false;
  try {
    if (typeof window !== 'undefined' && !isIframe && 'localStorage' in window) {
      const testKey = '__auth_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      isLocalStorageAvailable = true;
    }
  } catch (e) {
    console.warn('localStorage is not accessible for Firebase Auth persistence:', e);
  }

  // Test indexedDB - accessing or referencing indexedDB inside sandboxed iframes can throw a SecurityError
  let isIndexedDBAvailable = false;
  try {
    if (typeof window !== 'undefined' && !isIframe && 'indexedDB' in window && window.indexedDB) {
      // Actually try to open a test database to trigger any potential SecurityError synchronously or asynchronously
      const request = window.indexedDB.open('__firebase_auth_test_db__');
      if (request) {
        isIndexedDBAvailable = true;
      }
    }
  } catch (e) {
    console.warn('indexedDB is not accessible for Firebase Auth persistence:', e);
  }

  // browserLocalPersistence requires both localStorage and indexedDB to function without throwing SecurityErrors
  if (isLocalStorageAvailable && isIndexedDBAvailable) {
    persistences.push(browserLocalPersistence);
  }

  // Test sessionStorage
  let isSessionStorageAvailable = false;
  try {
    if (typeof window !== 'undefined' && !isIframe && 'sessionStorage' in window) {
      const testKey = '__auth_session_test__';
      window.sessionStorage.setItem(testKey, testKey);
      window.sessionStorage.removeItem(testKey);
      isSessionStorageAvailable = true;
    }
  } catch (e) {
    console.warn('sessionStorage is not accessible for Firebase Auth persistence:', e);
  }

  if (isSessionStorageAvailable) {
    persistences.push(browserSessionPersistence);
  }

  // Always include inMemoryPersistence as the fallback
  persistences.push(inMemoryPersistence);
  
  return persistences;
};

const initializeSafeAuth = () => {
  try {
    const persistence = getSafePersistence();
    return initializeAuth(app, { 
      persistence,
      popupRedirectResolver: browserPopupRedirectResolver
    });
  } catch (err) {
    console.warn('Firebase initializeAuth failed with safe persistences, falling back to in-memory persistence:', err);
    try {
      return initializeAuth(app, {
        persistence: inMemoryPersistence,
        popupRedirectResolver: browserPopupRedirectResolver
      });
    } catch (inMemErr) {
      console.error('Even safe in-memory initializeAuth failed, falling back to standard getAuth:', inMemErr);
      try {
        return getAuth(app);
      } catch (getAuthErr) {
        console.error('getAuth fallback also failed:', getAuthErr);
        throw getAuthErr;
      }
    }
  }
};

export const auth = initializeSafeAuth();

const getSafeFirestore = () => {
  const dbId = getEnvValue('VITE_FIREBASE_DATABASE_ID') || (firebaseAppletConfig as any).firestoreDatabaseId;
  try {
    if (dbId && dbId !== "(default)" && dbId !== "default") {
      return getFirestore(app, dbId);
    }
    return getFirestore(app);
  } catch (err) {
    console.warn('Initializing Firestore with custom database ID failed, falling back to default:', err);
    return getFirestore(app);
  }
};

export const db = getSafeFirestore();

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return {
      user: result.user,
      token: credential?.accessToken || null
    };
  } catch (error: any) {
    console.error('Popup blocked or failed, attempting redirect:', error);
    try {
      safeStorage.setItem('deadlineai_pending_redirect', 'true');
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError) {
      console.error('Redirect sign in also failed:', redirectError);
      throw error;
    }
  }
};

export const getGoogleRedirectToken = async () => {
  try {
    const isPending = safeStorage.getItem('deadlineai_pending_redirect') === 'true';
    if (!isPending) {
      return null;
    }
    const result = await getRedirectResult(auth);
    safeStorage.removeItem('deadlineai_pending_redirect');
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      return credential?.accessToken || null;
    }
  } catch (error) {
    console.error('Error getting redirect result:', error);
    safeStorage.removeItem('deadlineai_pending_redirect');
  }
  return null;
};

export const signOutUser = async () => {
  return await fbSignOut(auth);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
