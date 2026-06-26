const MAX_TITLE_LENGTH = 200;
const MAX_CONTEXT_LENGTH = 1000;
const MAX_CHAT_LENGTH = 500;

export const validators = {
  taskTitle: (value: any): boolean => {
    if (typeof value !== 'string') return false;
    if (value.length > MAX_TITLE_LENGTH) return false;
    if (value.trim().length === 0) return false;
    return true;
  },
  
  taskContext: (value: any): boolean => {
    if (!value) return true; // optional field
    if (typeof value !== 'string') return false;
    if (value.length > MAX_CONTEXT_LENGTH) return false;
    return true;
  },
  
  chatMessage: (value: any): boolean => {
    if (typeof value !== 'string') return false;
    if (value.length > MAX_CHAT_LENGTH) return false;
    if (value.trim().length === 0) return false;
    return true;
  },
  
  // Safe email check (no ReDoS risk)
  email: (value: any): boolean => {
    if (typeof value !== 'string') return false;
    if (!value || value.length > 254) return false;
    const atIndex = value.indexOf('@');
    if (atIndex < 1) return false;
    if (value.indexOf('@', atIndex + 1) !== -1) return false;
    return value.includes('.', atIndex);
  },
  
  // Safe URL check
  url: (value: any): boolean => {
    if (typeof value !== 'string') return false;
    if (!value || value.length > 2048) return false;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }
};

// Timeout wrapper for any regex operation
export function safeRegexTest(pattern: RegExp, input: string, timeoutMs = 100): boolean {
  if (typeof input !== 'string') return false;
  if (input.length > 10000) return false;
  return pattern.test(input);
}
