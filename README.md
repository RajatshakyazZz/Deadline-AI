# 🚨 DeadlineAI — The Last-Minute Life Saver

<p align="center">
  <img src="public/icon-512.png" alt="DeadlineAI Logo" width="128" height="128" referrerPolicy="no-referrer" />
</p>

<p align="center">
  <strong>An AI-powered, high-stakes productivity suite designed to rescue your grades, milestones, and sanity when the clock is ticking.</strong>
</p>

<p align="center">
  <a href="https://github.com/RajatshakyazZz/deadline-ai"><img src="https://img.shields.io/badge/Release-v1.0.0-blueviolet?style=for-the-badge" alt="Release Version"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS v4"></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase Support"></a>
</p>

---

## 📖 Introduction

**DeadlineAI** is a full-stack, server-side-safe productivity application built with React 19, Tailwind CSS v4, Express, and Google's Gemini API. It is tailored for high-pressure situations, providing real-time crisis plans, habit monitoring, interactive focus spaces, and a companion chat companion. 

Unlike standard productivity tools that assume perfect organization, DeadlineAI specializes in **triage and emergency execution** — transforming overwhelming lists into clear, time-sensitive checklists when deadlines loom.

---

## 🌟 Core Features

### 1. 🚨 Crisis Zone & Crisis Console
*   **Automatic Triage**: Triggers automatically when tasks are due in **under 3 hours**.
*   **Tactical Survival Plans**: Generates an instantaneous emergency plan powered by Gemini AI to tell you exactly what core objectives to complete, what optional features to cut, and how to stay motivated.
*   **Liquid-Glass Interface**: Locks into an emergency red-pulsing glass dashboard, stripping away secondary visual clutter to keep you 100% focused on execution.

### 2. 🔮 Aria: The Context-Aware Chat Companion (AI CHAT BOT)
*   **Floating Interactive Orb**: Accessible via a distinctive floating interactive particle orb labelled **AI CHAT BOT** in the bottom-right corner.
*   **Dynamic Response Engine**: Seamlessly tracks your active workspace, deadlines, and current emotional stress levels to provide contextual help, task advice, or motivational tough-love.
*   **Secure API Requests**: Proxied safely through server-side endpoints to keep the Gemini API key 100% hidden from client-side network inspectors.

### 3. ⏱️ Focus Space (Pomodoro Mode)
*   **Audio Synthesis**: Implements high-quality, lightweight custom synthesizers using the Web Audio API to play real-time ambient noise, focus waves, or alert sounds.
*   **Fluid Visuals**: Integrated with canvas-based visualizer particles that respond dynamically to timer states.

### 4. 📈 Streak-Building Habit Tracker
*   **Daily Checklists**: Keeps track of daily routines alongside your long-term deadlines.
*   **Streak Protection**: Generates daily motivational checks to encourage persistence and consistency.

### 5. 🔔 Smart Notifications Center
*   **Proactive Alerts**: Triggers warnings when deadlines approach (e.g., 24-hour, 12-hour, and the 3-hour "Crisis Zone" thresholds).
*   **Custom Dispatcher**: Includes an administrative test bench to dispatch sample notifications, verify support, and toggle alerts.

---

## 🛠️ Architecture & Tech Stack

```
                                  +---------------------------------------+
                                  |            CLIENT BROWSER             |
                                  |                                       |
                                  |  +---------------------------------+  |
                                  |  |        React 19 Frontend        |  |
                                  |  |   (Tailwind v4, Framer Motion)  |  |
                                  |  +----------------+----------------+  |
                                  +-------------------|-------------------+
                                                      |
                                                      |   Secure Proxy Requests
                                                      v   (XSS & CSRF Protected)
                                  +-------------------|-------------------+
                                  |      EXPRESS NODE.JS SERVER (ESM)     |
                                  |                                       |
                                  |  +---------------------------------+  |
                                  |  |  Secure API Proxy (/api/*)      |  |
                                  |  |  - Validates cryptographic sigs |  |
                                  |  |  - Generates Gemini AI content   |  |
                                  |  +----------------+----------------+  |
                                  +-------------------|-------------------+
                                                      |
                                     +----------------+----------------+
                                     |                                 |
                                     v                                 v
                     +-------------------------------+ +-------------------------------+
                     |          GEMINI API           | |       FIREBASE PLATFORM       |
                     |  (Server-Side SDK v2.4.0)     | |  (Firestore & Authentication) |
                     +-------------------------------+ +-------------------------------+
```

*   **Frontend**: React 19 (Vite), Tailwind CSS v4, `motion/react` for high-performance fluid animations, and Lucide Icons.
*   **Backend**: Custom Express proxy server compiled dynamically to ESM/CJS utilizing `esbuild` for maximum execution speed on server-side nodes.
*   **AI Integration**: Dynamic invocation of Gemini utilizing the newest `@google/genai` TypeScript SDK.
*   **Persistence**: Double-guarded Client-Server layout. Uses safe wrapper local storage adapters to bypass SecurityErrors inside sandboxed `iframe` environments, synced with durable cloud persistence in Google Firestore.

---

## 📂 Project Structure

```
.
├── .env.example             # Example environment configuration
├── firebase-applet-config.json # Firebase project identifiers
├── firestore.rules          # Secure Firebase access permissions
├── index.html               # Main index HTML template
├── metadata.json            # AI Studio applet specifications
├── package.json             # Scripts & workspace dependency configurations
├── server.ts                # Custom full-stack Express server
├── tsconfig.json            # Strict TypeScript compilation guidelines
├── vite.config.ts           # Vite Bundling + Tailwind V4 plugins
├── src/
│   ├── main.tsx             # Frontend bootstrap & iframe safety checks
│   ├── App.tsx              # Routing and primary view setup
│   ├── index.css            # Global variables, themes, and liquid glass styling
│   ├── types.ts             # Shared structured TypeScript types
│   ├── components/          # Shared layout & reusable widgets
│   │   ├── AddTaskModal.tsx
│   │   ├── CrisisModal.tsx  # Dynamic crisis plan solver UI
│   │   ├── Layout.tsx       # Primary workspace housing (Sidebar, Header)
│   │   ├── ParticleBackground.tsx # High-performance canvas visualizer
│   │   ├── SettingsModal.tsx
│   │   ├── Toast.tsx        # Styled toast notifications
│   │   ├── chatbot/         # Aria chatbot companion modules
│   │   │   ├── AriaChat.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   └── QuickReplies.tsx
│   │   └── notifications/   # Custom alerts and modals
│   ├── hooks/               # Custom lifecycle and utility hooks
│   │   ├── useDeadlineMonitor.ts
│   │   ├── useNotifications.ts
│   │   └── useToast.ts
│   ├── pages/               # Primary viewport routers
│   │   ├── AIBriefing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── FocusMode.tsx
│   │   ├── Habits.tsx
│   │   ├── MyTasks.tsx
│   │   └── Notifications.tsx
│   ├── services/            # Client-side backend connectivity logic
│   │   ├── firebase.ts      # Double-guarded Auth persistent modules
│   │   ├── gemini.ts        # Client-side gateway calling server endpoints
│   │   └── messaging.ts     # dynamic notifications engine
│   └── utils/               # Auxiliary sound, security, and storage tools
│       ├── clipboardSecurity.ts
│       ├── csrf.ts
│       ├── notificationSound.ts # Web Audio API sound synthesizers
│       ├── secureRequest.ts     # Verification signature generator
│       └── storage.ts           # Safe iframe-protected localStorage
```

---

## ⚙️ Setup & Installation

### Prerequisites
Make sure you have Node.js (version 18 or above) and `npm` installed.

### 1. Clone the repository
```bash
git clone https://github.com/RajatshakyazZz/deadline-ai.git
cd deadline-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (using `.env.example` as a guideline) and specify your keys:
```env
# Server secret key (Never exposed to the client browser)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_optional_vapid_key
```

### 4. Running the Development Server
This boots the full-stack development workspace on port `3000` utilizing TypeScript execution (`tsx`):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 5. Compiling & Building for Production
The production build compiles the React static workspace and bundles the custom Express TypeScript backend into a unified CJS module using `esbuild`:
```bash
npm run build
```

This generates:
*   A fully compiled static frontend in `/dist`
*   A lightweight, self-contained server script in `/dist/server.cjs`

### 6. Starting the Production Server
```bash
npm run start
```

---

## 🔒 Security & Sandboxing Protection
To maintain reliability inside nested visual containers (such as iframe previews or sandboxed environments), DeadlineAI includes robust technical safeguards:
*   **Safe Storage Wrapper**: Auto-detects cross-origin limits and falls back to ephemeral states to prevent `SecurityError: The operation is insecure` failures.
*   **Dynamically Loaded SDKs**: Dynamically imports the Firebase messaging suite to allow seamless offline operations even when browser features like notifications, service workers, or indexedDB are disabled or blocked by container parent headers.
*   **Encrypted Signature Protocol**: Uses local salt signatures for safe message handshakes, guaranteeing zero cross-origin vulnerabilities.

---

## 📄 License
This project is licensed under the MIT License. Feel free to clone, modify, and improve it to help you survive your deadlines! 🚀
