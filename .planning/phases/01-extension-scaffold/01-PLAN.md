---
plan: 01
phase: 1
wave: 1
title: Create manifest.json
depends_on: []
files_modified:
  - manifest.json
autonomous: true
requirements_addressed: [CONF-01, CONF-02, CONF-03, CONF-04]
---

# Plan 01: Create manifest.json

## Objective

Create the Chrome Extension Manifest v3 `manifest.json` at the project root with all required permissions, correct file references, and proper metadata. This is the foundation — no other file can be tested in Chrome without it.

## Context

<read_first>
- `.planning/phases/01-extension-scaffold/01-CONTEXT.md` — locked decisions: flat file structure, keys in config.js, popup shows name + status only
- `.planning/ROADMAP.md` §Phase 1 — success criteria: tabCapture, offscreen, storage, scripting permissions required
- `.planning/research/ARCHITECTURE.md` — MV3 architecture decisions
- `.planning/research/PITFALLS.md` — permission requirements for offscreen document
</read_first>

## Action

Create `manifest.json` at the extension root with the following **exact content**:

```json
{
  "manifest_version": 3,
  "name": "Audio AI Assistant",
  "version": "0.1.0",
  "description": "Real-time AI answers and suggestions from tab audio",

  "permissions": [
    "tabCapture",
    "offscreen",
    "storage",
    "scripting"
  ],

  "background": {
    "service_worker": "background.js"
  },

  "action": {
    "default_popup": "popup.html",
    "default_title": "Audio AI Assistant"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],

  "host_permissions": [
    "<all_urls>"
  ],

  "web_accessible_resources": [
    {
      "resources": ["offscreen.html"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**Key decisions baked in:**
- `manifest_version: 3` — MV3 only, no v2 fallback
- All 4 required permissions declared upfront: `tabCapture`, `offscreen`, `storage`, `scripting`
- `default_popup: "popup.html"` — info popup (name + status) per CONTEXT.md decision
- `content_scripts` injects `content.js` into all URLs at `document_idle` — safe, non-blocking
- `host_permissions: ["<all_urls>"]` — required for `scripting` API and tab audio capture across sites
- `web_accessible_resources` exposes `offscreen.html` so it can be created by the service worker

## Verification

<acceptance_criteria>
- `manifest.json` exists at the project root (not in a subdirectory)
- `manifest.json` contains `"manifest_version": 3`
- `manifest.json` contains all four permissions: `"tabCapture"`, `"offscreen"`, `"storage"`, `"scripting"`
- `manifest.json` contains `"service_worker": "background.js"` under `"background"`
- `manifest.json` contains `"default_popup": "popup.html"` under `"action"`
- `manifest.json` contains `"content_scripts"` array with `"js": ["content.js"]`
- `manifest.json` contains `"offscreen.html"` in `web_accessible_resources`
- JSON is valid (parseable without errors)
- Extension loads in Chrome without manifest parse errors at `chrome://extensions/`
</acceptance_criteria>

## Must-Haves (Goal Backward)

The phase goal is "a loadable Chrome extension with correct MV3 structure and all required permissions declared." This plan delivers:
- ✅ MV3 structure (`manifest_version: 3`, service worker, action, content_scripts)
- ✅ All required permissions declared upfront
- ✅ All stub file references wired (background.js, popup.html, content.js, offscreen.html)
