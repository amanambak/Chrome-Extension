# Phase 3: Transcription & Segmentation - Research

**Researched:** 2026-04-11
**Domain:** Deepgram Streaming API, Real-time UI in Extensions, Utterance Segmentation
**Confidence:** HIGH

## Summary

Phase 3 focuses on transforming the raw transcript stream from Deepgram into a structured UI of "Utterance Cards." The primary technical challenge is reliable segmentation — ensuring that speech is grouped logically and that the UI remains responsive with minimal latency. We will leverage Deepgram's `is_final`, `speech_final`, and `UtteranceEnd` events to drive a state machine in the content script that manages card lifecycles.

**Primary recommendation:** Maintain a "Current Utterance" state in the content script. Use `is_final: false` for low-latency interim display, append `is_final: true` segments to the card's permanent text, and trigger card finalization on either `speech_final: true` (audio silence) or the `UtteranceEnd` event (word timing gap).

## User Constraints (from CONTEXT.md)

<user_constraints>
### Locked Decisions
- **Keys are hardcoded in `config.js`** — no user-facing settings popup or key entry UI. [VERIFIED: 02-RESEARCH.md]
- **File Structure: Flat** — all files at the root level of the extension directory. [VERIFIED: 02-RESEARCH.md]
- **Permissions:** `tabCapture`, `offscreen`, `storage`, `scripting` are already declared. [VERIFIED: manifest.json]

### the agent's Discretion
- Minimal panel styling for Phase 3 (to be polished in Phase 4).
- Internal state management for transcript concatenation.
- Error handling UI for WebSocket drops.

### Deferred Ideas (OUT OF SCOPE)
- Dark mode support (v2 consideration).
- Timestamping each card (v2 requirement TRNS-04).
- Speaker diarization (out of scope for v1).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRNS-01 | Interim transcript appears in real-time | Use `interim_results: true` and `is_final: false` messages. |
| TRNS-02 | Finalized transcript displayed when utterance ends | Use `is_final: true` and `speech_final: true`. |
| TRNS-03 | Each utterance is a separate card (no blending) | Use `UtteranceEnd` event as a fail-safe segmentation trigger. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Deepgram API | Nova-3 | Speech-to-Text | Real-time WebSocket streaming with low latency. |
| Chrome Scripting API | MV3 | UI Injection | Required for injecting the panel into pages. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Shadow DOM | Native | Style Isolation | Prevents host page CSS from leaking into the assistant panel. |

## Architecture Patterns

### Recommended Project Structure
```
content.js           # Manages Shadow DOM, listens for transcripts, handles card state
offscreen.js         # RELAY: Now relays UtteranceEnd events in addition to transcripts
background.js        # RELAY: Relays all events from offscreen to active tab
```

### Pattern: Transcript State Machine
**What:** The content script maintains a `currentCard` object and `currentUtterance` string.
**When to use:** Handling asynchronous, multi-part streaming updates.
**Logic:**
1.  **Interim (`is_final: false`):** Replace "preview" text in the current card.
2.  **Finalized (`is_final: true`):** Append to `currentUtterance`, update "stable" text, clear preview.
3.  **Endpoint (`speech_final: true` OR `UtteranceEnd`):** Finalize current card, reset state.

### Anti-Patterns to Avoid
- **Replacing Text on `is_final`:** `is_final` messages are segments. Replacing instead of appending will lose the beginning of long sentences. [CITED: deepgram.com/docs]
- **Direct DOM Injection:** Injecting into `document.body` without Shadow DOM. Host page styles (e.g., `* { color: black !important }`) will break the dark-themed panel. [VERIFIED: web search]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Silence Detection | Manual Energy VAD | Deepgram `endpointing` | Deepgram's server-side VAD is tuned for speech; manual VAD in JS is CPU-heavy and less accurate. |
| Gap Detection | `setTimeout` in content | `utterance_end_ms` | Deepgram tracks word-to-word timing on the server, accounting for stream jitter. |

## Common Pitfalls

### Pitfall 1: Noisy Environments
**What goes wrong:** `speech_final` never triggers because background noise keeps the VAD active.
**How to avoid:** Always enable `utterance_end_ms` (e.g., 1500ms). The `UtteranceEnd` event triggers based on the *absence of words*, even if there is noise. [VERIFIED: Deepgram Docs]

### Pitfall 2: Interim "Flicker"
**What goes wrong:** Rapid interim updates cause the text to jump or layout to thrash.
**How to avoid:** Only update the text content of a dedicated `<span>` for interim results.

### Pitfall 3: SPA Page Transitions
**What goes wrong:** The panel disappears when the user navigates on a site like YouTube (SPA).
**How to avoid:** Phase 3 will rely on full-page reloads for simplicity; Phase 4 will implement navigation listeners to re-inject the panel. [ASSUMED]

## Code Examples

### Deepgram Event Handling (Offscreen)
```javascript
// Source: https://developers.deepgram.com/docs/streaming-audio-transcription
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'UtteranceEnd') {
        chrome.runtime.sendMessage({ type: 'UTTERANCE_END' });
        return;
    }

    if (data.channel?.alternatives?.[0]) {
        const alt = data.channel.alternatives[0];
        chrome.runtime.sendMessage({
            type: 'TRANSCRIPT_RECEIVED',
            transcript: alt.transcript,
            isFinal: data.is_final,
            speechFinal: data.speech_final
        });
    }
};
```

### Content Script Segmentation Logic
```javascript
let currentUtterance = "";
let currentCard = null;

function onTranscript(data) {
    if (!currentCard) currentCard = createCard();
    
    if (data.isFinal) {
        currentUtterance += data.transcript;
        currentCard.setFinalText(currentUtterance);
        currentCard.setInterimText("");
        
        if (data.speechFinal) finalize();
    } else {
        currentCard.setInterimText(data.transcript);
    }
}

function finalize() {
    if (currentCard) currentCard.markComplete();
    currentCard = null;
    currentUtterance = "";
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Deepgram `is_final` segments are non-overlapping. | Architecture | Double-concatenation if segments overlap. |
| A2 | `speech_final` and `UtteranceEnd` are sufficient for TRNS-03. | Pitfalls | Cards might merge in extremely noisy or fast-paced speech. |

## Open Questions

1. **How should we handle very long pauses?**
   - Recommendation: Use `utterance_end_ms=1500` as a default. If users find cards splitting too often, increase to 2000ms.
2. **What if the tab is muted by the user?**
   - Result: `tabCapture` still receives audio if the browser is playing it; user-level OS mute or tab-mute doesn't stop the stream.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Deepgram API | Transcription | ✓ | Nova-3 | — |
| Chrome browser | Extension runtime | ✓ | 114+ | — |
| Vitest | Logic Testing | ✗ | — | Install via npm |

**Missing dependencies with fallback:**
- `vitest`: Not strictly required for execution, but recommended for validating segmentation logic in Wave 0.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.js` |
| Quick run command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRNS-01 | Interim text updates | Unit | `npm run test` | ❌ Wave 0 |
| TRNS-02 | Final text appends | Unit | `npm run test` | ❌ Wave 0 |
| TRNS-03 | UtteranceEnd splits cards | Unit | `npm run test` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Yes | Use `textContent` or `innerText` to prevent XSS from transcripts. |

### Known Threat Patterns for Deepgram

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via Transcript | Tampering | Sanitize all transcript strings before DOM insertion. |

## Sources

### Primary (HIGH confidence)
- [Deepgram Streaming API Reference](https://developers.deepgram.com/docs/streaming-audio-transcription) - Detailed flag behavior.
- [Deepgram UtteranceEnd Guide](https://developers.deepgram.com/docs/utterance-end) - Timing-based segmentation.

### Secondary (MEDIUM confidence)
- Chrome Extension Side Panel implementation patterns (Shadow DOM).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Deepgram's streaming API is well-documented.
- Architecture: HIGH - State machine pattern is standard for streaming.
- Pitfalls: HIGH - Noise issues and VAD limitations are common knowledge in STT.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11
