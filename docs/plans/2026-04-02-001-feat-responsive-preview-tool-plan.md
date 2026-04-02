---
title: "feat: Add multi-viewport responsive preview tool"
type: feat
status: active
date: 2026-04-02
origin: docs/brainstorms/2026-04-02-responsive-preview-tool-requirements.md
---

# feat: Add Multi-Viewport Responsive Preview Tool

## Overview

Add a live multi-viewport preview page and a screenshot snapshot tool to responsive-craft. This closes the core gap the skill was built to compensate for: the inability to see all breakpoints simultaneously when working in code.

Two capabilities: (1) an HTML preview page that displays a URL at 4-5 viewport widths side by side with live hot-reload, and (2) a snapshot script that captures screenshots at each breakpoint for before/after comparison.

## Problem Frame

Code-first responsive development lacks a visual canvas. Developers resize manually, check one viewport at a time, or jump between DevTools presets. responsive-craft compensates with process (describe before you code, test by dragging). This tool compensates with tooling — giving the same "all breakpoints at once" view that Framer provides on its canvas. (see origin: `docs/brainstorms/2026-04-02-responsive-preview-tool-requirements.md`)

## Requirements Trace

- R1. Single HTML page with 4-5 side-by-side iframes at standard breakpoints
- R2. Each iframe labeled with viewport width and descriptive name
- R3. Works with localhost dev servers (hot reload propagates into iframes)
- R4. Works with static HTML files via lightweight local server
- R5. Breakpoints configurable via CLI flags
- R6. Preview page itself is responsive (horizontal scroll on narrow monitors)
- R7. Capture full-page screenshots at each breakpoint using dev-browser
- R8. Save individual PNGs per breakpoint
- R9. Generate tiled composite image
- R10. Support `--before` flag for baseline snapshots
- R11. Before/after comparison as side-by-side HTML
- R12. Comparison output shareable as a single HTML file
- R13. Skill can invoke tools during workflows
- R14. Tools usable standalone via CLI
- R15. Lives in `scripts/` directory within responsive-craft

## Scope Boundaries

- Not a browser testing framework — no assertions, no CI integration
- Not simulating real device behavior (touch events, safe areas, browser chrome)
- Chrome only via dev-browser — no cross-browser comparison
- Screenshots only — no video recording
- No npm package or install step — pure Node.js scripts with zero dependencies

## Context & Research

### Relevant Patterns

- **dev-browser CLI** — Kyle's standard for browser automation. Sandboxed Playwright with AI-agent optimization. Available on the machine. Used for screenshot capture.
- **`${CLAUDE_SKILL_DIR}`** — Skill spec variable that resolves to the skill's directory. Used to reference scripts from within SKILL.md.
- **iframe cross-origin** — A local HTML page (`file://`) or served page can iframe `http://localhost:*` for display. The parent can't read iframe content (cross-origin), but doesn't need to — just displays it. Hot reload from Vite/Next.js propagates into iframes automatically.

### External References

- `open` CLI (macOS) — opens URLs/files in the default browser
- Node.js `http.createServer` — zero-dependency static file server
- Playwright `page.screenshot({ fullPage: true })` — captures full-page screenshots at any viewport width

## Key Technical Decisions

- **Zero dependencies**: All scripts use only Node.js built-ins and dev-browser. No npm install, no package.json, no Sharp, no ImageMagick. This keeps the tool extractable and self-contained. (see origin: key decision "Start as skill scripts, extract later")
- **HTML iframes for preview**: Simplest possible approach. Each iframe gets a fixed width matching a breakpoint. The iframes are flex-wrapped in a container with horizontal scroll. No Electron, no custom browser shell. (see origin: key decision "HTML + iframes for live preview")
- **dev-browser for snapshots**: Consistent with Kyle's browser automation preferences. Provides Playwright's `setViewportSize` + `screenshot` API. (see origin: key decision "dev-browser for snapshots")
- **Tiling via HTML-to-screenshot**: To generate the composite image, render an HTML page that lays out the individual PNGs side by side, then screenshot that page with dev-browser. Avoids adding Sharp or ImageMagick as dependencies.
- **Side-by-side HTML for comparison**: Before/after diff is a static HTML page showing baseline and current screenshots at each breakpoint. More useful than a flat image — zoomable, shareable, scrollable. Pixel-diff highlighting deferred to later if demand exists.
- **CLI flags for breakpoints**: Default set baked in (375, 768, 1024, 1440). Override with `--breakpoints 320,768,1024,1440,1920`. No config file for v1.

## Open Questions

### Resolved During Planning

- **Static file serving approach**: Built-in Node `http.createServer` with `fs.readFile`. ~20 lines, zero dependencies. MIME types for .html, .css, .js, .png, .jpg, .svg, .json cover all common cases.
- **Composite image generation**: Render an HTML page containing `<img>` tags for each screenshot, then capture that page with dev-browser. The HTML page itself can also serve as the shareable composite artifact (R12).
- **How skill invokes scripts**: `node ${CLAUDE_SKILL_DIR}/scripts/preview.js <url>` and `node ${CLAUDE_SKILL_DIR}/scripts/snapshot.js <url>`. Documented in SKILL.md under a new "## Tools" section.

### Deferred to Implementation

- **Exact iframe sizing CSS**: The preview page needs to handle the case where the monitor is narrower than the sum of all iframe widths. Horizontal scroll is the plan, but exact CSS (flex-wrap vs overflow-x vs grid) will be determined during implementation.
- **dev-browser CLI exact invocation syntax**: Need to confirm the exact command format for `dev-browser screenshot` or equivalent. Will test during implementation.
- **Static server port selection**: Use a random available port or a fixed default (e.g., 8787)? Will decide during implementation based on what's simplest.

## Implementation Units

- [ ] **Unit 1: Preview HTML page**

**Goal:** Create the core multi-viewport preview page that displays any URL at multiple widths simultaneously.

**Requirements:** R1, R2, R3, R5, R6

**Dependencies:** None

**Files:**
- Create: `scripts/preview.html`

**Approach:**
- Single self-contained HTML file (no external dependencies)
- Read target URL from query parameter: `preview.html?url=http://localhost:3000&breakpoints=375,768,1024,1440`
- Default breakpoints baked in: `[375, 768, 1024, 1440]`
- For each breakpoint, create an iframe with that exact width, wrapped in a labeled container
- Labels show width + name (e.g., "375px — Mobile", "768px — Tablet", "1024px — Laptop", "1440px — Desktop")
- Outer container uses flexbox with `overflow-x: auto` for horizontal scrolling when iframes exceed monitor width
- Include a minimal toolbar: target URL display, refresh all button, breakpoint labels
- Inline all CSS and JS — no external files

**Patterns to follow:**
- Standard responsive iframe pattern: iframe `width` set explicitly, `height: 100%` of viewport minus toolbar
- Query param parsing with `URLSearchParams`

**Test scenarios:**
- Happy path: Open preview.html with `?url=http://localhost:3000` — 4 iframes render at 375, 768, 1024, 1440px widths with correct labels
- Happy path: Open with `?url=http://localhost:3000&breakpoints=320,768,1920` — 3 iframes at specified custom widths
- Edge case: Open with no `?url` parameter — shows a helpful message instead of blank iframes
- Edge case: Open with one breakpoint (`?breakpoints=375`) — renders a single iframe, no layout issues
- Edge case: Window narrower than smallest iframe — horizontal scroll activates, no content clipping

**Verification:**
- Page opens in browser and displays multiple viewport frames simultaneously
- Modifying source files on a running Vite/Next.js dev server causes all iframes to hot-reload

---

- [ ] **Unit 2: Static file server**

**Goal:** Enable previewing static HTML files that aren't served by a framework dev server.

**Requirements:** R4

**Dependencies:** None (can be built in parallel with Unit 1)

**Files:**
- Create: `scripts/serve-static.js`

**Approach:**
- Node.js `http.createServer` with `fs.readFile`
- Serve files from a specified directory (defaults to current working directory)
- MIME type mapping for common web files: `.html`, `.css`, `.js`, `.json`, `.png`, `.jpg`, `.gif`, `.svg`, `.woff`, `.woff2`
- Auto-select an available port (try 8787, increment if taken)
- Print the serving URL to stdout so the launcher can capture it
- Include a basic file-change watcher using `fs.watch` that injects a tiny live-reload script into served HTML files (a `<script>` tag that uses EventSource or polling to refresh on change)

**Patterns to follow:**
- Standard Node HTTP server pattern with `createServer` + `readFile`
- MIME type lookup via file extension map object

**Test scenarios:**
- Happy path: Run `node serve-static.js ./my-page/` — serves files on a local port, accessible in browser
- Happy path: Modify a served HTML file — browser reloads automatically
- Edge case: Port 8787 is occupied — server picks the next available port
- Edge case: Request for a file that doesn't exist — returns 404 with a useful message
- Error path: Directory path doesn't exist — exits with a clear error message

**Verification:**
- Static HTML file is accessible at `http://localhost:<port>/index.html`
- File changes trigger reload in the browser

---

- [ ] **Unit 3: Preview launcher script**

**Goal:** A single CLI entry point that opens the preview page in the default browser, starting the static server if needed.

**Requirements:** R4, R14

**Dependencies:** Unit 1, Unit 2

**Files:**
- Create: `scripts/preview.js`

**Approach:**
- Accept CLI args: `node preview.js <url-or-path> [--breakpoints 375,768,1024,1440]`
- Detect whether the argument is a URL (`http://` or `https://`) or a file path
- If URL: open `preview.html?url=<encoded-url>&breakpoints=<list>` in the default browser
- If file path: start `serve-static.js` targeting that directory, capture the port, then open the preview page pointing at the served URL
- The preview.html file itself is served by the static server (or opened as a local file if the target is already a URL)
- Use `child_process.exec('open <url>')` on macOS to open the browser

**Patterns to follow:**
- CLI argument parsing with `process.argv.slice(2)`
- `child_process.exec` for opening the browser

**Test scenarios:**
- Happy path: `node preview.js http://localhost:3000` — opens browser with preview page showing 4 iframes
- Happy path: `node preview.js ./index.html` — starts static server, opens preview page pointing at served URL
- Happy path: `node preview.js http://localhost:3000 --breakpoints 320,768,1920` — custom breakpoints passed through
- Edge case: File path with spaces — handled correctly
- Error path: Invalid file path — exits with error message

**Verification:**
- Running the script opens the multi-viewport preview in the default browser
- Both URL and file-path modes work without additional steps

---

- [ ] **Unit 4: Snapshot capture script**

**Goal:** Capture full-page screenshots at each breakpoint using dev-browser, save individual PNGs and a tiled composite.

**Requirements:** R7, R8, R9, R10, R14

**Dependencies:** None (independent of Units 1-3)

**Files:**
- Create: `scripts/snapshot.js`

**Approach:**
- Accept CLI args: `node snapshot.js <url> [--breakpoints 375,768,1024,1440] [--before] [--output ./snapshots]`
- For each breakpoint: use dev-browser to navigate to the URL, set viewport width, capture a full-page screenshot
- Save individual PNGs as `<page>-<width>.png` (e.g., `home-375.png`)
- If `--before` flag: save to a `before/` subdirectory instead of the main output directory
- Generate a composite: create a temporary HTML page that lays out all PNGs side by side with labels, then screenshot that page at a width large enough to contain all images
- Save the composite HTML as a shareable artifact alongside the PNG composite
- Use `child_process.execSync` to invoke dev-browser commands

**Patterns to follow:**
- dev-browser CLI for Playwright operations
- `fs.mkdirSync` with `{ recursive: true }` for output directories

**Test scenarios:**
- Happy path: `node snapshot.js http://localhost:3000` — creates 4 PNGs + 1 composite in `./snapshots/`
- Happy path: `node snapshot.js http://localhost:3000 --before` — saves to `./snapshots/before/`
- Happy path: Custom breakpoints — only captures at specified widths
- Edge case: Output directory doesn't exist — created automatically
- Edge case: URL is unreachable — exits with clear error (not a silent hang)
- Error path: dev-browser not installed — exits with helpful message explaining the dependency

**Verification:**
- Running the script produces individual PNGs at each breakpoint width
- Composite image/HTML contains all breakpoints tiled side by side with labels

---

- [ ] **Unit 5: Before/after comparison generator**

**Goal:** Generate a side-by-side comparison showing baseline vs current screenshots at each breakpoint.

**Requirements:** R10, R11, R12

**Dependencies:** Unit 4 (uses snapshot output)

**Files:**
- Modify: `scripts/snapshot.js` (add comparison mode)

**Approach:**
- When `snapshot.js` runs without `--before` and a `before/` directory exists, automatically generate a comparison
- Create an HTML page that shows before/after pairs at each breakpoint: before image on top, after image on bottom (or side by side if viewport allows)
- Include CSS for a slider/toggle between before and after (CSS-only, no JS dependency)
- Save as `comparison.html` in the output directory — self-contained, openable in any browser
- Also generate a flat composite PNG of the comparison using the same HTML-to-screenshot technique from Unit 4

**Patterns to follow:**
- Self-contained HTML with inline CSS (same approach as preview.html)

**Test scenarios:**
- Happy path: Run `snapshot --before`, make changes, run `snapshot` again — produces comparison.html showing before/after at each breakpoint
- Edge case: No `before/` directory exists — skip comparison generation, only produce current snapshots
- Edge case: Breakpoints changed between before and after runs — only compare breakpoints that exist in both sets
- Edge case: Number of before screenshots doesn't match current — compare matching widths, note missing ones

**Verification:**
- comparison.html opens in a browser and shows before/after pairs at each breakpoint
- Comparison is visually clear enough to identify responsive layout changes

---

- [ ] **Unit 6: Skill integration**

**Goal:** Update responsive-craft SKILL.md and workflows to reference the preview and snapshot tools.

**Requirements:** R13

**Dependencies:** Units 1-5

**Files:**
- Modify: `SKILL.md`
- Modify: `workflows/build-responsive.md`
- Modify: `workflows/transform-existing.md`

**Approach:**
- Add a `## Tools` section to SKILL.md documenting the two scripts and their usage
- In build-responsive.md: add a note in the verification step suggesting `node ${CLAUDE_SKILL_DIR}/scripts/preview.js` for live preview during development and `node ${CLAUDE_SKILL_DIR}/scripts/snapshot.js` for automated verification
- In transform-existing.md: add a note in the audit step suggesting snapshot capture for before/after comparison of responsive fixes
- Keep integration lightweight — the tools are optional enhancements, not required steps

**Patterns to follow:**
- Existing SKILL.md reference index pattern (table with "Load when" column)
- `${CLAUDE_SKILL_DIR}` variable from the skill spec

**Test scenarios:**

Test expectation: none — this unit modifies markdown documentation only, no behavioral code.

**Verification:**
- SKILL.md documents both tools with usage examples
- Both workflows reference the tools at appropriate points
- Tool paths use `${CLAUDE_SKILL_DIR}` for portability

## System-Wide Impact

- **Interaction graph:** The preview page iframes interact with the user's dev server via HTTP. No callbacks or middleware involved. The snapshot script invokes dev-browser as a child process — no persistent connection.
- **Error propagation:** If the target URL is unreachable, iframes show their native error state (browser's "can't reach" page). The snapshot script should catch dev-browser failures and report them clearly.
- **State lifecycle risks:** The `before/` snapshot directory is persistent state — if the user runs `--before` multiple times, later runs overwrite earlier baselines. This is the desired behavior (latest baseline wins).
- **Unchanged invariants:** The existing skill (SKILL.md, workflows, references) continues to work identically. The tools are additive — no existing behavior changes.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| iframe cross-origin restrictions prevent loading localhost | Test early in Unit 1. If file:// -> http://localhost is blocked, serve preview.html via the static server too |
| dev-browser CLI syntax differs from expected | Confirm exact invocation in Unit 4 implementation. Fall back to raw Playwright if needed |
| Composite HTML-to-screenshot approach produces poor quality | If dev-browser can't screenshot its own generated HTML cleanly, fall back to listing individual PNGs without a composite |
| Static file watcher (`fs.watch`) is unreliable on some platforms | Use polling fallback if `fs.watch` events are inconsistent. This is a known Node.js issue on macOS with some editors |

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-02-responsive-preview-tool-requirements.md](docs/brainstorms/2026-04-02-responsive-preview-tool-requirements.md)
- dev-browser: Kyle's sandboxed Playwright CLI for browser automation
- Node.js `http.createServer`: https://nodejs.org/api/http.html
- Skill spec `${CLAUDE_SKILL_DIR}`: https://code.claude.com/docs/en/skills
