# Phase 5 Plan 3: End-to-End Wiring Summary

Connected the transcription pipeline with the Gemini AI streaming service, enabling automatic generation and real-time display of AI responses.

## Key Changes

### utterance-card.js
- Updated `UtteranceCard` to accept and store a unique `id`.
- Added `data-utterance-id` attribute to the card element for DOM-level tracking.

### content.js
- Implemented `aiCards` Map to manage the association between transcription segments and AI responses.
- Enhanced `TRANSCRIPT_UPDATE` to generate unique `utteranceId`s for each new card.
- Updated `finalizeCurrentCard` to trigger the AI process:
    - Extracts the finalized text.
    - Sends a `PROCESS_UTTERANCE` message to `background.js` with the text and `utteranceId`.
- Added listeners for AI streaming events:
    - `AI_RESPONSE_CHUNK`: Lazily creates an `AiResponseCard` if it doesn't exist, then appends the incoming text chunk and auto-scrolls the panel.
    - `AI_RESPONSE_ERROR`: Displays error messages within the appropriate AI card.
- Handled `UTTERANCE_END` by finalizing the current card and triggering AI.

## Verification Results

### Automated Tests
- Verified `content.js` correctly generates IDs and sends `PROCESS_UTTERANCE`.
- Verified `AI_RESPONSE_CHUNK` listener correctly routes chunks to the matching `AiResponseCard`.
- Verified `UtteranceCard` stores and exposes the `id`.

## Deviations
- None.

## Self-Check: PASSED
- `utterance-card.js` modified.
- `content.js` modified.
- End-to-end integration complete.
- Streaming UI is functional and linked to source transcripts.
