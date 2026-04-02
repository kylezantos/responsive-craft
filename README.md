# responsive-craft

A Claude Code skill for implementing responsive design across websites and web apps — from standard mobile-first layouts to complex patterns like sticky element coordination, independent scroll regions, responsive data tables, and dashboard layouts.

## The Problem

When you're building responsive layouts in Claude Code (or any code-first environment), you don't have a visual canvas like Figma or Framer where you can see all breakpoints side by side. This means responsive design decisions get made reactively — you write code, preview, resize, and fix — instead of deliberately.

**responsive-craft** compensates for this by front-loading the right decisions: describing responsive behavior before writing CSS, using an escalation model that picks the simplest tool for each job, and surfacing design forks where there's no single correct answer.

## What It Does

### Three Modes

- **Transform Existing** (`/responsive-craft audit`) — Audits your current codebase's responsive implementation, identifies issues and ambiguous translations, and fixes them in priority order.
- **Build From Scratch** (`/responsive-craft build`) — Helps you design responsive behavior before writing CSS, establishes a mobile-first foundation, and builds with the right CSS tool for each pattern.
- **Live Preview** (`/responsive-craft preview`) — Opens a multi-breakpoint preview in your browser with interactive iframes at 375px, 768px, 1024px, and 1440px, all pointing at your dev server. Scroll, click, and navigate each viewport independently. Also offered automatically after completing an audit or build.

### Two Interactivity Levels

- **Adaptive** — Moves fast. Quick discovery, surfaces design decisions inline as they come up.
- **Guided** — Produces formal behavior specs per component before coding. Best for complex layouts.

### Design Forks

The skill's key differentiator. When a responsive translation has multiple valid approaches — a sidebar that could become a drawer, tabs, or an accordion; a data table that could scroll, stack as cards, or hide columns — the skill presents 2-3 options with tradeoffs and asks you to choose instead of silently picking one.

8 fork patterns covered: sidebar content, data tables, multi-panel dashboards, complex heroes, multiple sticky elements, deep navigation, complex forms, and bento grids.

## Core Principles

1. **Escalation model** — Intrinsic CSS first (`auto-fit`, `flex-wrap`, `clamp()`) → container queries → media queries last
2. **Describe before you code** — Behavior notes or specs per component before writing CSS
3. **Fluid by default, breakpoints by exception** — `clamp()` for continuous scaling; breakpoints only for structural changes
4. **Component containment** — Components respond to their container, not the viewport
5. **Test by dragging, not jumping** — Resize continuously from 280px to 2560px
6. **Sticky/scroll needs explicit patterns** — These break silently; use documented patterns
7. **Recognize design forks** — Don't default silently when there are multiple valid approaches

## What's Inside

```
responsive-craft/
├── SKILL.md                              # Core principles, routing, gotchas
├── workflows/
│   ├── transform-existing.md             # Audit → forks → fix existing sites
│   ├── build-responsive.md              # Describe → foundation → build mobile-first
│   └── preview.md                       # Launch live multi-breakpoint preview
├── scripts/
│   ├── preview.js                       # Serves preview.html over HTTP, opens browser
│   ├── preview.html                     # Multi-viewport iframe UI (dark theme, toolbar, scale toggle)
│   ├── snapshot.js                      # Headless screenshots at every breakpoint
│   └── serve-static.js                  # Zero-dependency static server with live reload
├── references/
│   ├── modern-css-patterns.md           # Container queries, clamp(), subgrid, :has(), viewport units, @layer
│   ├── sticky-scroll-patterns.md        # Sticky coordination, scroll-snap, scroll regions, modals/sheets
│   ├── responsive-design-forks.md       # 8 ambiguous patterns with options and tradeoffs
│   ├── ai-failure-patterns.md           # 13 categories of where AI breaks responsive code
│   └── testing-checklist.md             # Priority viewports, 10-point check, testing strategy
└── README.md
```

### Reference Highlights

- **modern-css-patterns.md** — The 2026 CSS responsive toolkit: container queries, `clamp()` with Utopia-style fluid scales, subgrid, `:has()` for content-conditional layouts, modern viewport units (`svh`/`dvh`), scroll-driven animations, CSS nesting, `@layer`, logical properties. Includes Tailwind mappings.

- **ai-failure-patterns.md** — 13 specific, recurring mistakes AI makes with responsive CSS: `100vh` on mobile, desktop-first queries, missing `min-width: 0` on flex children, `overflow: hidden` killing sticky, iOS input zoom, z-index escalation, and more. Each with bad output, why it breaks, and the correct pattern. Includes a pre-flight scan checklist.

- **sticky-scroll-patterns.md** — Production patterns for the complex stuff: coordinating multiple sticky elements with CSS custom properties, debugging sticky failures, scroll-snap carousels, independent scroll regions (dashboard pattern), sticky + responsive transitions, IntersectionObserver for stuck detection.

### Live Preview

The standout verification tool. When you can't drag-resize a browser in a code-first environment, this gives you the next best thing — all your key breakpoints rendered simultaneously in real, interactive iframes. No screenshots, no mocking — actual live pages you can scroll and click through.

Run `/responsive-craft preview` to launch it standalone, or it's offered automatically at the end of every audit and build workflow.

The preview tool:
- Serves everything over HTTP automatically (no cross-origin iframe issues)
- Works with any dev server (Vite, Next.js, etc.) or static HTML files
- Supports custom breakpoints via `--breakpoints` flag
- Cleans up after itself on exit

## Installation

### As a personal skill (available in all projects)

```bash
# Clone into your Claude Code skills directory
git clone https://github.com/kylezantos/responsive-craft.git ~/.claude/skills/responsive-craft
```

### As a project skill

```bash
# Clone into your project's .claude directory
git clone https://github.com/kylezantos/responsive-craft.git .claude/skills/responsive-craft
```

### Manual

Copy the entire `responsive-craft/` directory into either `~/.claude/skills/` (personal) or `.claude/skills/` (project).

## Usage

```
# Transform an existing site
/responsive-craft audit

# Build responsive from scratch
/responsive-craft build

# Open a live multi-breakpoint preview
/responsive-craft preview

# Claude also auto-detects when you're working on responsive layouts
"make this responsive"
"fix the mobile layout"
"the sidebar breaks on tablet"
"show me the responsive preview"
```

## Framework Support

The skill detects your CSS approach and adapts output:
- **Tailwind CSS** — Uses responsive modifiers, `@container` variants, `@theme` tokens
- **Component libraries** (MUI, Chakra, shadcn) — Works with the library's responsive system
- **CSS-in-JS** — Same patterns, expressed through the library's API
- **Vanilla CSS** — Patterns applied directly

## Cross-Agent Compatibility

**Degrades Gracefully** — Core functionality works on any AI coding agent. Claude Code users get tappable mode selection via AskUserQuestion; other agents get plain-text fallbacks.

## License

MIT
