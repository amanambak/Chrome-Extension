# Phase 3 Plan 2 Summary: Utterance Card & State Machine

## One-liner
Transcription is now rendered into the panel using a robust state machine that manages interim updates, final text appending, and card segmentation.

## Key Decisions

- Use `UtteranceCard` instances to encapsulate individual segments, preventing merged utterances.
- Segment cards based on Deepgram's `speech_final` flag (fast response) AND the `UtteranceEnd` event (reliable fallback/boundary).
- Added `utterance-card.js` to the manifest content scripts list.
- CSS isolation via Shadow DOM now covers card styles, ensuring a consistent theme.

## Technical Changes

- **utterance-card.js**: New class for individual cards, separating stable vs interim text with `textContent`.
- **transcript-panel.js**: Added `addCard` method and extensive CSS for the transcription UI.
- **content.js**: Implemented `finalizeCurrentCard` logic and a message-driven state machine to drive card creation and updates.
- **manifest.json**: Included `utterance-card.js`.

## Verification Results

- Interim text updates are visible (italic/gray).
- Finalized text is appended (white).
- Pauses result in new cards being created.
- Auto-scroll keeps the newest card in view.

## Self-Check: PASSED
- `utterance-card.js` uses `textContent`.
- `content.js` handles `TRANSCRIPT_UPDATE` and `UTTERANCE_END`.
- New cards appear on speech.
