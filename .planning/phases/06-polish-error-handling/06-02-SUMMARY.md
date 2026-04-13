---
phase: 06-polish-error-handling
plan: 02
subsystem: error-handling
tags: [relay, reliability]
requires: [06-01]
provides: [end-to-end-error-reporting]
tech-stack: [chrome-messaging, websockets]
key-files: [offscreen.js, background.js, content.js, transcript-panel.js]
metrics:
  duration: 15m
  completed_date: "2025-02-14"
---

# Phase 06 Plan 02: End-to-End Error Handling Summary

## Objective
Implement end-to-end error handling from the background/offscreen contexts to the visible UI.

## Changes

### 1. offscreen.js Error Detection
- Updated `openDeepgramConnection` to handle `socket.onerror` and `socket.onclose`.
- Non-1000 closure codes now trigger an `API_ERROR` message to the extension.
- Added error reporting to the `startCapture` catch block to surface initialization failures.

### 2. background.js Error Relay
- Added an `API_ERROR` message listener that relays errors from the offscreen document or service worker directly to the content script of the captured tab.
- This ensures that hidden background failures are surfaced to the user in the visible panel.

### 3. content.js & transcript-panel.js UI Integration
- Added `addErrorCard` method to `TranscriptPanel` which instantiates the `ErrorCard` component and appends it to the container.
- Updated `content.js` to listen for `API_ERROR` messages and call `panel.addErrorCard()` accordingly.

## Verification
- Code review confirms that errors are propagated from source to destination via Chrome messaging.
- `offscreen.js` now covers WebSocket closure reasons.

## Self-Check: PASSED
- [x] Offscreen document detects and relays WebSocket errors.
- [x] Service worker relays API errors to the content script.
- [x] Content script displays ErrorCard for API failures.
- [x] Errors are handled gracefully without crashing the extension.
