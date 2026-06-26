import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateEnvironment } from './utils/envCheck.ts';
import { SecurityStatus } from './components/SecurityStatus.tsx';

// 1. Frame-busting Javascript for clickjacking protection, allowing local/preview iframe hosts safely
if (window.self !== window.top) {
  const isAllowedHost = 
    window.location.hostname.includes('run.app') || 
    window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('127.0.0.1');
  if (!isAllowedHost && window.top) {
    window.top.location.href = window.self.location.href;
  }
}

// 2. Validate all critical environment variables on startup
try {
  validateEnvironment();
} catch (e: any) {
  console.error('Environment validation error:', e.message);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SecurityStatus />
  </StrictMode>,
);
