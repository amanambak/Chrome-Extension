# ARCHITECTURE.md — Audio AI Chrome Extension

## Component Map

```
┌─────────────────────────────────────────────────────┐
│                  CHROME BROWSER                     │
│                                                     │
│  ┌─────────────────┐    ┌───────────────────────┐  │
│  │  Service Worker  │    │   Offscreen Document  │  │
│  │  (background.js) │◄───│   (offscreen.html)    │  │
│  │                 │    │                       │  │
│  │ - Lifecycle mgmt│    │ - AudioContext        │  │
│  │ - tabCapture ID │───►│ - AudioWorklet        │  │
│  │ - Message relay │    │ - Deepgram WebSocket  │  │
│  └────────┬────────┘    │ - PCM encoding        │  │
│           │             └───────────────────────┘  │
│           │ chrome.runtime.sendMessage              │
│           ▼                                         │
│  ┌─────────────────┐    ┌───────────────────────┐  │
│  │  Content Script  │    │    Injected Panel     │  │
│  │  (content.js)    │◄──►│    (Shadow DOM)       │  │
│  │                 │    │                       │  │
│  │ - Panel injection│   │ - Toggle button       │  │
│  │ - Page resize   │    │ - Transcript feed     │  │
│  │ - Message bridge│    │ - AI response cards   │  │
│  └─────────────────┘    └───────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              Extension Popup                  │  │
│  │  - API key setup (Deepgram + Gemini)         │  │
│  │  - Status indicator                          │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

External Services:
  Offscreen → WebSocket → Deepgram Nova-3 (STT)
  Content Script → HTTPS → Gemini Flash Lite (LLM)
```

## Data Flow

```
Tab Audio
  └─► tabCapture.getMediaStreamId() [Service Worker]
        └─► getUserMedia({chromeMediaSourceId}) [Offscreen]
              └─► AudioContext → AudioWorklet (PCM 16kHz)
                    └─► WebSocket → Deepgram Nova-3
                          └─► {transcript, is_final, utterance_end} events
                                └─► sendMessage [SW relay]
                                      └─► Content Script
                                            ├─► Display interim transcript
                                            └─► On is_final → call Gemini
                                                  └─► Streaming response
                                                        └─► Display in panel
```

## Key Boundaries

| Boundary | Why It Matters |
|----------|---------------|
| SW ↔ Offscreen | AudioContext not available in SW; offscreen provides DOM environment |
| Offscreen ↔ Deepgram | Direct WebSocket; no SW relay needed for audio data |
| Content Script ↔ Panel | Shadow DOM isolates extension CSS from host page styles |
| Content Script → Gemini | Direct fetch from content script context (not SW) to avoid MV3 fetch restrictions |

## Segment Detection Strategy

Deepgram provides built-in utterance segmentation:
- `utterance_end_ms=1500` — fires event after 1500ms of silence
- `endpointing=500` — detects end-of-speech after 500ms pause
- `is_final=true` — marks a finalized transcript chunk

**Application-level grouping logic:**
1. Each `utterance_end` event creates a new segment card in the UI
2. Time gap > 3s → new segment even if topic is related
3. Each segment gets its own LLM call (no blending)
4. Segments display sequentially; older ones stay visible above

## Build Order (Phase Implications)

1. **Extension scaffold** — manifest.json, permissions, file structure
2. **Audio capture pipeline** — tabCapture → offscreen → AudioWorklet → PCM
3. **Deepgram integration** — WebSocket streaming, transcript events
4. **UI panel** — content script injection, Shadow DOM, page resize
5. **LLM integration** — Gemini streaming, question/statement classification
6. **Segment management** — utterance boundary detection, card UI
7. **Configuration** — API key storage, popup page
8. **Polish** — copy button, dark mode, error states
