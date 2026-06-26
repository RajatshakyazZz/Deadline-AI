import React from 'react';

// HTML entity encoding
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize for display in DOM
export function sanitizeForDisplay(text: string | null | undefined): string {
  if (!text) return '';
  
  // Escape HTML entities
  let safe = escapeHtml(String(text));
  
  // Remove zero-width characters (used in steganography attacks)
  safe = safe.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Limit length
  safe = safe.slice(0, 10000);
  
  return safe;
}

// Safe markdown renderer (for Aria chat messages)
export function safeMarkdown(text: string): string {
  let safe = sanitizeForDisplay(text);
  
  // Only allow safe markdown conversions
  // Bold: **text**
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Code: `text`
  safe = safe.replace(/`([^`]+)`/g, 
    '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">$1</code>');
  // Line breaks
  safe = safe.replace(/\n/g, '<br/>');
  
  return safe;
}

interface SafeHTMLProps {
  content: string;
  className?: string;
}

// SafeHTML component for rendering safe user input in DOM
export function SafeHTML({ content, className }: SafeHTMLProps) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: safeMarkdown(content)
      }}
    />
  );
}
