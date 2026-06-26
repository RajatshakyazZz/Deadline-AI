// Generate CSRF token on app load
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Store in memory (not localStorage — XSS safe)
let csrfToken = generateCSRFToken();

export function getCSRFToken(): string {
  return csrfToken;
}

export function rotateCSRFToken(): string {
  csrfToken = generateCSRFToken();
  return csrfToken;
}

// Add to all custom fetch calls:
export function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': getCSRFToken(),
      'X-Requested-With': 'XMLHttpRequest',
    }
  });
}
