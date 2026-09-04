# Chrome Extension Playground

A clean Google Chrome Extension (Manifest V3) playground designed to test CRUD operations, content scripts, storage persistence, and API communication with the TaskFlow CRM Spring Boot backend.

---

## 📁 Directory Structure

```
chrome-extension/
├── manifest.json              # Chrome Manifest V3 configuration & permissions
├── package.json               # Node metadata & validation/test scripts
├── README.md                  # Development & manual loading guide
├── icons/                     # Extension icons (16x16, 48x48, 128x128 PNGs)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── test/
│   └── validate-extension.js  # Node.js automated structure & schema validator
└── src/
    ├── popup/                 # Action popup UI
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    ├── background/            # Background service worker (Event dispatcher)
    │   └── background.js
    ├── content/               # Content script injected into web pages
    │   ├── contentScript.js
    │   └── contentStyle.css
    ├── options/               # Extension settings page
    │   ├── options.html
    │   ├── options.css
    │   └── options.js
    ├── services/              # CRM API communication layer
    │   ├── crmApi.js
    │   └── crmService.js
    ├── storage/               # chrome.storage.local abstraction layer
    │   ├── extensionStorage.js
    │   └── storageService.js
    └── utils/                 # Diagnostic logger
        └── logger.js
```

---

## 🚀 How to Load the Unpacked Extension in Google Chrome

1. Open Google Chrome.
2. Navigate to:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the `chrome-extension/` directory from this repository:
   ```
   <project-root>/chrome-extension
   ```
6. The extension **"Chrome Extension Playground"** will now appear in your list of extensions.
7. Click the extensions puzzle icon in your Chrome toolbar and pin **Chrome Extension Playground** for easy access.

---

## 📋 10-Step Manual Testing Checklist

| Step | Action | Expected Result |
|---|---|---|
| **1. Extension Loading** | Load unpacked folder in `chrome://extensions` | Card loads without manifest errors; Version `1.0.0` is displayed. |
| **2. Background Worker** | Click `service worker` link on extension card | DevTools console opens and displays `[CRM-Extension] Background Service Worker initialized.` |
| **3. Popup Launch** | Click extension icon in Chrome toolbar | Popup opens displaying **Chrome Extension Playground**, `READY` status badge, and diagnostic section. |
| **4. CRM Check (Offline)** | Stop Spring Boot backend, then click `[Check CRM Connection]` | CRM badge displays `DISCONNECTED` (red), telemetry logs network error, extension does not crash. |
| **5. CRM Check (Online)** | Start Spring Boot backend (`http://localhost:8080`), click `[Check CRM Connection]` | CRM badge updates to `CONNECTED` (green), telemetry logs HTTP `200 OK` and roundtrip latency. |
| **6. Run Diagnostics (Full)** | Click `[Run Diagnostics]` button | All 5 checks execute and report badges: `Extension` (PASS), `Service Worker` (PASS), `Storage` (PASS), `Content Script` (PASS), `CRM API` (PASS/FAIL depending on backend). |
| **7. Storage Persistence** | Inspect storage via diagnostics or options | `chrome.storage.local` saves and retrieves data safely without `chrome.runtime.lastError`. |
| **8. Content Script Injection** | Open any normal web tab (e.g., `https://example.com`), then run diagnostics | Content script receives message, displays floating notification badge on web page, returns page URL & title. |
| **9. Restricted URL Safety** | Open `chrome://extensions` or `about:blank`, run diagnostics | Content script check handles restricted system pages gracefully without unhandled exceptions. |
| **10. Options & Auth Token** | Click `⚙️ Settings & Options`, configure CRM URL and JWT Bearer token | Settings persist to `extensionStorage` and are used for authenticated CRM API calls. |

---

## 📡 Message Passing Protocol

All inter-component communication is mediated asynchronously via `chrome.runtime.sendMessage`:

* `GET_EXTENSION_STATUS`: Returns extension manifest details, readiness status, and runtime timestamp.
* `RUN_DIAGNOSTIC`: Triggers the 5-point diagnostic suite and returns structured `{ extension, serviceWorker, storage, contentScript, crmApi }` statuses (`PASS` / `FAIL`).
* `GET_STORAGE_STATUS`: Verifies local storage read/write and returns current extension settings.
* `PING_CRM`: Checks HTTP connectivity to the Spring Boot CRM backend (`/actuator/health`).

---

## 🔒 Security Architecture Note

* **Zero Hard-Coded Secrets:** This extension contains **no** private API keys, database passwords, or hard-coded auth tokens in its source bundle.
* All privileged calls to `/api/workspaces/{workspaceId}/*` dynamically attach the user-provided Bearer token stored securely in `chrome.storage.local` (sandboxed to this extension ID).
