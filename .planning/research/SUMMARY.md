# SUMMARY.md — Research Synthesis

## Stack Recommendation

**Core:** Chrome Extension MV3 — Service Worker + Offscreen Document + Content Script
**STT:** Deepgram Nova-3 via WebSocket (`wss://api.deepgram.com/v1/listen?model=nova-3&utterance_end_ms=1500&endpointing=500`)
**LLM:** Gemini `gemini-3.1-flash-lite-preview` via `@google/genai` SDK, using `generateContentStream`
**Audio Pipeline:** `chrome.tabCapture` → `getUserMedia` → `AudioContext` + `AudioWorklet` (PCM 16kHz) → Deepgram WebSocket
**UI Panel:** Content script + Shadow DOM, `margin-right` on `document.body` to push page content

---

## Table Stakes (Must Ship in v1)

| Feature | Why It's Required |
|---------|------------------|
| Tab audio capture | The entire product premise |
| Deepgram real-time transcription | Core UX — visible as user speaks |
| Question detection + AI answer | Primary AI value |
| Statement detection + suggestion | Secondary AI value |
| Utterance-level segmentation | Prevents question blending (user's #1 concern) |
| Page-resize panel (not overlay) | User's explicit UI requirement |
| Start/stop toggle | Privacy & usability expectation |
| API key configuration | Required for Deepgram and Gemini to work |
| Audio playback continuity | Without this, video/meetings go silent — critical bug |

---

## Watch Out For 🚨

| Risk | Severity | Phase to Address |
|------|----------|-----------------|
| Audio stops playing when captured | 🔴 Critical | Phase 2 — reconnect to `audioContext.destination` |
| SW terminates after 30s inactivity | 🔴 Critical | Phase 2 — use alarms, keep offscreen alive |
| Float32Array not serializable via sendMessage | 🔴 Critical | Phase 2 — never pass audio buffers through SW |
| Two questions merged by LLM | 🟡 High | Phase 5 — one LLM call per utterance_end event |
| Content script CSS conflicts | 🟡 High | Phase 4 — Shadow DOM is mandatory |
| API keys exposed | 🟡 High | Phase 7 — store in chrome.storage.local only |
| Offscreen document terminated | 🟡 Medium | Phase 2 — keep AudioContext running |

---

## Architecture Decision

**Use Offscreen Document (not tabCapture in content script)**

The offscreen document is the ONLY place where `AudioContext`, `AudioWorklet`, and `getUserMedia` work in MV3. All audio processing must happen there. Only transcript text should flow to the content script.

**Segmentation:** Deepgram's `utterance_end` event (fires after 1500ms silence) is the trigger for:
1. Finalizing a transcript segment in the UI
2. Launching a single Gemini call for that segment
3. Displaying the AI response beneath that specific card

This guarantees two questions are NEVER merged.

---

## Build Order

```
Phase 1: Extension Scaffold (manifest, permissions, file structure)
Phase 2: Audio Pipeline (tabCapture → offscreen → Deepgram WebSocket)
Phase 3: Transcript UI (panel injection, Shadow DOM, page resize, live display)
Phase 4: LLM Integration (Gemini streaming, question/statement classification)
Phase 5: Segment Management (utterance cards, separate AI responses per segment)
Phase 6: Configuration & Polish (API key UI, copy buttons, dark mode, error states)
```
