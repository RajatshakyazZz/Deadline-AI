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
      const prefSnap = await dbAdmin.doc(`users/${userId}/notification_preferences/settings`).get();
      if (prefSnap.exists) {
        const prefs = prefSnap.data();
        if (category && prefs && prefs[category] === false) {
          console.log(`Notification skipped for user ${userId} because category ${category} is disabled.`);
          return res.json({ success: true, skipped: true, reason: 'preference_disabled' });
        }
      }

      // 2. Retrieve all FCM tokens for the user
      const tokensSnap = await dbAdmin.collection(`users/${userId}/fcm_tokens`).get();
      if (tokensSnap.empty) {
        return res.status(404).json({ error: 'No device tokens found for this user.' });
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
          await dbAdmin.doc(`users/${userId}/fcm_tokens/${token}`).delete();
        }
      }

      return res.json({ 
        success: true, 
        results, 
        cleanedUpTokensCount: invalidTokens.length 
      });

    } catch (err: any) {
      console.error('Error in send-test notification route:', err);
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
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production build from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
