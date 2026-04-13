# Phase 02: Audio Capture Pipeline - Research

**Researched:** 2026-04-11
**Domain:** Chrome extension audio capture, Offscreen Documents, Deepgram WebSocket streaming
**Confidence:** HIGH

## Summary
Phase 2 focuses on capturing tab audio in a Manifest V3 environment, processing it into a 16kHz PCM stream, and transmitting it to Deepgram Nova-3 via WebSocket. The primary challenge is navigating the restrictions of MV3, which requires an offscreen document to access the `AudioContext` and `getUserMedia` APIs, as they are unavailable in the background service worker. 

**Primary recommendation:** Use `chrome.tabCapture.getMediaStreamId()` triggered by a user gesture in the service worker, pass the ID to an offscreen document, and use a dedicated `AudioContext` at 16,000Hz to handle resampling automatically before converting `Float32` to `Int16` chunks for Deepgram.

## User Constraints (from CONTEXT.md)

<user_constraints>
### Locked Decisions
- **Keys are hardcoded in `config.js`** — no user-facing settings popup or key entry UI. [VERIFIED: 01-CONTEXT.md]
- **File Structure: Flat** — all files at the root level of the extension directory. [VERIFIED: 01-CONTEXT.md]
- **Permissions:** `tabCapture`, `offscreen`, `storage`, `scripting` are already declared. [VERIFIED: manifest.json]

### the agent's Discretion
- Popup styling and status detection logic.
- AudioWorklet implementation details (buffer sizes, error handling).
- WebSocket reconnection strategy.

### Deferred Ideas (OUT OF SCOPE)
- Popup settings UI with key entry (CONF-01 to CONF-04).
- Dark mode for popup (v2 consideration).
- Multi-tab simultaneous capture.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAPT-01 | Start audio capture via toggle | Use `chrome.tabCapture.getMediaStreamId()` + `chrome.offscreen.createDocument()`. |
| CAPT-02 | Tab audio playback continues | Connect `AudioContext` source to `audioContext.destination` in the offscreen document. |
| CAPT-03 | Active capture indicator | Use `chrome.action.setBadgeText` and inject a pulsing dot via content script. |
| CAPT-04 | Stop capture via toggle | Stop all tracks in `MediaStream`, close `AudioContext`, and close offscreen document. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Chrome Extension API | MV3 | Platform | Required for browser integration. |
| Deepgram API | Nova-3 | Speech-to-Text | Real-time, low-latency, state-of-the-art model. |
| Web Audio API | Native | Audio Processing | Standard for browser-based audio manipulation. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| WebSocket | Native | Streaming | Real-time binary data transmission to Deepgram. |

## Architecture Patterns

### Recommended Project Structure
```
manifest.json
config.js            # Contains DEEPGRAM_API_KEY
background.js        # Handles action click, manages offscreen doc lifecycle
offscreen.html       # Container for offscreen.js
offscreen.js         # AudioContext, AudioWorklet loading, WebSocket management
capture-worklet.js   # AudioWorkletProcessor for PCM extraction
content.js           # Receives transcript relay and updates UI indicator
```

### Pattern: Tab Capture Relay
**What:** The service worker cannot access the audio stream directly. It must get a `streamId` and pass it to an offscreen document.
**When to use:** Any Manifest V3 extension needing tab audio capture.
**Source:** [Official Chrome Docs](https://developer.chrome.com/docs/extensions/reference/api/offscreen)

### Anti-Patterns to Avoid
- **Capturing in Service Worker:** Impossible in MV3; will result in `ReferenceError: AudioContext is not defined`.
- **Ignoring Passthrough:** `tabCapture` mutes the tab by default. Failing to connect the source to `destination` will mute the audio for the user.
- **Multiple Offscreen Docs:** Chrome limits extensions to one offscreen document at a time. Always check `chrome.runtime.getContexts` before creating.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resampling | Manual downsampling logic | `new AudioContext({ sampleRate: 16000 })` | Browser handles resampling efficiently. |
| Auth Headers | Custom WebSocket wrapper | `['token', API_KEY]` sub-protocol | Browser `WebSocket` doesn't support custom headers. |
| Utterance End | Silence detection logic | Deepgram `utterance_end_ms=1500` | Native API support is more robust than manual energy detection. |

## Common Pitfalls

### Pitfall 1: User Gesture Requirement
**What goes wrong:** `tabCapture.getMediaStreamId()` fails with an error like "User gesture required".
**How to avoid:** Must call the API within a direct response to `chrome.action.onClicked` (extension icon click) or a message from the popup triggered by a click.

### Pitfall 2: Stream ID Expiry
**What goes wrong:** `getUserMedia` fails because the `streamId` is invalid.
**How to avoid:** Pass the ID to the offscreen document and call `getUserMedia` immediately (within ~2-3 seconds).

### Pitfall 3: Float32 vs Int16
**What goes wrong:** Deepgram receives garbage or no data because it expects PCM16 but gets Float32.
**How to avoid:** Convert the `Float32Array` from the `AudioWorklet` to an `Int16Array` before sending.

## Code Examples

### Deepgram WebSocket Auth (Browser)
```javascript
// Source: https://developers.deepgram.com/docs/streaming-audio-transcription
const socket = new WebSocket(
  'wss://api.deepgram.com/v1/listen?model=nova-3&encoding=linear16&sample_rate=16000&interim_results=true',
  ['token', DEEPGRAM_API_KEY]
);
```

### AudioContext with Resampling
```javascript
// Source: Web Audio API Spec
const audioContext = new AudioContext({ sampleRate: 16000 });
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    mandatory: {
      chromeMediaSource: 'tab',
      chromeMediaSourceId: streamId
    }
  }
});
const source = audioContext.createMediaStreamSource(stream);
// Passthrough for user playback
source.connect(audioContext.destination);
```

### Float32 to Int16 Conversion
```javascript
function floatTo16BitPCM(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Manual Testing | Chrome Extension (Dev Mode) |
| Quick run command | `npm run test:unit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAPT-01 | Stream ID generation | Integration | `vitest background.test.js` | ❌ Wave 0 |
| CAPT-02 | Audio Passthrough | Manual | Toggle capture and verify sound continues | N/A |
| CAPT-04 | Resource Cleanup | Unit | Verify `audioContext.close` called | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] Install `vitest` and `@testing-library/jest-dom`.
- [ ] Add `background.test.js` stub with `chrome-extension-mock`.
- [ ] Create `capture-worklet.js` placeholder.

## Security Domain

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API Key Leak | Information Disclosure | Store in `config.js` (excluded from git). Never log keys to console. |
| Unauthorized Capture | Privacy | `tabCapture` requires explicit user action (click) per session. |

## Sources

### Primary (HIGH confidence)
- [Official Chrome Offscreen Docs](https://developer.chrome.com/docs/extensions/reference/api/offscreen) - Usage of offscreen documents for tab capture.
- [Deepgram WebSocket Documentation](https://developers.deepgram.com/docs/streaming-audio-transcription) - Auth and PCM streaming parameters.
- [Chrome TabCapture API](https://developer.chrome.com/docs/extensions/reference/api/tabCapture) - Permissions and stream ID lifecycle.

### Secondary (MEDIUM confidence)
- Community patterns for AudioWorklet PCM conversion.

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH - Chrome official docs are definitive.
- Architecture: HIGH - Offscreen document is the only path in MV3.
- Pitfalls: HIGH - Common issues with user gestures and encoding are well-documented.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11
