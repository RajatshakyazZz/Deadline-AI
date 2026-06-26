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

export const app = initializeApp(firebaseAppletConfig);

// Initialize Firebase Auth safely with robust persistence fallbacks to prevent "SecurityError: The operation is insecure" in sandboxed environments
const getSafePersistence = () => {
  const persistences = [];
  
  // Test localStorage
  let isLocalStorageAvailable = false;
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
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
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      const db = window.indexedDB;
      if (db) {
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
    if (typeof window !== 'undefined' && 'sessionStorage' in window) {
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
    console.warn('Firebase initializeAuth failed with safe persistences, falling back to standard getAuth:', err);
    try {
      return getAuth(app);
    } catch (getAuthErr) {
      console.error('getAuth fallback also failed:', getAuthErr);
      throw getAuthErr;
    }
  }
};

export const auth = initializeSafeAuth();
export const db = getFirestore(app, (firebaseAppletConfig as any).firestoreDatabaseId);

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
