// config.template.js — Copy this to config.js and fill in your API keys.
// config.js is gitignored (contains real keys). This template is committed instead.
//
// 1. Copy: cp config.template.js config.js
// 2. Fill in your keys below
// 3. Never commit config.js

const CONFIG = {
  DEEPGRAM_API_KEY: "YOUR_DEEPGRAM_API_KEY_HERE",
  GEMINI_API_KEY: "YOUR_GEMINI_API_KEY_HERE",

  // Deepgram WebSocket parameters (tuned per research/PITFALLS.md)
  DEEPGRAM_WS_URL: "wss://api.deepgram.com/v1/listen",
  DEEPGRAM_PARAMS: {
    model: "nova-3",
    language: "multi",
    utterance_end_ms: 1000,
    endpointing: 100,
    encoding: "linear16",
    sample_rate: 16000,
  },

  // Gemini model
  GEMINI_MODEL: "gemini-3.1-flash-lite-preview",
};
// 