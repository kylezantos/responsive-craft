---
name: responsive-craft
description: "Implement responsive design for websites and web apps — from standard mobile-first layouts to complex patterns (sticky elements, scroll coordination, data tables, dashboards). Two modes: transform existing sites or build responsive from scratch. Surfaces design forks where there's no single right answer. Use when building responsive layouts, fixing mobile issues, adding breakpoints, working with sticky/scroll patterns, or when the user mentions responsive, mobile, breakpoints, viewport, or adaptive design."
argument-hint: "[audit|build]"
---

# Responsive Craft

Implement responsive design that works across all viewports — compensating for the lack of a visual canvas by making deliberate decisions upfront.

## Quick Start

**Transform an existing site:** `/responsive-craft audit` or "make this responsive" or "fix the mobile layout"
**Build responsive from scratch:** `/responsive-craft build` or "build this mobile-first" or "create a responsive layout"

---

## Core Principles

1. **Escalation model** — Intrinsic CSS first (`auto-fit`, `flex-wrap`, `clamp()`) → container queries next (component-level) → media queries last (page-level only). If a simpler layer solves it, stop there.

2. **Describe before you code** — Without a canvas, explicitly describe responsive behavior before writing CSS. In Adaptive mode, use inline behavior notes (CSS comments). In Guided mode, write formal behavior specs (tables per component). Both catch design decisions a canvas would reveal passively.

3. **Fluid by default, breakpoints by exception** — Use `clamp()` for typography, spacing, sizing. Reserve hard breakpoints for structural changes: nav transforms, column count shifts, sidebar visibility.

4. **Component containment** — Components respond to their container, not the viewport. Use container queries. A card in a sidebar and a card in a full-width section should use the same CSS.

5. **Test by dragging, not jumping** — Slowly resize from 280px to 2560px in DevTools. Don't just check named breakpoints. This catches in-between failures.

6. **Sticky/scroll needs explicit patterns** — Sticky coordination, z-index stacking contexts, overflow ancestors, safe areas, virtual keyboards. These break silently. Use the patterns in `references/sticky-scroll-patterns.md`, don't improvise.

7. **Recognize design forks, don't default silently** — When a responsive translation has multiple valid approaches, present 2-3 options with tradeoffs and ask the user to choose. See `references/responsive-design-forks.md`.

---

## The Three-Layer Responsive System

| Layer | Tool | Handles |
|-------|------|---------|
| Continuous | `clamp()`, fluid tokens, `cqi` units | Smooth scaling — font size, padding, gap |
| Component | Container queries (`@container`) | Adapting to context — card layout, nav items |
| Structural | Media queries (`@media`) | Page-level shifts — grid columns, nav transform, sidebar |

### Escalation Decision Tree

```
Does this need to change layout?
  No  → clamp() for sizing. Done.
  Yes → Does it depend on CONTAINER size?
    Yes → Container query
    No  → Does it depend on VIEWPORT?
      Yes → Media query (page-level only)
      No  → :has() or intrinsic sizing (auto-fit, flex-wrap)
```

---

## Mode Selection

This skill operates in two modes. Detect from `$ARGUMENTS` or ask.

### Detection

- `$ARGUMENTS` contains "audit", "transform", "fix", "improve", "retrofit" → **Transform Existing**
- `$ARGUMENTS` contains "build", "create", "new", "from scratch" → **Build Responsive**
- User is working in an existing codebase with responsive issues → **Transform Existing**
- User is starting a new page/component → **Build Responsive**
- Ambiguous → Ask

If AskUserQuestion is available:
- **Transform existing** — Audit and improve responsive behavior of current code
- **Build from scratch** — Design responsive layout from the start

Otherwise: "Are you transforming an existing site's responsive design, or building something new?"

### Interactivity Level

After mode selection, determine interactivity:

If AskUserQuestion is available:
- **Adaptive** — Moves fast. 1-2 discovery questions, then starts working. Surfaces design forks inline as they arise. No formal specs — decisions are made in the moment.
- **Guided** — Produces deliverables. Full discovery, writes behavior specs per component before coding, gets explicit approval before each stage. Best for complex layouts or when the user wants a spec to reference later.

Otherwise: "Do you want (1) Adaptive — fast, I'll ask as I go, or (2) Guided — I'll write behavior specs per component and get your approval before coding?"

**Default to Adaptive** if the user doesn't express a preference.

**When to recommend Guided:** If the layout has 5+ distinct responsive components, multiple sticky elements, or a dashboard-style layout, suggest Guided — the behavior specs prevent expensive rework later.

---

## Routing

After mode and interactivity are selected:

| Mode | Read workflow | Load immediately |
|------|-------------|-----------------|
| Transform Existing | `workflows/transform-existing.md` | `references/ai-failure-patterns.md` |
| Build Responsive | `workflows/build-responsive.md` | `references/modern-css-patterns.md`, `references/ai-failure-patterns.md` |

Load other references on demand:
- `references/sticky-scroll-patterns.md` — when sticky, scroll-snap, or independent scroll regions are involved
- `references/responsive-design-forks.md` — when an ambiguous responsive translation is detected
- `references/testing-checklist.md` — during verification step
- `references/modern-css-patterns.md` — during Transform mode when implementing fixes

---

## Gotchas — Where Claude Fails at Responsive Design

These are the most common mistakes. Check every responsive output against this list.

1. **`100vh` on mobile** — Use `svh`/`dvh` with `vh` fallback. `100vh` overflows behind mobile browser chrome.

2. **Desktop-first media queries** — Always use `min-width` (mobile-first), not `max-width`. Mobile loads fewer overrides.

3. **Missing `min-width: 0` on flex children** — Default flex `min-width` is `auto` (content size). Long text/images overflow. Add `min-width: 0` when content is dynamic.

4. **`overflow: hidden` kills sticky** — Any ancestor with `overflow: hidden/scroll/auto` breaks `position: sticky`. Use `overflow: clip` for visual clipping.

5. **`transform` breaks `position: fixed`** — Any transform on an ancestor makes fixed children position relative to that ancestor, not viewport.

6. **iOS input zoom below 16px** — Input `font-size` under 16px triggers Safari viewport zoom. Use `font-size: max(16px, 1rem)`.

7. **Missing safe area insets** — Notched devices need `env(safe-area-inset-*)`. Requires `viewport-fit=cover` in meta tag. Don't forget landscape orientation.

8. **Z-index escalation** — Values like `9999` signal misunderstanding of stacking contexts. Use `isolation: isolate` and a tiered z-index scale.

9. **Missing `align-self: start` on sticky in flex/grid** — Without this, the element stretches to full height and sticky has no room to stick. The #1 silent sticky failure.

10. **Optimizing for one viewport** — Code that looks perfect at 1440px breaks at 320px, 768px portrait, and ultrawide. Always test the full range.

For the complete list with code examples, see `references/ai-failure-patterns.md`.

---

## Tools

This skill includes two CLI tools in `scripts/` for visual responsive verification.

### Live Multi-Viewport Preview

See all breakpoints simultaneously in the browser, with hot reload:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/preview.js http://localhost:3000
node ${CLAUDE_SKILL_DIR}/scripts/preview.js ./index.html
node ${CLAUDE_SKILL_DIR}/scripts/preview.js http://localhost:3000 --breakpoints 375,768,1024,1440,1920
```

### Responsive Snapshots

Capture screenshots at every breakpoint. Supports before/after comparison:

```bash
# Capture current state
node ${CLAUDE_SKILL_DIR}/scripts/snapshot.js http://localhost:3000

# Capture baseline, make changes, then capture again for comparison
node ${CLAUDE_SKILL_DIR}/scripts/snapshot.js http://localhost:3000 --before
# ... make responsive changes ...
node ${CLAUDE_SKILL_DIR}/scripts/snapshot.js http://localhost:3000
# → generates comparison.html with before/after at each breakpoint
```

Both tools require no dependencies — just Node.js. Snapshots require `dev-browser` for headless screenshots.

---

## Reference Index

| File | Contents | Load when |
|------|----------|-----------|
| [modern-css-patterns.md](references/modern-css-patterns.md) | Container queries, clamp(), subgrid, :has(), viewport units, scroll-driven animations, nesting, @layer, logical properties | Writing or reviewing responsive CSS |
| [sticky-scroll-patterns.md](references/sticky-scroll-patterns.md) | Sticky coordination, scroll-snap, independent scroll regions, responsive data tables, modals/sheets, IntersectionObserver | Working with sticky, scroll, or complex layout patterns |
| [responsive-design-forks.md](references/responsive-design-forks.md) | 8 ambiguous desktop→mobile translations with options and tradeoffs | When a responsive translation has no single right answer |
| [ai-failure-patterns.md](references/ai-failure-patterns.md) | 13 categories of AI responsive failures with bad/good code examples, pre-flight scan checklist | Pre-flight scan before outputting responsive code |
| [testing-checklist.md](references/testing-checklist.md) | Priority viewports, 10-point check, edge cases, three-tier testing strategy, Playwright patterns | Verification step after implementation |

## Workflow Index

| Workflow | Purpose |
|----------|---------|
| [transform-existing.md](workflows/transform-existing.md) | Audit → identify forks → fix responsive issues in priority order |
| [build-responsive.md](workflows/build-responsive.md) | Describe behavior → establish foundation → build mobile-first → verify |
