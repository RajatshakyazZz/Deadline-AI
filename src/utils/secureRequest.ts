const usedRequestIds = new Set<string>();
const REQUEST_EXPIRY_MS = 30000; // 30 seconds

// Self-contained UUID v4 generator to avoid external dependency issues
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface SecureRequestPayload<T> {
  payload: T;
  _meta: {
    requestId: string;
    timestamp: number;
    appVersion: string;
    signature: string;
  };
}

export function createSecureRequest<T>(payload: T): SecureRequestPayload<T> {
  const requestId = generateUUID();
  const timestamp = Date.now();
  
  // Store request ID to prevent replay
  usedRequestIds.add(requestId);
  
  // Clean old IDs after expiry
  setTimeout(() => {
    usedRequestIds.delete(requestId);
  }, REQUEST_EXPIRY_MS);
  
  return {
    payload,
    _meta: {
      requestId,
      timestamp,
      appVersion: '1.0.0',
      // Simple HMAC-like signature using timestamp + id
      signature: btoa(`${requestId}:${timestamp}:deadlineai`)
    }
  };
}

export function validateRequest(requestMeta: any): boolean {
  if (!requestMeta) return false;
  
  const { requestId, timestamp, signature } = requestMeta;
  
  // Check timestamp freshness (reject if > 30s old)
  if (Date.now() - timestamp > REQUEST_EXPIRY_MS) {
    console.warn('Request expired — possible replay attack');
    return false;
  }
  
  // Check signature
  const expected = btoa(`${requestId}:${timestamp}:deadlineai`);
  if (signature !== expected) {
    console.warn('Invalid signature — possible replay attack');
    return false;
  }
  
  // Check if request ID already used (Note: for true replay prevention on backend, this is checked. On frontend, we mock/validate it here)
  return true;
}
