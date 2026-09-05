# Chrome Extension Browser Automation Playground (Phase 6A)

A standalone Node.js and Playwright-based test automation runner for testing the unpacked **Manifest V3 Chrome Extension** in Chromium.

---

## 1. Requirements

- **Node.js**: `v18.x` or `v20.x` (verified with `v20.15.0`)
- **npm**: `v9.x` or `v10.x` (verified with `10.7.0`)
- **Operating System**: Windows, macOS, or Linux
- **Playwright**: `@playwright/test` v1.47+

---

## 2. Setup & Installation

Navigate into the runner directory:

```bash
cd extension-runner
```

Install dependencies:

```bash
npm install
```

Install the required Chromium browser binary:

```bash
npx playwright install chromium
```

---

## 3. Extension Path Configuration

The runner resolves the target Chrome extension directory via configuration in `src/config.js` or via the `EXTENSION_PATH` environment variable.

By default, it automatically resolves to the sibling folder:
```
../chrome-extension
```

To specify a custom path:
```bash
# Windows PowerShell
$env:EXTENSION_PATH = "C:\custom\path\to\chrome-extension"
npm test

# Linux / macOS
EXTENSION_PATH=/custom/path/to/chrome-extension npm test
```

---

## 4. Execution Modes

### Headless Execution (Default)
In modern Chromium, extensions can run with `--headless=new`:

```bash
npm test
```

### Headed Execution (Visible Browser)
To watch the browser window interact with the popup and content script:

```bash
npm run test:headed
```

### Programmatic Standalone Runner
Run directly with Node without the Playwright test runner wrapper:

```bash
npm run test:runner
```

---

## 5. Automated Test Cases

The test suite in `tests/extension.smoke.spec.js` executes 8 verification steps:

| Test | Objective | Verification Method |
|---|---|---|
| **TEST 1** | Starts Chromium | Verifies persistent browser context launch with custom flags |
| **TEST 2** | MV3 Extension Loading | Validates `manifest.json` schema and version 3 |
| **TEST 3** | Extension ID Discovery | Dynamically discovers runtime `chrome-extension://<id>` |
| **TEST 4** | Popup Page & DOM | Verifies `#ext-version`, `#ext-status-badge`, action buttons |
| **TEST 5** | Content Script Injection | Tests injection on controlled local HTTP test page |
| **TEST 6** | Background Service Worker | Verifies worker is active, responds to manifest inspection |
| **TEST 7** | Chrome Storage Read/Write | Verifies `chrome.storage.local.set` and `.get` roundtrip |
| **TEST 8** | Clean Browser Shutdown | Ensures browser context terminates without orphaned processes |

---

## 6. Test Output & Artifacts Location

Test traces, error screenshots, and failure logs are output to:
```
extension-runner/test-results/
```
*(This folder is ignored by git).*

---

## 7. Troubleshooting

- **Service Worker Detection Timeout**: If the service worker is slow to register on cold boot, ensure `browserTimeout` is set to at least `30000` ms.
- **Port Conflict**: If the default test port `8899` is occupied, specify `TEST_PORT=9099 npm test`.
- **Headless Mode Glitches**: If extension pages fail to render in older Chromium environments, use headed mode: `npm run test:headed`.
