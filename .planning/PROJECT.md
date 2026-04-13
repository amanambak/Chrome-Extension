# Audio AI Assistant — Chrome Extension

## What This Is

A Chrome extension that captures system audio in real-time (from YouTube, meetings, or any tab), transcribes it using Deepgram Nova-3, and uses Gemini Flash Lite to automatically answer questions and suggest responses to statements. The extension injects a side panel that pushes the page — resizing the browser viewport rather than overlaying content — so the user can see the page and the AI assistant simultaneously.

## Core Value

When audio is playing, users get instant AI answers to questions and smart suggestions for statements — without ever switching tabs or copying text.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Extension captures system audio from the active tab in real-time
- [ ] Audio is transcribed by Deepgram Nova-3 with high accuracy
- [ ] Transcribed text is intelligently segmented — separate questions/statements are kept distinct (not blended)
- [ ] Gemini Flash Lite answers questions detected in the audio
- [ ] Gemini Flash Lite generates contextual suggestions for statements
- [ ] UI panel is injected into the page and resizes the viewport (page content shifts, not overlaid)
- [ ] Toggle button starts and stops audio capture
- [ ] Transcription feed and AI responses are visually separated in the UI

### Out of Scope

- Multi-source simultaneous capture — one tab at a time to keep latency low
- Recording/saving audio — transcription is ephemeral and live only
- Custom LLM selection by the user — Gemini Flash Lite is fixed for v1
- Mobile or Firefox support — Chrome only for v1

## Context

- **Platform**: Chrome Extension (Manifest v3)
- **STT**: Deepgram Nova-3 via WebSocket streaming API
- **LLM**: `gemini-3.1-flash-lite-preview` (Google Generative AI)
- **Audio capture**: Chrome `chrome.tabCapture` or `chrome.desktopCapture` API
- **UI injection**: Content script injects a panel div; `document.body` padding/margin resizes the page layout
- The core UX insight: system audio intelligence should feel ambient and non-intrusive. The panel coexists with the page, not on top of it.

## Constraints

- **Tech Stack**: Chrome Extension Manifest v3 only — no frameworks that require build steps unless necessary
- **APIs**: Deepgram Nova-3 for STT, Gemini Flash Lite for LLM — both via cloud APIs with user-provided keys
- **Latency**: Transcription and AI responses should feel near-real-time (< 3s from speech to AI response)
- **Privacy**: Audio is streamed directly to Deepgram/Gemini — no server in the middle; user must opt in consciously

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Deepgram Nova-3 for STT | Best accuracy for conversational/meeting audio, streaming WebSocket API | — Pending |
| Gemini Flash Lite for LLM | Fast, cheap, good enough for real-time suggestions | — Pending |
| Viewport-resize panel (not overlay) | User can see page content + AI panel simultaneously without obstruction | — Pending |
| Segment detection (not simple split) | Prevents two separate questions from being merged into one AI response | — Pending |

---
*Last updated: 2026-04-10 after initialization*
