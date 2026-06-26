import React from 'react';

// Dangerous patterns to detect
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,           // onclick=, onload=, etc.
  /data:text\/html/gi,
  /vbscript:/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /eval\s*\(/gi,
  /document\.cookie/gi,
  /window\.location/gi,
  /localStorage\./gi,
  /__proto__/gi,
  /constructor\[/gi,
];

export function sanitizeClipboardInput(text: string): string {
  if (typeof text !== 'string') return '';
  
  let sanitized = text;
  
  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[removed]');
  });
  
  // Limit length (prevent LPDoS via paste)
  sanitized = sanitized.slice(0, 5000);
  
  // Strip null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
}

// Add paste event listener to ALL input fields
export function secureInputField(inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) {
  if (!inputRef || !inputRef.current) return;
  
  const element = inputRef.current;
  
  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData('text/plain') || '';
    const safe = sanitizeClipboardInput(pasted);
    
    // Insert at cursor position
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const current = element.value;
    element.value = current.slice(0, start) + safe + current.slice(end);
    
    // Trigger React onChange
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;
    
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, element.value);
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
  };

  element.addEventListener('paste', handlePaste);
  
  return () => {
    element.removeEventListener('paste', handlePaste);
  };
}
