---
plan: 02
phase: 1
wave: 1
title: Create config.js with hardcoded API keys
depends_on: []
files_modified:
  - config.js
autonomous: true
requirements_addressed: [CONF-01, CONF-02, CONF-03]
---

# Plan 02: Create config.js

## Objective

Create `config.js` at the project root with the Deepgram and Gemini API keys hardcoded. This is the single source of truth for all credentials — every script that needs API access imports from here.

> **Context override:** CONF-01 through CONF-03 required a popup-based key entry flow with `chrome.storage.local`. Per CONTEXT.md, this is replaced by hardcoded keys in `config.js` for this personal developer build.

## Context

<read_first>
- `.planning/phases/01-extension-scaffold/01-CONTEXT.md` — Decision: "Keys hardcoded in config.js — no popup key entry, no chrome.storage.local for keys"
- `.planning/research/PITFALLS.md` §6 — API key security note: acceptable for personal build (v1 tradeoff documented)
</read_first>

## Action

Create `config.js` at the extension root with the following **exact structure**:

```js
// config.js — API keys for Audio AI Assistant
// NOTE: Keys are hardcoded for local developer use only.
// Do NOT publish this extension to the Chrome Web Store with real keys.

const CONFIG = {
  DEEPGRAM_API_KEY: "YOUR_DEEPGRAM_API_KEY_HERE",
  GEMINI_API_KEY: "YOUR_GEMINI_API_KEY_HERE",

  // Deepgram WebSocket parameters (tuned per research/PITFALLS.md)
  DEEPGRAM_WS_URL: "wss://api.deepgram.com/v1/listen",
  DEEPGRAM_PARAMS: {
    model: "nova-3",
    utterance_end_ms: 1500,
    endpointing: 500,
    encoding: "linear16",
    sample_rate: 16000,
  },

  // Gemini model
  GEMINI_MODEL: "gemini-3.1-flash-lite-preview",
};
```

**Do not fill in real key values** — leave the placeholders. The developer fills in their own keys before loading the extension.

**Why this structure:**
- Single `CONFIG` object prevents naming conflicts with other globals
- Deepgram WebSocket URL and params co-located with the key — Phase 2 (audio pipeline) reads all of these from one place
- `GEMINI_MODEL` co-located — Phase 5 (LLM integration) reads from here
- Placeholders with `_HERE` suffix make it obvious these need to be filled in

## Verification

<acceptance_criteria>
- `config.js` exists at the project root
- `config.js` contains `const CONFIG = {`
- `config.js` contains `DEEPGRAM_API_KEY:`
- `config.js` contains `GEMINI_API_KEY:`
- `config.js` contains `DEEPGRAM_WS_URL: "wss://api.deepgram.com/v1/listen"`
- `config.js` contains `GEMINI_MODEL: "gemini-3.1-flash-lite-preview"`
- `config.js` contains `utterance_end_ms: 1500`
- `config.js` contains `sample_rate: 16000`
- File is valid JavaScript (no syntax errors)
</acceptance_criteria>

## Must-Haves (Goal Backward)

This plan establishes the credentials infrastructure that all future phases depend on:
- ✅ Single config file at root (flat structure per CONTEXT.md)
- ✅ Both API keys present as named constants
- ✅ Deepgram and Gemini parameters co-located for easy Phase 2 and Phase 5 pickup
