# PITFALLS.md — Audio AI Chrome Extension

## Critical Pitfalls

### 1. 🔴 Audio Stops Playing When You Capture It
**Problem:** `tabCapture` disconnects the audio from the speaker by default. User's video/meeting goes silent.
**Detection:** Test by playing YouTube while capture is active.
**Prevention:** In the offscreen document, connect the source to `audioContext.destination` explicitly:
```js
source.connect(workletNode);
source.connect(audioContext.destination); // ← MUST add this
```
**Phase:** Address in Phase 2 (Audio Capture).

---

### 2. 🔴 Service Worker Terminates Mid-Session
**Problem:** MV3 service workers die after ~30s of inactivity. During a long meeting, the SW may terminate, killing the audio pipeline.
**Detection:** Capture for 5+ minutes; check if it stops working.
**Prevention:**
- Keep offscreen document alive (active AudioContext counts as activity)
- Use `chrome.alarms` to periodically ping the SW
- Store session state in `chrome.storage.session` to recover after SW restart
**Phase:** Address in Phase 2.

---

### 3. 🔴 `chrome.runtime.sendMessage` Fails with Float32Arrays
**Problem:** Audio data (`Float32Array`) is not serializable via `sendMessage`. Passing raw audio buffers crashes the pipeline.
**Detection:** Console errors about "could not be cloned."
**Prevention:** Don't pass audio buffers to SW. Process audio entirely in the offscreen document; only send transcript text to content script.
**Phase:** Address in Phase 2 (design correctly from the start).

---

### 4. 🟡 Two Separate Questions Get Merged by LLM
**Problem:** If the LLM receives a single prompt containing two unrelated questions, it may conflate them into one combined answer.
**Detection:** Ask two different questions in quick succession; see if responses are separate.
**Prevention:**
- Each `utterance_end` event creates a **new, independent** LLM call
- Never batch multiple utterances into one prompt
- Each segment card in the UI maps 1:1 to one LLM call
**Phase:** Address in Phase 5 (LLM integration).

---

### 5. 🟡 Content Script CSS Conflicts with Host Page
**Problem:** Host page CSS leaks into the injected panel, breaking layout. Extension CSS may also break the host page.
**Detection:** Test on complex pages (Google Docs, Gmail, Notion).
**Prevention:** Wrap all panel HTML in a **Shadow DOM**:
```js
const shadow = container.attachShadow({ mode: 'closed' });
```
**Phase:** Address in Phase 4 (UI panel).

---

### 6. 🟡 API Keys Exposed in Source
**Problem:** Hardcoding API keys in extension source exposes them; anyone who installs the extension can extract them.
**Detection:** Check bundle for key strings.
**Prevention:**
- Store keys in `chrome.storage.local` (user enters them in popup settings)
- Never hardcode keys; always read from storage at runtime
- API calls made from content script at runtime (not bundled)
**Phase:** Address in Phase 7 (Configuration).

---

### 7. 🟡 Offscreen Document Terminated Too Quickly
**Problem:** Chrome may terminate offscreen documents when it thinks they're idle.
**Detection:** Capture stops working after a few minutes of silence in the audio.
**Prevention:**
- Keep the `AudioContext` running even during silence (don't suspend it)
- Use `audioContext.state === 'running'` checks and resume if suspended
**Phase:** Address in Phase 2.

---

### 8. 🟢 Gemini API Key Security Warning
**Problem:** Making direct Gemini API calls from a content script means the Gemini API key is in `chrome.storage.local` — readable by potentially malicious extensions with storage permissions.
**Detection:** Architectural consideration, not a bug.
**Mitigation:** Document this limitation clearly to the user on the settings page. For v1, accept this tradeoff. V2 could use a proxy backend.
**Phase:** Document in Phase 7 settings UI.

---

### 9. 🟢 Deepgram `endpointing` Latency vs. Accuracy Trade-off  
**Problem:** Setting `endpointing` too low causes premature sentence cuts mid-speech. Too high feels sluggish.
**Recommended values:** `endpointing=500`, `utterance_end_ms=1500` as starting point.
**Prevention:** Make these configurable or tune after testing with real use cases.
**Phase:** Phase 3 (Deepgram integration).

---

### 10. 🟢 LLM Streaming Causes Flicker in DOM
**Problem:** Appending streaming chunks to the DOM naively causes layout thrash and visible flicker.
**Prevention:**
- Use a streaming text approach: append chunks to a `<span>` using `textContent += chunk`
- Avoid innerHTML for streamed content (XSS risk from LLM output)
- Sanitize with DOMPurify if rendering markdown
**Phase:** Phase 5 (LLM integration).
