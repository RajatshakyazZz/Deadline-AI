import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK using modern modular imports
const setupFirebaseAdmin = () => {
  if (getApps().length > 0) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const credentials = JSON.parse(serviceAccountJson);
      initializeApp({
        credential: cert(credentials),
        projectId: credentials.project_id
      });
      console.log('Firebase Admin initialized with service account from env.');
      return;
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON from env, attempting default credentials:', err);
    }
  }

  // Fallback to local service account file if it exists
  const localKeyPath = path.join(process.cwd(), 'firebase-service-account.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      const credentials = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      initializeApp({
        credential: cert(credentials),
        projectId: credentials.project_id
      });
      console.log('Firebase Admin initialized with local key file.');
      return;
    } catch (err) {
      console.error('Failed to initialize Firebase Admin with local key file:', err);
    }
  }

  // Final fallback to Application Default Credentials
  try {
    initializeApp();
    console.log('Firebase Admin initialized with Application Default Credentials.');
  } catch (err) {
    console.warn('Firebase Admin failed to initialize. Push notifications will run in mock/local mode until a service account is configured.');
  }
};

setupFirebaseAdmin();

// Dynamically generate .env file for Vite at startup based on system/container environment variables
const envFilePath = path.join(process.cwd(), '.env');
const envVars = {
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  VITE_FIREBASE_DATABASE_ID: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID,
  VITE_FIREBASE_VAPID_KEY: process.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY,
  VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
};

const envContent = Object.entries(envVars)
  .filter(([_, value]) => value !== undefined && value !== null)
  .map(([key, value]) => `${key}="${value}"`)
  .join('\n');

if (envContent) {
  try {
    fs.writeFileSync(envFilePath, envContent, 'utf8');
    console.log('Successfully generated .env file from environment secrets.');
  } catch (err) {
    console.error('Failed to write .env file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', firebaseAdminReady: getApps().length > 0 });
  });

  // Secure FCM Notification Dispatch Endpoint
  app.post('/api/notifications/send-test', async (req, res) => {
    const { userId, title, body, category } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (getApps().length === 0) {
      console.warn('Firebase Admin SDK not initialized. Simulating send on backend...');
      return res.json({ 
        success: true, 
        simulated: true, 
        message: 'Firebase Admin not initialized. Setup FIREBASE_SERVICE_ACCOUNT_JSON in environment secrets.' 
      });
    }

    try {
      const dbAdmin = getFirestore();
      
      // 1. Check user notification preferences first
      try {
        const prefSnap = await dbAdmin.doc(`users/${userId}/notification_preferences/settings`).get();
        if (prefSnap.exists) {
          const prefs = prefSnap.data();
          if (category && prefs && prefs[category] === false) {
            console.log(`Notification skipped for user ${userId} because category ${category} is disabled.`);
            return res.json({ success: true, skipped: true, reason: 'preference_disabled' });
          }
        }
      } catch (dbErr: any) {
        console.warn('Firestore not ready or permission denied. Simulating notification fallback...', dbErr.message);
        return res.json({
          success: true,
          simulated: true,
          message: `Firestore not fully ready or enabled in GCP project. Simulated: ${title} - ${body}`
        });
      }

      // 2. Retrieve all FCM tokens for the user
      let tokensSnap;
      try {
        tokensSnap = await dbAdmin.collection(`users/${userId}/fcm_tokens`).get();
      } catch (dbErr: any) {
        console.warn('Error reading tokens from Firestore. Simulating fallback...', dbErr.message);
        return res.json({
          success: true,
          simulated: true,
          message: `FCM collections not enabled or readable. Simulated: ${title} - ${body}`
        });
      }

      if (tokensSnap.empty) {
        console.log(`No registered device tokens found for user ${userId}, returning simulated success.`);
        return res.json({
          success: true,
          simulated: true,
          message: 'No device tokens found. Notification simulated successfully!'
        });
      }

      const tokens: string[] = [];
      tokensSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.token) {
          tokens.push(data.token);
        }
      });

      console.log(`Sending to ${tokens.length} tokens for user ${userId}`);

      const results = [];
      const invalidTokens: string[] = [];
      const messagingAdmin = getMessaging();

      // Send to each token
      for (const token of tokens) {
        try {
          const message = {
            notification: {
              title,
              body,
            },
            data: {
              click_action: category === 'habits' ? '/habits' : '/tasks',
              tag: 'deadlineai-notification',
              category: category || 'system'
            },
            token: token,
          };

          const response = await messagingAdmin.send(message);
          results.push({ token, success: true, messageId: response });
        } catch (err: any) {
          console.error(`Failed to send to token ${token}:`, err);
          results.push({ token, success: false, error: err.message });

          // Clean up invalid or expired tokens automatically
          if (
            err.code === 'messaging/invalid-registration-token' ||
            err.code === 'messaging/registration-token-not-registered' ||
            err.message?.includes('Requested entity was not found')
          ) {
            invalidTokens.push(token);
          }
        }
      }

      // Remove invalid/expired tokens automatically
      if (invalidTokens.length > 0) {
        console.log(`Cleaning up ${invalidTokens.length} invalid tokens...`);
        for (const token of invalidTokens) {
          try {
            await dbAdmin.doc(`users/${userId}/fcm_tokens/${token}`).delete();
          } catch (dbErr) {
            console.warn(`Could not delete invalid token from Firestore:`, dbErr);
          }
        }
      }

      return res.json({ 
        success: true, 
        results, 
        cleanedUpTokensCount: invalidTokens.length 
      });

    } catch (err: any) {
      console.error('Error in send-test notification route:', err);
      // Even in case of general errors, let's gracefully return simulated if it's permission issues
      if (err.message && (err.message.includes('PERMISSION_DENIED') || err.message.includes('Firestore API'))) {
        return res.json({
          success: true,
          simulated: true,
          message: 'Firestore API not enabled. Simulated notification fallback.'
        });
      }
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        const runtimeConfig = {
          VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
          VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
          VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
          VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '',
          VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
          VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
          VITE_FIREBASE_DATABASE_ID: process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || '',
          VITE_FIREBASE_VAPID_KEY: process.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || '',
          VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
        };
        const scriptTag = `<script>window.__RUNTIME_CONFIG__ = ${JSON.stringify(runtimeConfig)};</script>`;
        html = html.replace('<head>', `<head>${scriptTag}`);
        res.send(html);
      } else {
        res.status(404).send('Not Found');
      }
    });
    console.log('Serving production build with runtime configuration injection from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
