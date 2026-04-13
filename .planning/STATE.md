# STATE.md — Audio AI Chrome Extension

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-04-10)

**Core value:** When audio is playing, users get instant AI answers to questions and smart suggestions for statements — without ever switching tabs or questions.
**Current focus:** Project Complete (v1.0)

## Current State

**Milestone:** v1.0
**Status:** Project Complete — Feature-complete, polished, and verified.
**Last action:** Phase 6 Polish & Error Handling complete. Implemented copy-to-clipboard, robust error handling for Deepgram and Gemini, and refined the UI for a production-ready look.

## Roadmap Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Extension Scaffold | ✅ Complete (2026-04-10) |
| 2 | Audio Capture Pipeline | ✅ Complete (2026-04-11) |
| 3 | Transcription & Segmentation | ✅ Complete (2026-04-11) |
| 4 | UI Panel & Page Resize | ✅ Complete (2026-04-12) |
| 5 | LLM Integration | ✅ Complete (2026-04-12) |
| 6 | Polish & Error Handling | ✅ Complete (2026-04-12) |

## Key Decisions Made

- Phase 1: API keys hardcoded in config.js (no popup key entry — overrides CONF-01 to CONF-04)
- Phase 1: Flat file structure — all files at extension root
- Phase 1: Icon click shows minimal info popup (name + active/inactive status only)
- Phase 2: Used WebSocket token sub-protocol for Deepgram API key.
- Phase 2: Relayed transcripts to specific tab ID via service worker.
- Phase 3: Use Shadow DOM for transcription panel to ensure style isolation.
- Phase 3: Leverage Deepgram `UtteranceEnd` event for reliable card segmentation.
- Phase 4: Use `margin-right` on `html` for general page shifting.
- Phase 4: Implement `FixedShiftHelper` with `MutationObserver` for `position: fixed` elements.
- Phase 4: Dispatch `window.resize` on panel toggle to force host reflow (e.g. YouTube).
- Phase 5: Gemini 2.0 Flash used for real-time answers and suggestions.
- Phase 5: ID-based routing for linking AI responses to their source transcripts.
- Phase 5: Model-side prefix detection ([ANSWER]/[SUGGESTION]) for UI classification.
- Phase 6: Shadow DOM clipboard access via `clipboardWrite` permission and dedicated `CopyButton` class.
- Phase 6: Robust API error relaying from offscreen/background to content script via `API_ERROR` messages.

## Quick Tasks Completed

- Phase 1: Manifest, Config, Popup, and stub files.
- Phase 2: Service Worker toggle, Offscreen capture, Deepgram WebSocket integration.
- Phase 3: Transcription relay, Utterance segmentation, Shadow DOM panel.
- Phase 4: Page resize logic, Fixed element shifting, Layout reflow.
- Phase 5: Gemini streaming infrastructure, AI UI component, ID-based routing.
- Phase 6: Copy-to-clipboard, Error handling relay, UI polish, and bug fixes.
