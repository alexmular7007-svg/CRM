# TaskFlow CRM - Quick Task Manager (Chrome Extension)

A lightweight Google Chrome Extension (Manifest V3) built to manage tasks, assign work, and track activity alongside the TaskFlow CRM web application.

---

## 📁 Clean Extension Architecture

```
chrome-extension/
│
├── manifest.json              # Clean Manifest V3 definition & permissions
├── README.md                  # Architecture & loading guide
│
├── src/
│   ├── popup/
│   │   ├── popup.html         # Compact Quick Task Manager popup UI
│   │   ├── popup.css          # Professional white/blue CRM styling
│   │   └── popup.js           # Popup controller & DOM interactions
│   │
│   ├── background/
│   │   └── background.js      # Background service worker message router
│   │
│   ├── content/
│   │   └── content.js         # Minimal content script (coexists with CRM site)
│   │
│   └── services/
│       └── crmApi.js          # Clean REST API client (CRUD & analytics)
│
├── icons/                     # Extension icons (16x16, 48x48, 128x128 PNGs)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
└── test/
    └── validate-extension.js  # Automated Phase 1, 2, & 3 validator
```

---

## 🎓 Learning Phases Implemented

### Phase 1 — Hello World
- Valid Manifest V3 configuration.
- Popup window opens and displays greeting: **"Hello from TaskFlow!"**.
- Background service worker responds to `HELLO_WORLD` message.

### Phase 2 — CRUD API Demo
- Communication Flow: `popup.js` ➔ `background.js` ➔ `crmApi.js` ➔ REST API.
- Supports complete CRUD operations:
  - **GET**: Lists workspace tasks (`/api/tasks?workspaceId=...`)
  - **POST**: Creates / assigns tasks (`/api/tasks`)
  - **PATCH**: Updates task status between TODO and COMPLETE (`/api/tasks/{id}/status`)
  - **DELETE**: Removes tasks (`/api/tasks/{id}`)

### Phase 3 — Real CRM Integration
- Direct integration with existing Spring Boot backend REST APIs.
- Real Task Assignment with live workspace members (`/api/workspaces/{id}/members`).
- Multi-tenant Workspace Isolation: switching workspaces immediately clears stale tasks and loads only scoped data.
- Compact Recent Activity stream (`/api/analytics/recent?workspaceId=...`).
- Zero direct database connections; all communication flows via authenticated REST APIs.

---

## 🚀 How to Load the Unpacked Extension

1. Open Google Chrome.
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `chrome-extension/` directory.
5. Click the puzzle icon in Chrome and pin **TaskFlow CRM - Quick Task Manager**.
