# FEATURES.md — Audio AI Chrome Extension

## Table Stakes (Must Have — Users Expect These)

### Core Capture
- Tab audio capture (YouTube, Meet, Teams, Zoom) via `chrome.tabCapture`
- Start/stop toggle — explicit user initiation for privacy
- Clear visual indicator when actively listening (red dot / pulsing icon)
- Audio playback must continue while capturing (reconnect stream to AudioContext.destination)

### Transcription Display
- Real-time interim transcription (appears as user speaks)
- Finalized transcript display when utterance ends
- Visual separation between separate utterances/questions
- Timestamps on each segment

### AI Responses
- Detect question vs. statement from transcript text
- Answer questions inline beneath the utterance
- Generate suggestions/follow-ups for statements
- Streaming LLM output (text appears progressively, not all at once)
- Loading indicator while AI is generating

### UI Panel
- Panel appears on right side, page content shifts (not overlay)
- Toggle button to start/stop listening
- Scrollable transcript + AI response feed
- Close/minimize button

### Configuration
- API key input (Deepgram + Gemini) — stored in `chrome.storage.local`
- Keys stored locally, never transmitted to any third-party server

---

## Differentiators (Competitive Advantage)

### Segmentation Intelligence  
- Smart utterance boundary detection — don't merge two separate questions
- Topic continuity detection: "Is this response relevant to the previous segment?"
- Group related follow-up questions visually

### Response Quality
- Context window: include last N utterances as context for LLM
- Distinguish "question" patterns: rising intonation, "how", "what", "why", "can you"
- Response type label: "Answer" vs "Suggestion" badge per response

### UX Polish
- Copy-to-clipboard on each AI response
- Expandable/collapsable AI response panels
- Panel width adjustable (drag handle)
- Dark mode support

---

## Anti-Features (Deliberately NOT Building v1)

| Feature | Reason |
|---------|--------|
| Audio recording/saving | Privacy risk; adds complexity; not requested |
| Speaker diarization | Overkill for v1; Deepgram supports it but complicates segmentation |
| Multi-tab simultaneous capture | Architecture complexity; one source is enough |
| Custom model selection | User chose fixed Gemini Flash Lite |
| Chrome Web Store publishing | Out of scope for v1 dev |
| Mobile/Firefox | Chrome-only by design |
