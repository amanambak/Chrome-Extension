# ROADMAP.md — Audio AI Chrome Extension

## Phase 1: Extension Scaffold
**Goal:** Basic extension files exist, and clicking the extension icon shows a popup.
**Status:** ✅ Complete (2026-04-10)
**Key Tasks:**
- [x] manifest.json configuration
- [x] config.js with API keys
- [x] popup.html / popup.js UI
- [x] background.js (Service Worker) shell

## Phase 2: Audio Capture Pipeline
**Goal:** Capture current tab audio and stream it to Deepgram Nova-3.
**Status:** ✅ Complete (2026-04-11)
**Key Tasks:**
- [x] 02-01-PLAN.md — SW, Popup & Lifecycle logic
- [x] 02-02-PLAN.md — Offscreen capture & PCM conversion
- [x] 02-03-PLAN.md — Deepgram WebSocket integration & Relay

## Phase 3: Transcription & Segmentation
**Goal:** Live transcript appears in segmented cards.
**Status:** ✅ Complete (2026-04-11)
**Key Tasks:**
- [x] 03-01-PLAN.md — Utterance relay & panel shadow DOM shell
- [x] 03-02-PLAN.md — Utterance card UI & transcription state machine
- [x] 03-03-PLAN.md — Auto-scroll, CSS isolation, and E2E verification

## Phase 4: UI Panel & Page Resize
**Goal:** Panel occupies fixed right sidebar, and page content shifts.
**Status:** ✅ Complete (2026-04-12)
**Key Tasks:**
- [x] 04-01-PLAN.md — Core layout shifting (html margin)
- [x] 04-02-PLAN.md — Advanced fixed element shifting & MutationObserver
- [x] 04-03-PLAN.md — Responsive behavior & window resize dispatch

## Phase 5: LLM Integration
**Goal:** Gemini 2.0 Flash provides real-time answers and suggestions.
**Status:** ✅ Complete (2026-04-12)
**Key Tasks:**
- [x] 05-01-PLAN.md — Background Gemini streaming infrastructure
- [x] 05-02-PLAN.md — AI Response UI component & styles
- [x] 05-03-PLAN.md — ID-based routing & classification logic

## Phase 6: Polish & Error Handling
**Goal:** Features complete, polished UI, and robust error management.
**Status:** ✅ Complete (2026-04-12)
**Key Tasks:**
- [x] 06-01-PLAN.md — Copy button, Error cards, and Clipboard permissions
- [x] 06-02-PLAN.md — End-to-end error relay (Deepgram/Gemini)
- [x] 06-03-PLAN.md — UI/UX refinement & final verification
