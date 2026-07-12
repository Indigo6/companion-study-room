# Planning Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, responsive HTML reading experience for the companion study room planning document.

**Architecture:** Keep the source plan as Markdown and ship a dependency-free static `index.html` containing the complete readable plan. CSS defines the night-study visual system; a small JavaScript module generates navigation, reading progress, active-section state, and mobile navigation.

**Tech Stack:** Semantic HTML5, CSS custom properties, vanilla JavaScript, Node.js built-in test runner.

## Global Constraints

- Project root: `/home/agent/companion-study-room`.
- Preserve the full planning source at `docs/superpowers/specs/2026-07-12-companion-study-room-product-plan.md`.
- The page must work without a build step or third-party runtime dependency.
- It must be responsive, keyboard accessible, printable, and respect reduced-motion preferences.

---

### Task 1: Project and document integrity

**Files:**
- Create: `README.md`
- Test: `tests/site.test.mjs`

**Interfaces:**
- Consumes: the planning Markdown source.
- Produces: structural assertions used to validate the reading page.

- [ ] Write tests that require the source document, page title, 18 numbered sections, navigation, progress indicator, responsive viewport, print rules, and reduced-motion rules.
- [ ] Run `rtk node --test tests/site.test.mjs` and confirm failure because `index.html` is absent.
- [ ] Add concise project usage documentation.

### Task 2: Standalone planning reader

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: the approved planning document content.
- Produces: a standalone browser-readable page with stable section anchors.

- [ ] Implement semantic content, full planning text, tables, citations, sidebar navigation and mobile navigation.
- [ ] Implement the night-study token system, responsive layout, print styling and accessible focus states.
- [ ] Implement reading progress, current-section highlighting and navigation toggling with vanilla JavaScript.
- [ ] Run `rtk node --test tests/site.test.mjs` and confirm all tests pass.
- [ ] Serve locally and inspect desktop and mobile screenshots before final verification.

