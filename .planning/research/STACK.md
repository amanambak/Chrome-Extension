# STACK.md — Audio AI Chrome Extension

## Recommended 2025 Stack

### Chrome Extension Runtime
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Manifest Version** | MV3 | Required by Chrome; MV2 deprecated |
| **Service Worker** | `background.js` | Orchestrates lifecycle, handles tab capture init |
| **Offscreen Document** | `offscreen.html` / `offscreen.js` | REQUIRED for AudioContext/AudioWorklet (DOM APIs not available in SW) |
| **Content Script** | `content.js` | Injects UI panel into page |
| **Side Panel / Injected Panel** | Content script + Shadow DOM | User wants page-resize behavior — use body padding approach |

### Speech-to-Text
| Component | Choice | Version | Confidence |
|-----------|--------|---------|------------|
| **STT Provider** | Deepgram | Nova-3 | ✅ High |
| **Protocol** | WebSocket streaming | `wss://api.deepgram.com/v1/listen?model=nova-3` | ✅ Confirmed |
| **Parameters** | `interim_results=true&utterance_end_ms=1500&endpointing=500` | For real-time + segmentation | ✅ High |

### LLM
| Component | Choice | Library | Confidence |
|-----------|--------|---------|------------|
| **Model** | `gemini-3.1-flash-lite-preview` | `@google/genai` | ✅ High |
| **SDK** | `@google/genai` (NOT `@google/generative-ai`) | Latest, supports Gemini 2.0+ | ✅ High |
| **Method** | `generateContentStream` | For real-time streaming display | ✅ Confirmed |

### Audio Pipeline
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Audio Capture** | `chrome.tabCapture.getMediaStreamId()` | Captures tab audio stream ID |
| **Audio Processing** | `AudioContext` + `AudioWorkletNode` | Off-thread processing, avoids UI freeze |
| **Encoding** | PCM (16-bit, 16kHz) → Deepgram WebSocket | Standard for STT streaming |

### UI
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Panel injection** | Content script + Shadow DOM | CSS isolation from host page |
| **Layout** | Apply `margin-right` to `document.body` | Shifts page content without overlaying |
| **Framework** | Vanilla JS + CSS | Keep bundle small; no build pipeline needed |

### Do NOT Use
- `@google/generative-ai` — being phased out, use `@google/genai`
- `chrome.desktopCapture` — too invasive, requires screen share dialog; `tabCapture` is appropriate
- Overlay at `position: fixed` — conflicts with host page; use page-resize instead
- Local STT (transformers.js) — too slow for real-time on CPU; Deepgram is better
