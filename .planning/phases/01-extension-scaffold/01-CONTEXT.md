# Phase 1: Extension Scaffold - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a loadable Chrome MV3 extension with the correct flat file structure, all required permissions declared in `manifest.json`, a minimal info popup (name + status), and stub files for background service worker, offscreen document, and content script. No audio, transcription, or AI logic — skeleton only.

</domain>

<decisions>
## Implementation Decisions

### API Key Management
- **Keys are hardcoded in `config.js`** — no user-facing settings popup or key entry UI
- This overrides CONF-01 through CONF-04 from REQUIREMENTS.md (the popup-based key entry requirements are dropped for this build)
- `config.js` lives at the root level and is imported by any script that needs API access (background, offscreen, content)
- Keys are never read from `chrome.storage.local` — they come from the file directly

### Extension Popup (Icon Click)
- Clicking the extension toolbar icon opens a minimal popup
- Popup displays: **extension name + active/inactive status only**
- No inputs, no settings, no instructions — purely informational

### File Structure
- **Flat** — all files at the root level of the extension directory
- No subfolders (`/popup/`, `/src/`, `/offscreen/` etc.)
- Expected root files: `manifest.json`, `config.js`, `background.js`, `content.js`, `offscreen.html`, `offscreen.js`, `popup.html`, `popup.js`

### Manifest Permissions
- Required permissions per roadmap: `tabCapture`, `offscreen`, `storage`, `scripting`
- All declared in `manifest.json` upfront — even if not yet used in Phase 1 stubs

### Claude's Discretion
- Popup styling (colors, fonts, dimensions)
- Status detection logic in popup.js (how it reads active/inactive state)
- Exact content of stub files (minimal valid JS, no placeholder logic)
- Icon assets (can use a simple placeholder if no icon is provided)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### MV3 Structure & Permissions
- `.planning/research/ARCHITECTURE.md` — MV3 architecture decisions, offscreen document rationale, message passing design
- `.planning/research/STACK.md` — Confirmed tech stack, API choices, MV3 constraints
- `.planning/research/PITFALLS.md` — Critical pitfalls to avoid (especially service worker termination, audio passthrough)
- `.planning/research/SUMMARY.md` — Full stack recommendation and build order

### Requirements (now partially overridden)
- `.planning/REQUIREMENTS.md` — CONF-01 to CONF-04 are **overridden**: keys are hardcoded in config.js, not entered via popup. All other requirements remain valid.
- `.planning/ROADMAP.md` §Phase 1 — Success criteria and planned file list for this phase

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — blank slate, no existing code

### Established Patterns
- None yet — this phase establishes the baseline patterns for all future phases

### Integration Points
- `config.js` → imported by `background.js`, `offscreen.js`, and `content.js` in later phases
- `background.js` (Service Worker) → receives messages from content script, manages offscreen document lifecycle
- `offscreen.js` → handles all audio processing (AudioContext, AudioWorklet) in Phase 2
- `content.js` → injects the UI panel in Phase 4; receives transcript events from SW

</code_context>

<specifics>
## Specific Ideas

- No specific visual references — popup is purely functional (name + status)
- Keys go in `config.js` at root — this is the developer's own personal build, not distributed to end users

</specifics>

<deferred>
## Deferred Ideas

- Popup settings UI with key entry — originally CONF-01 to CONF-04; dropped entirely for this build (keys hardcoded)
- Dark mode for popup — v2 consideration
- Extension icon with recording state badge — Phase 2 (when capture pipeline exists)

</deferred>

---

*Phase: 01-extension-scaffold*
*Context gathered: 2026-04-10*
