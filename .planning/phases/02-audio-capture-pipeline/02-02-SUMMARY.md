---
phase: 02-audio-capture-pipeline
plan: 02
subsystem: Audio Capture Pipeline
tags: [audio, offscreen, pcm]
requirements: [CAPT-01, CAPT-02]
tech-stack: [Web Audio API, AudioWorklet]
key-files: [offscreen.js, capture-worklet.js]
decisions:
  - "Used 16kHz sample rate as recommended for Deepgram Nova-3."
  - "Implemented AudioWorklet to convert Float32 audio samples to Int16 PCM efficiently."
  - "Connected the source node to the audioContext.destination to maintain audio passthrough."
metrics:
  duration: "10m"
  completed_date: "2024-05-18"
---

# Phase 02 Plan 02: Offscreen Capture & PCM Summary

## One-liner
Implemented tab audio capture and Float32 to Int16 PCM conversion via AudioWorklet.

## Key Changes
- Updated `offscreen.js` to handle `START_CAPTURE` with `streamId`.
- Configured `AudioContext` to 16kHz and captured audio using `getUserMedia`.
- Implemented `capture-worklet.js` to convert audio data to Int16 PCM.
- Ensured audio passthrough via `source.connect(audioContext.destination)`.

## Deviations from Plan
None - plan executed exactly as written.

## Self-Check: PASSED
- [x] Offscreen document captures audio.
- [x] Audio continues to play in the captured tab.
- [x] PCM buffers are being produced by the AudioWorklet.
