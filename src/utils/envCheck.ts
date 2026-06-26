import firebaseAppletConfig from '../../firebase-applet-config.json';
import { safeStorage } from './storage';

// Check all required env vars exist on app start
export function validateEnvironment() {
  const missing: string[] = [];

  // Check Gemini API key
  const geminiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || safeStorage.getItem('deadlineai_user_gemini_key');
  if (!geminiKey) {
    missing.push('VITE_GEMINI_API_KEY');
  }

  // Check essential Firebase credentials from environment variables or the config file
  const apiKey = (import.meta as any).env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey;
  const projectId = (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId;
  const appId = (import.meta as any).env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId;

  if (!apiKey) missing.push('VITE_FIREBASE_API_KEY / apiKey');
  if (!projectId) missing.push('VITE_FIREBASE_PROJECT_ID / projectId');
  if (!appId) missing.push('VITE_FIREBASE_APP_ID / appId');

  if (missing.length > 0 && (import.meta as any).env.DEV) {
    console.warn(
      `⚠️ Environment validation notice — Missing: ${missing.join(', ')}\n` +
      'Please ensure you configure secrets and environment settings.'
    );
  }
}

// Key masking for any logging:
export function maskSecret(secret: string | null | undefined): string {
  if (!secret) return '***';
  if (secret.length < 8) return '***';
  return secret.slice(0, 4) + '***' + secret.slice(-4);
}

// Security key safety getter
export function getGeminiKey(): string {
  const key = (import.meta as any).env.VITE_GEMINI_API_KEY || safeStorage.getItem('deadlineai_user_gemini_key');
  if (!key) throw new Error('Gemini API key not configured');
  return key;
}
