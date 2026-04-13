---
plan: 03
phase: 1
wave: 2
title: Create popup and all stub files
depends_on: [01]
files_modified:
  - popup.html
  - popup.js
  - background.js
  - offscreen.html
  - offscreen.js
  - content.js
autonomous: true
requirements_addressed: [CONF-04]
---

# Plan 03: Create Popup and Stub Files

## Objective

Create the minimal info popup (HTML + JS showing extension name + active/inactive status) and all required stub files that `manifest.json` references: `background.js`, `offscreen.html`, `offscreen.js`, `content.js`. After this plan, the extension loads in Chrome with zero errors and the popup opens to show its status display.

> **CONF-04 implementation:** The original requirement was "show error if keys not configured." Since keys are hardcoded in `config.js`, CONF-04 is fulfilled by the popup indicating whether the extension is active (keys are present and the service worker is running) or inactive.

## Context

<read_first>
- `.planning/phases/01-extension-scaffold/01-PLAN.md` — manifest.json must exist before this plan is tested (wave 1 dependency)
- `.planning/phases/01-extension-scaffold/01-CONTEXT.md` — Popup decision: "extension name + active/inactive status only", flat file structure
- `.planning/research/ARCHITECTURE.md` — MV3 service worker lifecycle, offscreen document pattern, content script role
- `.planning/research/PITFALLS.md` §2 — Service worker termination: stub must not prevent SW from starting
</read_first>

## Action

### 1. Create `popup.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audio AI Assistant</title>
  <style>
    body {
      width: 220px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      background: #1a1a2e;
      color: #e0e0e0;
    }
    h1 {
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 10px;
      color: #ffffff;
      letter-spacing: 0.3px;
    }
    #status {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: #a0a0b0;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #555;
    }
    .dot.active {
      background: #4ade80;
    }
  </style>
</head>
<body>
  <h1>Audio AI Assistant</h1>
  <div id="status">
    <span class="dot" id="dot"></span>
    <span id="status-text">Checking...</span>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

### 2. Create `popup.js`

```js
// popup.js — reads extension status from service worker

document.addEventListener('DOMContentLoaded', () => {
  const dot = document.getElementById('dot');
  const statusText = document.getElementById('status-text');

  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      // Service worker not running
      statusText.textContent = 'Inactive';
      return;
    }
    if (response && response.active) {
      dot.classList.add('active');
      statusText.textContent = 'Active — capturing audio';
    } else {
      statusText.textContent = 'Inactive';
    }
  });
});
```

### 3. Create `background.js` (Service Worker stub)

```js
// background.js — Service Worker (MV3)
// Phase 1: Stub only. Full audio capture pipeline added in Phase 2.

// Handle status requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    sendResponse({ active: false }); // Phase 2 will update this
    return true; // Keep message channel open for async response
  }
});

console.log('[AudioAI] Service worker started');
```

### 4. Create `offscreen.html`

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <!-- Offscreen document for audio processing (Phase 2) -->
  <!-- AudioContext, AudioWorklet, and getUserMedia run here -->
  <script src="offscreen.js"></script>
</body>
</html>
```

### 5. Create `offscreen.js` (stub)

```js
// offscreen.js — Offscreen Document
// Phase 1: Stub only.
// Phase 2: AudioContext + AudioWorklet + Deepgram WebSocket will be added here.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Stub: handle messages from service worker
  // Phase 2 will implement: START_CAPTURE, STOP_CAPTURE
  console.log('[AudioAI Offscreen] Message received:', message.type);
});

console.log('[AudioAI] Offscreen document loaded');
```

### 6. Create `content.js` (stub)

```js
// content.js — Content Script
// Phase 1: Stub only.
// Phase 4: Will inject the AI panel and push page content.
// Phase 3: Will receive transcript events from service worker.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Stub: handle messages from service worker
  // Phase 3 will implement: TRANSCRIPT_UPDATE
  // Phase 4 will implement: SHOW_PANEL, HIDE_PANEL
  console.log('[AudioAI Content] Message received:', message.type);
});

console.log('[AudioAI] Content script loaded');
```

## Verification

<acceptance_criteria>
- `popup.html` exists at root and contains `<script src="popup.js"></script>`
- `popup.html` contains `id="status-text"` and `id="dot"`
- `popup.html` contains `Audio AI Assistant` as the `<h1>` text
- `popup.js` exists at root and contains `chrome.runtime.sendMessage`
- `popup.js` contains `GET_STATUS` message type
- `background.js` exists at root and contains `chrome.runtime.onMessage.addListener`
- `background.js` contains `GET_STATUS` handler with `sendResponse({ active: false })`
- `offscreen.html` exists at root and contains `<script src="offscreen.js"></script>`
- `offscreen.js` exists at root and contains `chrome.runtime.onMessage.addListener`
- `content.js` exists at root and contains `chrome.runtime.onMessage.addListener`
- All 6 files exist: `popup.html`, `popup.js`, `background.js`, `offscreen.html`, `offscreen.js`, `content.js`
- Extension loads in Chrome at `chrome://extensions/` (developer mode, Load unpacked) with NO errors shown
- Clicking the extension toolbar icon opens the popup showing "Audio AI Assistant" and "Inactive" status
- No console errors in the extension's service worker DevTools
</acceptance_criteria>

## Must-Haves (Goal Backward)

The phase goal requires a "loadable Chrome extension with… a working popup for API key entry" (now: info popup per CONTEXT.md override):
- ✅ All files referenced in manifest.json exist (no "could not load" errors)
- ✅ Popup opens and displays extension name + status
- ✅ Service worker starts and responds to GET_STATUS messages
- ✅ Stub files establish the correct module shape for Phase 2+ to build on
- ✅ Content script loads on all URLs without errors
