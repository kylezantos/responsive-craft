---
date: 2026-04-02
topic: responsive-preview-tool
---

# Responsive Preview Tool

## Problem Frame

When building responsive layouts in Claude Code, there's no way to see all breakpoints simultaneously. Developers either resize the browser manually, jump between DevTools presets, or check one viewport at a time. This is the core limitation that responsive-craft was built to compensate for with process (describe before you code, test by dragging).

A multi-viewport preview tool would close this gap directly — giving code-first developers the same "all breakpoints at once" view that Framer and Figma provide on their canvas.

## User Flow

```
Developer working on responsive layout
         │
         ├─── Live Preview ──────────────────────────────────────┐
         │    Claude or user runs: `preview <url-or-file>`       │
         │    Opens browser with 4-5 iframes side by side        │
         │    Dev server hot reload propagates into iframes       │
         │    Developer sees all breakpoints updating live        │
         │                                                        │
         ├─── Snapshot Capture ──────────────────────────────────┐
         │    Claude or user runs: `snapshot <url> [--before]`   │
         │    Captures screenshots at each breakpoint             │
         │    Saves individual PNGs + tiled composite             │
         │                                                        │
         └─── Before/After Comparison ──────────────────────────┐
              Run snapshot --before, make changes, run snapshot   │
              Generates side-by-side before/after at each width   │
```

## Requirements

**Live Multi-Viewport Preview**

- R1. Single HTML page that displays the target URL in 4-5 side-by-side iframes at standard breakpoints (375px, 768px, 1024px, 1440px)
- R2. Each iframe is labeled with its viewport width and a descriptive name (e.g., "375px — Mobile")
- R3. Works with localhost dev servers (Vite, Next.js, etc.) — hot reload propagates into iframes automatically
- R4. Works with static HTML files via a lightweight local server (no framework required)
- R5. Breakpoints are configurable — user can adjust which widths are shown
- R6. Preview page itself is responsive — on a narrow monitor, iframes stack or allow horizontal scroll rather than breaking

**Snapshot Capture**

- R7. Capture full-page screenshots at each configured breakpoint using dev-browser (Playwright)
- R8. Save individual PNGs per breakpoint (e.g., `home-375.png`, `home-768.png`)
- R9. Generate a tiled composite image with all breakpoints side by side
- R10. Support a `--before` flag that saves snapshots as a baseline for later comparison

**Before/After Comparison**

- R11. After a `--before` baseline exists, a subsequent snapshot generates a side-by-side diff view showing before and after at each breakpoint
- R12. Comparison output is a single image or HTML page that can be shared or reviewed

**Skill Integration**

- R13. The responsive-craft skill can invoke the preview and snapshot tools during its workflows (both Transform and Build modes)
- R14. The tools are also usable standalone via CLI — no skill invocation required
- R15. Lives in a `scripts/` directory within the responsive-craft skill initially, extractable to a standalone tool later

## Success Criteria

- A developer can run one command and see their page at all major breakpoints simultaneously, live-updating as they edit
- Snapshot capture produces usable comparison artifacts without manual screenshotting
- Works with zero configuration for the common case (localhost dev server)
- Claude can invoke it during responsive-craft workflows to verify its own work

## Scope Boundaries

- Not a full browser testing framework — no assertions, no CI integration
- Not trying to simulate real device behavior (touch events, safe areas, browser chrome) — that still needs real device testing
- No cross-browser comparison (Chrome only via Playwright is fine)
- No video recording — screenshots only for comparison mode

## Key Decisions

- **Start as skill scripts, extract later**: Build inside responsive-craft's `scripts/` directory first. If it proves broadly useful, extract to its own CLI package.
- **dev-browser for snapshots**: Use the existing dev-browser (sandboxed Playwright) CLI for screenshot capture rather than raw Playwright, per Kyle's setup preferences.
- **HTML + iframes for live preview**: Simplest possible approach. No Electron, no custom browser. Just a web page that opens in your default browser.

## Dependencies / Assumptions

- dev-browser CLI is available on the machine for snapshot features
- For static file preview, a lightweight HTTP server is needed (e.g., `npx serve` or a built-in Node script)
- Hot reload in iframes relies on the dev server's existing HMR — no custom file watching needed for served apps

## Outstanding Questions

### Deferred to Planning

- [Affects R4][Technical] What's the lightest way to serve static files? Built-in Node HTTP server (~15 lines), `npx serve`, or Python's `http.server`?
- [Affects R9][Technical] Best approach for tiling screenshots into a composite? Sharp (Node), ImageMagick CLI, or an HTML page rendered to image via Playwright?
- [Affects R11][Needs research] For before/after diff views — simple side-by-side images, or pixel-diff highlighting? How much complexity is the diff worth?
- [Affects R5][Technical] How should configurable breakpoints be stored? JSON config file, CLI flags, or both?
- [Affects R13][Technical] How does the skill invoke the scripts? Direct `node scripts/preview.js` calls via `${CLAUDE_SKILL_DIR}`, or a shell wrapper?

## Next Steps

`/ce:plan` for structured implementation planning
