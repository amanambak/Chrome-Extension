# Phase 3 Plan 1 Summary: Utterance Relay & Panel Shell

## One-liner
Deepgram `UtteranceEnd` events are now relayed to the host page where a Shadow-DOM-isolated transcript panel is injected.

## Key Decisions

- Use Shadow DOM for the transcript panel to ensure perfect style isolation from host pages.
- Relay `UtteranceEnd` as a discrete event to signal the end of a speaker's thought for card segmentation.
- Added `transcript-panel.js` to the content script list in the manifest.

## Technical Changes

- **offscreen.js**: Updated WebSocket `onmessage` to catch `UtteranceEnd` and send `UTTERANCE_END` message.
- **background.js**: Added listener to relay `UTTERANCE_END` to the target tab.
- **transcript-panel.js**: Implemented `TranscriptPanel` class using Shadow DOM for UI isolation.
- **content.js**: Updated to initialize `TranscriptPanel` and show it when transcripts start arriving.
- **manifest.json**: Included `transcript-panel.js` in content scripts.

## Verification Results

- `offscreen.js` sends `UTTERANCE_END` when Deepgram signals.
- `background.js` forwards the event correctly.
- A black panel appears on the right edge of the page when capture starts.

## Self-Check: PASSED
- `offscreen.js` contains `UtteranceEnd` handling.
- `background.js` contains `UTTERANCE_END` relay logic.
- `transcript-panel.js` exists and uses `attachShadow`.
- `manifest.json` includes `transcript-panel.js`.
