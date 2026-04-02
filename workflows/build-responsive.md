# Workflow: Build Responsive from Scratch

Build a new responsive site or component with responsive behavior designed in from the start.

## Required Reading

Load these references before proceeding:
- `references/modern-css-patterns.md` — CSS patterns for implementation
- `references/responsive-design-forks.md` — loaded when ambiguous patterns arise
- `references/ai-failure-patterns.md` — pre-flight scan before outputting code

---

## Step 1: Understand What's Being Built

Before writing any CSS, understand the layout requirements.

### Adaptive mode

Ask 2-3 focused questions:

1. "What are you building?" — Page type (landing, dashboard, app, form, content), key components, complexity level.
2. "What's your CSS setup?" — Tailwind, vanilla CSS, CSS-in-JS, component library? (If you can detect this from the codebase, skip the question and confirm: "I see you're using Tailwind — I'll output Tailwind classes.")
3. "What's the primary device?" — Mobile-first (default), desktop-first (admin tools), or equal priority?

**Carry the framework context forward** — all CSS output in subsequent steps must match the detected framework. See `references/modern-css-patterns.md` Framework Detection section.

Then proceed to Step 2 based on the answers.

### Guided mode

Conduct a fuller discovery:

1. "What are you building and who's it for?"
2. "What's the primary device and usage context?"
3. "Are there any specific responsive challenges you're anticipating?" (complex tables, multi-panel layouts, sticky elements, etc.)
4. "Are you using a CSS framework?" (Tailwind, vanilla CSS, etc. — affects implementation patterns)

Present understanding and wait for confirmation before proceeding.

---

## Step 2: Describe Responsive Behavior

**This is the key step that compensates for not having a visual canvas.** Before writing CSS, describe what should happen at each viewport.

### Adaptive mode

For each major component or section, write a brief inline behavior note as a CSS comment:

```css
/* ProductCard: stack vertical on mobile, horizontal at 640px, fixed 320px grid card at 1024px */
```

Surface design forks as you encounter them — don't batch them. When you recognize a pattern from `references/responsive-design-forks.md`, stop, present the fork, get a decision, continue. This is how Adaptive compensates for not writing formal specs.

### Guided mode

Build a **behavior spec** — a set of tables that serve as the responsive design contract. Present all tables for approval before writing any CSS.

```
RESPONSIVE BEHAVIOR SPEC

Component: [Name]
Type: [Reflow | Expand/contract | Reveal/hide | Transform]
| Viewport    | Layout           | Key changes          |
|-------------|------------------|----------------------|
| < 640px     | [description]    | [what changes]       |
| 640-1023px  | [description]    | [what changes]       |
| 1024px+     | [description]    | [what changes]       |
```

**Behavior types:**
- **Reflow** — content rearranges (columns stack, sidebar becomes drawer)
- **Expand/contract** — component gets bigger/smaller without restructuring
- **Reveal/hide** — content appears or disappears (labels visible on desktop, icons on mobile)
- **Transform** — component changes form entirely (nav bar → hamburger menu)

Write one table per major component. **Wait gate:** Present the complete behavior spec and get approval before coding. This spec becomes a reference the user can check implementation against later.

### Surface forks early

During this step, identify patterns from `references/responsive-design-forks.md` and present options. Common forks at this stage:
- Sidebar decisions
- Navigation approach
- Table handling
- Dashboard panel strategy

---

## Step 3: Establish Responsive Foundation

Set up the base responsive infrastructure before building components. **Adapt these to the project's CSS approach** — if using Tailwind, Chakra, or another framework, use its built-in responsive system rather than raw CSS. See the Framework Detection section in `references/modern-css-patterns.md`.

### Global reset (vanilla CSS — skip if framework provides this)

```css
*, *::before, *::after { box-sizing: border-box; }
img, video, svg { max-width: 100%; height: auto; }
input, textarea, select { font-size: max(16px, 1rem); }
```

### Viewport meta

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### Fluid tokens (if not using a framework's built-in scale)

```css
:root {
  /* Type scale — generate at utopia.fyi or use clamp() manually */
  --text-sm:  clamp(0.83rem, 0.78rem + 0.29vw, 1rem);
  --text-base: clamp(1rem, 0.91rem + 0.43vw, 1.25rem);
  --text-lg:  clamp(1.2rem, 1.07rem + 0.63vw, 1.56rem);
  --text-xl:  clamp(1.44rem, 1.26rem + 0.89vw, 1.95rem);
  --text-2xl: clamp(1.73rem, 1.48rem + 1.24vw, 2.44rem);

  /* Spacing scale */
  --space-s:  clamp(0.75rem, 0.69rem + 0.29vw, 0.875rem);
  --space-m:  clamp(1rem, 0.93rem + 0.38vw, 1.25rem);
  --space-l:  clamp(1.5rem, 1.38rem + 0.57vw, 1.75rem);
  --space-xl: clamp(2rem, 1.86rem + 0.71vw, 2.5rem);
  --space-section: clamp(3rem, 8vw, 6rem);

  /* Layout dimensions (update at breakpoints) */
  --header-height: 56px;
  --sidebar-width: 100%;
}

@media (min-width: 768px) {
  :root { --header-height: 64px; }
}
@media (min-width: 1024px) {
  :root {
    --header-height: 72px;
    --sidebar-width: 280px;
  }
}
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Step 4: Build Mobile-First

Follow the escalation model: intrinsic CSS → container queries → media queries.

### For each component

1. **Start intrinsic** — Can `auto-fit`, `flex-wrap`, or `clamp()` handle it without any queries?
2. **Add container queries** if the component needs to adapt to its container size
3. **Add media queries** only for page-level structural changes

### Apply the escalation check

Before adding a media query, ask: "Could this be solved with a container query or intrinsic sizing instead?" If yes, use the simpler tool.

### Pre-flight check

Before outputting any responsive CSS, scan against `references/ai-failure-patterns.md`:
- Using `svh`/`dvh`, not `100vh`?
- Mobile-first (`min-width`), not desktop-first?
- `min-width: 0` on flex children with dynamic content?
- `align-self: start` on sticky elements in flex/grid?
- No `overflow: hidden` breaking sticky parents?
- Safe areas handled for fixed/sticky elements?
- Touch targets at least 44px?

### Surface forks during implementation

As you build, you'll encounter patterns from `references/responsive-design-forks.md`. When you recognize one:

1. Stop implementing
2. Describe what you're seeing and why there's no single right answer
3. Present the options with tradeoffs
4. Ask the user to decide
5. Continue implementing with their choice

---

## Step 5: Verify

Load `references/testing-checklist.md` for the 10-point check and priority viewport list.

**What Claude can do:** Scan the CSS output against `references/ai-failure-patterns.md` (static analysis). Flag things that need manual browser testing. Launch the multi-viewport preview or capture snapshots for visual verification.

**Visual tools available:**
- `node ${CLAUDE_SKILL_DIR}/scripts/preview.js <url>` — opens all breakpoints side by side in the browser
- `node ${CLAUDE_SKILL_DIR}/scripts/snapshot.js <url>` — captures screenshots at each breakpoint

**What needs manual testing:** Drag-resize behavior, real device quirks, touch interactions, keyboard open behavior.

### Quick verification (Adaptive mode)

Run the pre-flight scan (ai-failure-patterns.md checklist) against all output. Run through the 10-point check at 375px, 768px, and 1440px mentally — flag any likely issues.

### Thorough verification (Guided mode)

1. Compare implementation against the behavior specs from Step 2
2. Run the 10-point check at all priority viewports (375, 768, 1024, 1440)
3. Check edge cases relevant to this specific build
4. Run the pre-flight scan
5. Verify all design fork decisions were implemented correctly

Present verification summary:

```
VERIFICATION

Components built: [N]
Behavior specs matched: [Y/N per component]
Viewports checked: [list]
AI failure scan: [pass/issues found]
Design forks resolved: [N]
```

---

## Success Criteria

- [ ] Layout requirements understood
- [ ] Responsive behavior described before coding (tables or inline notes)
- [ ] Foundation established (reset, viewport meta, tokens)
- [ ] Built mobile-first using escalation model
- [ ] Design forks surfaced and decided by user
- [ ] Pre-flight scan passed
- [ ] Verification completed
