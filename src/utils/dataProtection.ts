// Fields that must NEVER be logged or exposed
const SENSITIVE_FIELDS = [
  'apiKey', 'token', 'password', 'secret',
  'accessToken', 'refreshToken', 'idToken',
  'VITE_GEMINI_API_KEY', 'VITE_FIREBASE_API_KEY'
];

export function safeLog(...args: any[]): void {
  const isProd = (import.meta as any).env.PROD;
  if (isProd) return; // No logs in production
  
  const sanitized = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    return arg;
  });
  
  console.log(...sanitized);
}

function sanitizeObject(obj: any): any {
  const safe = { ...obj };
  SENSITIVE_FIELDS.forEach(field => {
    if (field in safe) {
      safe[field] = '***REDACTED***';
    }
  });
  return safe;
}

// Disable ALL console.* in production:
const isProd = (import.meta as any).env.PROD;
if (isProd) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
}
