import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Graceful fallback to the auto-provisioned configuration
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || 'AIzaSyB29m4hDsHKW2kKcZJjibGBRIINURtftXg',
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || 'isometric-catalyst-dhh41.firebaseapp.com',
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || 'isometric-catalyst-dhh41',
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || 'isometric-catalyst-dhh41.firebasestorage.app',
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || '462209499148',
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || '1:462209499148:web:1dc2cff80a49b637b8ee29'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    // In iframe, popup might be blocked, so we can try popup, and if it fails, try redirect or fallback
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error('Popup blocked or failed, attempting redirect:', error);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError) {
      console.error('Redirect sign in also failed:', redirectError);
      throw error;
    }
  }
};

export const signOutUser = async () => {
  return await fbSignOut(auth);
};
