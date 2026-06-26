interface RateLimiterResult {
  allowed: boolean;
  retryAfter?: number;
}

class RateLimiter {
  private requests: Map<string, number[]>;

  constructor() {
    this.requests = new Map<string, number[]>();
  }
  
  check(action: string, maxRequests: number, windowMs: number): RateLimiterResult {
    const now = Date.now();
    const key = action;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const previousRequests = this.requests.get(key) || [];
    
    // Remove old requests outside window
    const requests = previousRequests.filter(
      time => now - time < windowMs
    );
    
    if (requests.length >= maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil(
          (requests[0] + windowMs - now) / 1000
        ),
      };
    }
    
    requests.push(now);
    this.requests.set(key, requests);
    return { allowed: true };
  }
}

export const rateLimiter = new RateLimiter();

// Simple state to track the last timestamp of a Gemini call to block rapid-fire submissions
let lastGeminiCallTime = 0;

/**
 * Checks if the request is a rapid-fire call (less than the specified interval).
 * Returns true if it is a rapid-fire call (and should be blocked), false otherwise.
 */
export function isRapidFireGeminiCall(minIntervalMs: number = 1500): boolean {
  const now = Date.now();
  const elapsed = now - lastGeminiCallTime;
  if (elapsed < minIntervalMs) {
    return true; // Yes, rapid-fire!
  }
  lastGeminiCallTime = now;
  return false; // Safe to call
}

// Rate limits for each action:
export const RATE_LIMITS = {
  // Max 10 Gemini calls per minute
  geminiCall: () => rateLimiter.check('gemini', 10, 60000),
  
  // Max 5 tasks created per minute  
  createTask: () => rateLimiter.check('createTask', 5, 60000),
  
  // Max 20 chat messages per minute
  chatMessage: () => rateLimiter.check('chat', 20, 60000),
  
  // Max 3 calendar syncs per hour
  calendarSync: () => rateLimiter.check('calendar', 3, 3600000),
  
  // Max 30 Firestore writes per minute
  firestoreWrite: () => rateLimiter.check('firestore', 30, 60000),
};
