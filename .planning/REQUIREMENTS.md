# Requirements: Audio AI Chrome Extension

**Defined:** 2026-04-10
**Core Value:** When audio is playing, users get instant AI answers to questions and smart suggestions for statements — without ever switching tabs or copying text.

## v1 Requirements

### Audio Capture

- [x] **CAPT-01**: User can start capturing audio from the current tab via the toggle button
- [x] **CAPT-02**: Audio playback on the tab continues uninterrupted while capturing is active
- [x] **CAPT-03**: A visible indicator (pulsing dot or icon badge) shows when capture is active
- [x] **CAPT-04**: User can stop capture at any time via the same toggle button

### Transcription

- [ ] **TRNS-01**: Interim transcript appears in the panel in real-time as speech is happening
- [ ] **TRNS-02**: Finalized transcript is displayed when an utterance ends
- [ ] **TRNS-03**: Each utterance is displayed as a separate card (never merged with adjacent utterances)

### AI Responses

- [ ] **AI-01**: Questions detected in the transcript trigger an AI-generated answer displayed inline beneath the utterance card
- [ ] **AI-02**: Statements detected in the transcript trigger an AI-generated suggestion displayed inline beneath the utterance card
- [ ] **AI-03**: AI responses stream progressively (text appears token-by-token as it generates)
- [ ] **AI-04**: A loading indicator is shown while the AI is generating a response
- [ ] **AI-05**: Each AI response is labeled "Answer" or "Suggestion" as a badge

### UI Panel

- [x] **UI-01**: Extension injects a panel into the page; page content shifts right (viewport resize, not overlay)
- [x] **UI-02**: A prominent start/stop toggle button is displayed in the panel header
- [x] **UI-03**: Transcript and AI response are visually separated within each utterance card
- [x] **UI-04**: The panel is scrollable as content accumulates
- [ ] **UI-05**: Panel has a close/collapse button to dismiss it

### Configuration

- [ ] **CONF-01**: User can enter a Deepgram API key in the extension popup settings page
- [ ] **CONF-02**: User can enter a Gemini API key in the extension popup settings page
- [ ] **CONF-03**: API keys are stored locally in `chrome.storage.local` and never transmitted to third-party servers
- [ ] **CONF-04**: Extension displays a clear error/prompt if required API keys are not yet configured

### UX Polish

- [ ] **UX-01**: Each AI response card has a copy-to-clipboard button
- [ ] **UX-04**: Graceful error messages are shown when Deepgram or Gemini API calls fail

## v2 Requirements

### Transcription

- **TRNS-04**: Timestamp is displayed on each utterance segment card

### UX Polish

- **UX-02**: Dark mode support for the injected panel
- **UX-03**: Panel width is adjustable via a drag handle

### Advanced Features

- **ADV-01**: Topic continuity detection — visually group related follow-up utterances
- **ADV-02**: Conversation history context window — include last N utterances as LLM context
- **ADV-03**: Expandable/collapsable AI response panels per card

## Out of Scope

| Feature | Reason |
|---------|--------|
| Audio recording or saving | Privacy risk; ephemeral transcription is the design intent |
| Speaker diarization | Overcomplicates segmentation for v1; Deepgram supports it in v2+ |
| Multi-tab simultaneous capture | Architecture complexity; one source at a time is sufficient |
| Custom LLM / STT selection | Fixed to Gemini Flash Lite + Deepgram Nova-3 for v1 |
| Firefox / mobile support | Chrome-only by design; MV3 APIs are Chrome-specific |
| Chrome Web Store publishing | Out of scope for v1 development |
| Backend proxy for API keys | v1 accepts local key storage; proxy is a v2 security upgrade |

## Traceability

*(Populated during roadmap creation)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONF-01 | Phase 1 | Pending |
| CONF-02 | Phase 1 | Pending |
| CONF-03 | Phase 1 | Pending |
| CONF-04 | Phase 1 | Pending |
| CAPT-01 | Phase 2 | Complete |
| CAPT-02 | Phase 2 | Complete |
| CAPT-03 | Phase 2 | Complete |
| CAPT-04 | Phase 2 | Complete |
| TRNS-01 | Phase 3 | Pending |
| TRNS-02 | Phase 3 | Pending |
| TRNS-03 | Phase 3 | Pending |
| UI-01 | Phase 4 | Complete |
| UI-02 | Phase 4 | Complete |
| UI-03 | Phase 4 | Complete |
| UI-04 | Phase 4 | Complete |
| UI-05 | Phase 4 | Pending |
| AI-01 | Phase 5 | Pending |
| AI-02 | Phase 5 | Pending |
| AI-03 | Phase 5 | Pending |
| AI-04 | Phase 5 | Pending |
| AI-05 | Phase 5 | Pending |
| UX-01 | Phase 6 | Pending |
| UX-04 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-10*
*Last updated: 2026-04-10 after initial definition*
