# Phase 6: Polish & Error Handling - Research

**Researched:** 2026-04-12
**Domain:** Chrome Extension UI, Error Handling, Clipboard API
**Confidence:** HIGH

## Summary
Phase 6 focuses on finalizing the user experience of the Audio AI Chrome extension. This involves implementing a robust copy-to-clipboard mechanism for the Shadow DOM-based UI, providing clear and actionable error states for both Deepgram and Gemini API failures, and refining the visual aesthetics of the panel.

**Primary recommendation:** Use `navigator.clipboard.writeText` with a focused fallback for Shadow DOM copying, implement exponential backoff for Deepgram WebSocket reconnections, and create dedicated `error-card.js` and `copy-button.js` components for consistent UI patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Phase 1: Flat file structure — all files at extension root
- Phase 3: Use Shadow DOM for transcription panel to ensure style isolation.
- Framework: Vanilla JS + CSS (Keep bundle small; no build pipeline needed)

### the agent's Discretion
- Best practices for error handling in real-time Chrome extension panels.
- Improving the overall look and feel of the extension panel.
- How to implement a copy-to-clipboard button in a Shadow DOM panel.

### Deferred Ideas (OUT OF SCOPE)
- None explicitly deferred.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | Copy-to-clipboard button on AI response cards | Requires `clipboardWrite` permission and specific Shadow DOM focus management logic. |
| UX-04 | Graceful error messages for API failures | Requires specific error catching in `offscreen.js` (Deepgram) and `background.js` (Gemini), relayed to the UI. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Clipboard API | Native | Copying text | Native browser API, but requires specific handling within Shadow DOM and MV3 contexts. |
| Vanilla JS | ES6+ | UI Components | Project constraint; avoids build steps and heavy bundles. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| CSS Variables | Native | Theming | Used within Shadow DOM for consistent styling of error and success states. |

**Installation:** No new NPM dependencies are required as the project is strictly Vanilla JS.

## Architecture Patterns

### Recommended Project Structure
```
(root)/
├── transcript-panel.js   # Panel layout and styles
├── ai-response-card.js   # AI message container
├── copy-button.js        # New: Reusable copy logic
├── error-card.js         # New: Distinct API failure messages
├── offscreen.js          # Deepgram connection logic
└── background.js         # Gemini connection logic
```

### Pattern 1: Shadow DOM Clipboard Execution
**What:** Accessing the system clipboard from an element deep within a Shadow DOM.
**When to use:** When implementing the copy-to-clipboard button in `ai-response-card.js`.
**Example:**
```javascript
// Source: MDN and Chrome Extension best practices
button.addEventListener('click', async () => {
    // Requires "clipboardWrite" in manifest.json permissions
    try {
        await navigator.clipboard.writeText(textToCopy);
        this.showSuccess();
    } catch (err) {
        console.error('Clipboard API failed', err);
        this.fallbackCopy(textToCopy); // Fallback for focus edge-cases
    }
});
```

### Anti-Patterns to Avoid
- **Calling `navigator.clipboard` directly from the Service Worker (`background.js`)**: The Clipboard API requires an active document and user gesture. It will fail in MV3 service workers.
- **Silent Failures**: Catching an error in `offscreen.js` and only logging it to the console. The user must be informed via the UI panel.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Copy text | Custom invisible input hacks | `navigator.clipboard.writeText` | Modern, secure, and native (with `clipboardWrite` permission). [VERIFIED: MDN] |
| SVG Icons | Hand-coded SVG paths inline | Inline SVGs within JS template literals | Simple and requires no asset loading, but keep them concise. [ASSUMED] |

**Key insight:** Chrome Extensions have strict CSP and focus contexts. Relying on standard web APIs with appropriate manifest permissions is always preferred.

## Common Pitfalls

### Pitfall 1: DOMException: Document is not focused
**What goes wrong:** The copy button click fails to write to the clipboard.
**Why it happens:** The Clipboard API requires the main document to have focus. When clicking inside a Shadow DOM (`mode: 'open'`), the `document.activeElement` points to the shadow host, potentially causing the API to reject the call. [CITED: stackoverflow.com]
**How to avoid:** Ensure the manifest has the `clipboardWrite` permission. In some extreme edge cases within complex host pages, a fallback to creating a hidden `<textarea>` and using `document.execCommand('copy')` might be required, but `clipboardWrite` usually resolves the permission issue.

### Pitfall 2: Unhandled WebSocket Closures
**What goes wrong:** The Deepgram API drops the connection, and the UI hangs with "...Thinking".
**Why it happens:** Network instability or token expiration. `offscreen.js` has `socket.onclose` but doesn't notify `background.js` or `content.js`.
**How to avoid:** In `socket.onclose`, send a message `{ type: 'API_ERROR' }` to the service worker, which relays it to the content script to display an `ErrorCard`. [ASSUMED]

### Pitfall 3: Manifest Permissions Missing
**What goes wrong:** New features fail silently or with permission denied errors.
**Why it happens:** Adding clipboard functionality without updating `manifest.json`.
**How to avoid:** Add `"clipboardWrite"` to the `permissions` array in `manifest.json`. [VERIFIED: Chrome Docs]

## Code Examples

### Deepgram Error Relay (`offscreen.js`)
```javascript
// Source: Based on Phase 2 implementation
socket.onclose = (event) => {
  console.warn('[AudioAI] Deepgram closed:', event.code);
  if (event.code !== 1000) { // Not a normal closure
      chrome.runtime.sendMessage({ 
          type: 'API_ERROR', 
          source: 'Deepgram', 
          message: `Connection lost (${event.code}). Please restart capture.` 
      });
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Broad support since Chrome 66 | Async, Promise-based, secure. Requires manifest permission. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The target websites (e.g., YouTube, Meet) do not strictly block `clipboardWrite` via severe CSP or iframe isolation that prevents the extension content script from copying. | Pitfalls | The copy button may fail silently on specific highly-secure websites. |
| A2 | Project does not have a `package.json` and is strictly Vanilla JS without build tools. | Standard Stack | If build tools exist, we could use NPM packages for icons or UI. Verified via `ls` command that no `package.json` exists. |
| A3 | [ASSUMED] Using inline SVGs for the copy/error icons is better than adding image assets to keep the extension lightweight and avoid path resolution issues in Shadow DOM. | Don't Hand-Roll | Increased JS file size if icons are complex. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Chrome Browser | Extension runtime | ✓ | MV3 supported | — |
| Deepgram API | STT | ✓ | WebSocket v1 | — |
| Gemini API | LLM | ✓ | 2.0 Flash | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none (Vanilla JS project) |
| Config file | none |
| Quick run command | `echo "Manual verification required"` |
| Full suite command | `echo "Manual verification required"` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | Copy button puts AI text in clipboard | manual | `echo "Test in browser"` | ❌ Wave 0 |
| UX-04 | Deepgram disconnect shows error card | manual | `echo "Test in browser"` | ❌ Wave 0 |
| UX-04 | Gemini API failure shows inline error | manual | `echo "Test in browser"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** Manual refresh of extension in `chrome://extensions`
- **Per wave merge:** End-to-end manual test of audio capture and UI
- **Phase gate:** All visual elements verified

### Wave 0 Gaps
- [ ] No automated test framework (`package.json`, `jest`, `puppeteer`) is installed. Since the project constraints emphasize a flat structure and no build pipeline, manual verification is the intended testing strategy.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `textContent` instead of `innerHTML` for AI outputs |
| V6 Cryptography | no | — |

### Known Threat Patterns for Chrome Extension UI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via AI output | Tampering | Use `textContent` for appending LLM streams, never `innerHTML`. The current `AiResponseCard.js` correctly uses `textContent`. |

## Sources

### Primary (HIGH confidence)
- Chrome Extension Documentation - Permissions (`clipboardWrite`) [VERIFIED: developer.chrome.com]
- Deepgram Documentation - WebSocket Error Codes [VERIFIED: developers.deepgram.com]

### Secondary (MEDIUM confidence)
- WebSearch verified with official source - Shadow DOM Clipboard API behavior [CITED: stackoverflow.com]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified against existing files (Vanilla JS).
- Architecture: HIGH - Consistent with previous phases.
- Pitfalls: HIGH - Known Chrome MV3 and Shadow DOM behaviors.

**Research date:** 2026-04-12
**Valid until:** 2026-05-12
