# Workflow: Responsive Preview

Launch a live multi-breakpoint preview to visually verify responsive behavior across all viewports simultaneously.

---

## Step 1: Find the Target

Determine what to preview:

1. **User provided a URL** — use it directly
2. **Dev server is running** — check common ports (3000, 3001, 5173, 5174, 8080, 4321) by looking at running processes or asking the user
3. **No dev server** — offer to start one, or accept a static HTML file path

If you can't determine the URL, ask:

> What URL should I preview? (e.g. `http://localhost:3000`)

## Step 2: Launch

**Run in the background** so you remain available for follow-up requests:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/preview.js <url-or-path>
```

Use `run_in_background: true` on the Bash call. The server stays alive until the user stops it or you kill the process.

Custom breakpoints:
```bash
node ${CLAUDE_SKILL_DIR}/scripts/preview.js <url> --breakpoints 320,768,1024,1440,1920
```

This opens a browser window with 4 interactive iframes at 375px, 768px, 1024px, and 1440px. Each frame is independently scrollable and navigable.

### Troubleshooting

- **Blank iframes:** The target site may set `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'self'`, which blocks iframe embedding. The user needs to disable those headers in their dev server config.
- **Target not loading:** Confirm the dev server is actually running and accessible at the URL before launching the preview.
- **To stop the preview server:** Kill the background process or ask the user to press Ctrl+C in the terminal.

## Step 3: Guide

After launching, tell the user:

- Scroll, click, and navigate each viewport independently
- "Refresh All" reloads every frame at once
- Code changes hot-reload within the iframes if the dev server supports HMR (most do — Vite, Next.js, etc.)
- Navigate to any route within the frames to check other pages

If the user spots responsive issues, offer to fix them — transition into the transform-existing workflow.
