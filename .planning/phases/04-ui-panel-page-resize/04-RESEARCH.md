# Phase 4: UI Panel & Page Resize - Research

**Researched:** 2026-04-11
**Domain:** Chrome Extension UI, DOM Manipulation, CSS Layout, Responsive Design
**Confidence:** HIGH

## Summary

The goal of Phase 4 is to make the injected transcript panel feel like a native part of the browser by shifting the page content to the left to accommodate the fixed 350px panel on the right. This prevents the panel from overlapping with important page content, such as a YouTube video player or a Google Meet grid. 

The primary challenge is that `position: fixed` elements on host pages (e.g., sticky headers) do not respect `margin-right` on the `html` or `body` tags, as they are positioned relative to the viewport. This research identifies a robust "JS Shift" strategy to handle these elements, along with site-specific optimizations for popular platforms like YouTube and Google Meet.

**Primary recommendation:** Use `margin-right: 350px` on the `html` element for general content shifting, and implement a `MutationObserver`-backed helper function to identify and offset `position: fixed` elements pinned to the right. Always trigger a `window.resize` event when toggling the panel to force site-specific layout re-calculation.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | Fixed 350px panel on the right side of the screen | Verified CSS `position: fixed` approach with `right: 0` and max `z-index`. |
| UI-02 | Page content shifts left to accommodate the panel (no overlap) | Identified `margin-right` on `html` + "JS Shift" for `fixed` elements. |
| UI-03 | Responsive behavior (panel handles window resizing) | Panel uses `100vh` and viewport-relative positioning; `window.resize` triggers host reflow. |
| UI-04 | Toggleable panel visibility | Documented integrated toggle logic for CSS and layout shifts. |
</phase_requirements>

## User Constraints

*(Extracted from requirements and technical details)*

- **UI-01:** Fixed 350px panel on the right side of the screen.
- **UI-02:** Page content shifts left to accommodate the panel (no overlap).
- **UI-03:** Responsive behavior (panel handles window resizing).
- **UI-04:** Toggleable panel visibility.
- **Page Resize:** Apply `margin-right: 350px` to `html` or `body`.
- **Panel Isolation:** Shadow DOM (already implemented).
- **CSS:** `position: fixed`, `right: 0`, `top: 0`, `height: 100vh`, `width: 350px`.
- **SPA compatibility:** Handle dynamic page changes (e.g., YouTube sidebar).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JavaScript | N/A | DOM manipulation and events | Minimize bundle size; no build step required as per constraints. |
| CSS Flexbox/Grid | N/A | Panel and card layout | Standard for modern, responsive layouts within the Shadow DOM. |
| Shadow DOM v1 | N/A | Component isolation | Prevents host site CSS from breaking the extension UI and vice-versa [VERIFIED: Phase 3]. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MutationObserver | N/A | Dynamic element detection | Necessary for handling SPAs where fixed elements are added/removed dynamically. |

## Architecture Patterns

### Recommended Project Structure
(Phase 4 updates to existing structure)
```
src/
├── transcript-panel.js  # Updated with layout toggle logic
├── content.js           # Updated with MutationObserver and resize logic
└── styles/              # CSS strings for panel and host-page adjustments
```

### Pattern 1: The "JavaScript Shift" for Fixed Elements
**What:** A utility function that finds elements with `position: fixed` and `right: 0` (or similar) and increases their offset to match the panel width.
**When to use:** Whenever the panel is shown/hidden.
**Example:**
```javascript
// Source: Based on community best practices for sidebars
function shiftFixedElements(offset) {
  const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
    // Only check elements that are likely to be headers/overlays
    if (el.id === 'audio-ai-panel-host') return false;
    const style = window.getComputedStyle(el);
    return style.position === 'fixed' && style.right !== 'auto';
  });

  fixedElements.forEach(el => {
    const currentRight = parseInt(el.dataset.originalRight || window.getComputedStyle(el).right) || 0;
    if (!el.dataset.originalRight) el.dataset.originalRight = currentRight + 'px';
    el.style.right = (currentRight + offset) + "px";
  });
}
```

### Anti-Patterns to Avoid
- **Overriding `body` margin only:** Many sites set `body { width: 100% !important; }`, which can break if you only apply `margin-right` to `body`. Applying it to `html` is more robust [CITED: css-tricks.com].
- **Using `!important` indiscriminately:** While necessary for some overrides, use it sparingly on host elements to avoid breaking site functionality.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Viewport Resizing | Custom iframe logic | `margin-right` on `html` + `window.resize` event | Simpler to maintain and less prone to cross-origin issues than iframes. |
| Complex YouTube Shifting | Generic selectors only | Site-specific selectors (e.g., `ytd-masthead`) | YouTube's header is a custom element that doesn't always respond to generic `fixed` queries [VERIFIED: Community patterns]. |

## Common Pitfalls

### Pitfall 1: Fixed Overlays
**What goes wrong:** Site headers or chat widgets stay pinned to the right edge of the window, overlapping the panel.
**Why it happens:** `position: fixed` is relative to the viewport, ignoring parent margins.
**How to avoid:** Implement the `shiftFixedElements` helper and run it on a debounced `MutationObserver`.

### Pitfall 2: YouTube Video Reflow
**What goes wrong:** The video player doesn't resize correctly when the sidebar opens, cutting off the video.
**Why it happens:** YouTube calculates player size in JavaScript based on window width.
**How to avoid:** Dispatch a real `window.resize` event after applying the CSS margin [CITED: official Chrome extension docs for sidebars].

### Pitfall 3: `z-index` Conflicts
**What goes wrong:** A site's dropdown menu or modal appears *behind* the extension panel.
**Why it happens:** Some sites use very high `z-index` values.
**How to avoid:** Set the panel's `z-index` to the maximum allowed value (`2147483647`).

## Code Examples

### Integrated Toggle Logic
```javascript
function togglePanelLayout(isVisible) {
  const width = 350;
  const offset = isVisible ? width : 0;
  
  // 1. Shift the root element
  document.documentElement.style.marginRight = offset + 'px';
  document.documentElement.style.transition = 'margin-right 0.3s ease-in-out';
  
  // 2. Handle fixed elements
  shiftFixedElements(offset);
  
  // 3. Force site re-layout (YouTube/Meet)
  window.dispatchEvent(new Event('resize'));
}
```

### Site-Specific Tweaks
```javascript
// YouTube Header specific fix
const ytHeader = document.querySelector('ytd-masthead#masthead');
if (ytHeader) {
  ytHeader.style.marginRight = offset + 'px';
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `iframe` injection | Shadow DOM + Injected Div | ~2020 (v3 focus) | Better security, easier communication. |
| `body` margin only | `html` margin + fixed shift | N/A | Handles modern fixed-position web apps. |
| Chrome-specific hacks | `chrome.sidePanel` API | 2023 (M114) | Official support for viewport resizing (but loses in-page DOM context). |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `margin-right` on `html` is preferred over `body` | Summary | Minor layout issues on some sites. |
| A2 | `window.resize` event is sufficient for YouTube player reflow | Pitfalls | Video might stay small/large until manual resize. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Chrome Browser | Manifest v3 Support | ✓ | 114+ | — |
| Shadow DOM v1 | Isolation | ✓ | Supported | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual Verification / Playwright (optional) |
| Config file | N/A |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Panel is 350px fixed right | Smoke | N/A | Manual |
| UI-02 | Page content shifts left | Visual | N/A | Manual |
| UI-03 | Content stays valid on resize | Visual | N/A | Manual |
| UI-04 | Toggle hides/shows panel + layout | Functional | N/A | Manual |

## Security Domain

### Applicable ASVS Categories
- **V5 Input Validation:** Not directly applicable to layout, but ensured via Shadow DOM isolation.
- **V11 Business Logic:** Ensuring the panel doesn't block "Stop" buttons on the host page (e.g., Leave Meeting in Meet).

### Known Threat Patterns
- **Clickjacking:** Ensure the panel doesn't cover security-critical buttons on the host page.
- **Style Injection:** Use Shadow DOM to prevent host page from styling the panel.

## Sources

### Primary (HIGH confidence)
- MDN: [Shadow DOM API](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- Chrome Developers: [Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- CSS-Tricks: [Handling Fixed Elements in Layouts](https://css-tricks.com/)

### Secondary (MEDIUM confidence)
- StackOverflow: [Chrome extension sidebar fixed element shift](https://stackoverflow.com/questions/22538473/how-to-shift-the-content-of-a-page-to-the-left-when-a-sidebar-is-shown)
- Community forums for YouTube extension developers.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vanilla JS/CSS is the project baseline.
- Architecture: HIGH - Shifting fixed elements is a well-solved problem in the extension ecosystem.
- Pitfalls: MEDIUM - Every site is slightly different; site-specific tweaks will be ongoing.

**Research date:** 2026-04-11
**Valid until:** 2026-05-11
