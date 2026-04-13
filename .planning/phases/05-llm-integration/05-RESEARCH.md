# Phase 5: LLM Integration - Research

**Researched:** 2024-05-24
**Domain:** Gemini 2.0 Flash, Chrome Extension Messaging, Streaming UI
**Confidence:** HIGH

## Summary

This phase integrates Gemini 2.0 Flash to process finalized utterances. When an utterance is completed (detected by `UTTERANCE_END` or `speech_final`), the extension will send the text to the Gemini API. The response will be streamed back to the content script and displayed in a dedicated AI response card within the transcript panel. 

The integration uses a system prompt to classify the input as a "Question" (concise answer) or a "Statement" (2-3 follow-up suggestions), fulfilling requirements AI-01, AI-02, and AI-05. Streaming support (AI-03) is achieved by relaying chunks from the Service Worker to the Content Script using `chrome.tabs.sendMessage`.

**Primary recommendation:** Use `fetch` with the `streamGenerateContent` endpoint in `background.js` for lightweight streaming, and use a unique `utteranceId` to map responses to the correct UI cards.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Gemini API | v1beta | LLM Integration | Specified for Phase 5; supports streaming and 2.0 Flash. |
| Fetch API | Native | HTTP Requests | Standard browser API for Service Workers; supports SSE streams. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| config.js | Project | API Key Management | Existing project pattern for hardcoded keys [VERIFIED: Phase 1 Context]. |

**Installation:**
No new packages required. `google-generative-ai` SDK is optional; `fetch` is recommended for lower overhead in the Service Worker.

## Architecture Patterns

### Recommended Message Flow
1. **Utterance Finalized**: `content.js` calls `finalizeCurrentCard()`.
2. **Trigger LLM**: `content.js` sends `PROCESS_UTTERANCE` message to `background.js` with `text` and `utteranceId`.
3. **API Call**: `background.js` calls Gemini `streamGenerateContent`.
4. **Stream Relay**: As chunks arrive, `background.js` sends `AI_RESPONSE_CHUNK` to the active tab with `utteranceId`, `text`, and (once known) `type` (Answer/Suggestion).
5. **UI Update**: `content.js` finds the card by `utteranceId` and appends text to its AI response section.

### Pattern 1: Streaming SSE with Fetch
**What:** Process the body of a `fetch` response as a `ReadableStream`.
**When to use:** Handling real-time AI token generation.
**Example:**
```javascript
// Source: [CITED: developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams]
const response = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  // Process Gemini's JSON-delimited SSE format
}
```

### Pattern 2: Classification via System Prompt
**What:** Steering the model to distinguish between input types in a single pass.
**When to use:** To fulfill AI-01, AI-02, and AI-05 without multiple API calls.
**Prompt Example:**
```text
System Instruction: 
Classify the user utterance as a QUESTION or a STATEMENT.
- If it is a QUESTION: Provide a concise, helpful answer.
- If it is a STATEMENT: Provide 2-3 short, relevant follow-up suggestions or insights.
Prefix your response with [ANSWER] or [SUGGESTION] to indicate the classification.
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Question Detection | Regex/NLTK | Gemini System Prompt | AI is far better at detecting intent/context than static rules. |
| JSON Streaming | Custom Parser | standard JSON.parse on chunks | Gemini returns discrete JSON objects in its stream (delimited by `\n`). |

## Common Pitfalls

### Pitfall 1: Service Worker Termination
**What goes wrong:** The Service Worker might sleep during a long LLM generation.
**How to avoid:** In MV3, the SW stays alive as long as it's actively processing a message or a request. However, `chrome.runtime.connect` (Ports) provides a more reliable 5-minute window if needed.
**Warning signs:** Partial responses or "Extension context invalidated" errors.

### Pitfall 2: Concurrent Utterances
**What goes wrong:** If two people speak quickly, their responses might get mixed up in the UI.
**How to avoid:** Always pass a unique `utteranceId` (e.g., `Date.now()`) from the content script to the background and back.

### Pitfall 3: API Key Security
**What goes wrong:** Committing `config.js` to GitHub.
**How to avoid:** Ensure `.gitignore` includes `config.js` [VERIFIED: .gitignore exists].

## Code Examples

### Gemini Streaming Request (Fetch)
```javascript
// Source: [CITED: ai.google.dev/gemini-api/docs/quickstart]
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${CONFIG.GEMINI_API_KEY}`;

const payload = {
  contents: [{ parts: [{ text: utteranceText }] }],
  systemInstruction: { parts: [{ text: "..." }] },
  generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
};

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

// Process response.body reader...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Gemini 1.5 Flash | Gemini 2.0 Flash | Dec 2024 | Faster response times, better reasoning, lower latency for streaming. |
| full-text response | streamGenerateContent | - | Essential for "Real-time" feel in UI. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `config.js` can be imported via `importScripts` in `background.js` | Architecture | If SW is marked as module, `importScripts` will fail; `import` must be used instead. |
| A2 | Gemini 2.0 Flash is available via `v1beta` endpoint | Core | Model name might change or require different region/API version. |

## Open Questions

1. **Handling non-text parts?**
   - What we know: Gemini supports audio/image input.
   - What's unclear: Should we send raw audio snippets or just transcription?
   - Recommendation: Use transcription only for Phase 5 to keep latency low.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Gemini API | LLM Logic | ✓ | v1beta | — |
| Chrome Browser | Extension Environment | ✓ | v120+ (test machine) | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | — |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | Question -> Answer | Manual | Verify in panel UI | ❌ |
| AI-02 | Statement -> Suggestion | Manual | Verify in panel UI | ❌ |
| AI-03 | Streaming tokens | Manual | Observe real-time update | ❌ |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Yes | Treat LLM output as untrusted; use `textContent` instead of `innerHTML`. |
| V13 API Security | Yes | API keys stored in `config.js` (gitignored). |

### Known Threat Patterns for Gemini

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt Injection | Tampering | Clear separation between system instructions and user input. |
| Information Disclosure | Info Disclosure | Do not include sensitive system info in prompts. |

## Sources

### Primary (HIGH confidence)
- ai.google.dev - [Gemini 2.0 Flash API documentation]
- chrome.com - [Extension Messaging & Service Workers]
- .planning/phases/01-extension-scaffold/01-CONTEXT.md - [Key management decisions]

### Secondary (MEDIUM confidence)
- MDN - [Streams API Fetch documentation]
