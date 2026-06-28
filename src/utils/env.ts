import firebaseAppletConfig from '../../firebase-applet-config.json';

/**
 * Safely retrieves environment variables from runtime window configuration (injected by server)
 * or build-time Vite meta env, with a fallback to firebase-applet-config.json.
 */
export const getEnvValue = (key: string): string => {
  // 1. Check server-injected runtime config
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__ && (window as any).__RUNTIME_CONFIG__[key]) {
    return (window as any).__RUNTIME_CONFIG__[key];
  }

  // 2. Check Vite build-time env
  const viteEnv = (import.meta as any).env;
  if (viteEnv && viteEnv[key]) {
    return viteEnv[key];
  }

  // 3. Fallback to firebase-applet-config.json matching the key name
  const configKeyMap: Record<string, string> = {
    VITE_FIREBASE_API_KEY: 'apiKey',
    VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
    VITE_FIREBASE_PROJECT_ID: 'projectId',
    VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
    VITE_FIREBASE_APP_ID: 'appId',
    VITE_FIREBASE_DATABASE_ID: 'firestoreDatabaseId',
    VITE_FIREBASE_VAPID_KEY: 'vapidKey'
  };

  const appletConfigKey = configKeyMap[key];
  if (appletConfigKey && (firebaseAppletConfig as any)[appletConfigKey]) {
    return (firebaseAppletConfig as any)[appletConfigKey];
  }

  return '';
};
