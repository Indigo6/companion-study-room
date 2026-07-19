# Scene Audio Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify scene names, replace rain media, and make ambience switching, pause, and volume behavior reliable and mutually exclusive.

**Architecture:** Recorded ambience stops synchronously before a replacement starts, while a focused controller coordinates recorded, custom, and procedural sources under one playback state. App UI consumes that state and never uses mute as pause.

**Tech Stack:** React, TypeScript, HTMLAudioElement, Web Audio API, Vitest, ffmpeg

## Global Constraints

- Scene names are exactly 雨天、森林、海边、咖啡馆.
- Only rain media changes in this iteration.
- At most one ambience source may play.
- Play/pause icons are exactly ▶ and ⏸.
- Volume changes apply immediately and never start playback.

---

### Task 1: Scene metadata and rain assets

**Files:** Modify `apps/preview/src/scenes/sceneMedia.ts`, `THIRD_PARTY_ASSETS.md`; replace `apps/preview/public/media/scenes/rain.webm`, `rain.webp`, and `apps/preview/public/media/ambience/rain.ogg`; modify scene tests.

- [ ] Write failing assertions for exact names and new Pexels/Pixabay credits.
- [ ] Run scene tests and confirm RED.
- [ ] Download official source files, transcode to existing formats, update metadata and SHA-256 records.
- [ ] Run scene and asset tests and confirm GREEN.
- [ ] Commit with `assets: replace rain scene media`.

### Task 2: Exclusive ambience controller

**Files:** Modify `apps/preview/src/audio/mediaAmbience.ts` and tests; create `apps/preview/src/audio/ambienceController.ts` and test.

- [ ] Write failing tests proving old audio pauses before new play, pause/resume are real, fallback is mutually exclusive, and volume updates the only active source.
- [ ] Run focused tests and confirm RED.
- [ ] Remove cross-fade and implement the controller with `stopped | playing | paused` state.
- [ ] Run focused tests and confirm GREEN.
- [ ] Commit with `fix: make ambience playback exclusive`.

### Task 3: App controls

**Files:** Modify `apps/preview/src/App.tsx`, `apps/preview/src/App.test.tsx` and styles only if needed.

- [ ] Write failing UI tests for ▶/⏸, pause/resume, scene switching, and slider behavior.
- [ ] Run focused tests and confirm RED.
- [ ] Replace muted/audioReady wiring with the controller state; remove pointer-down autoplay.
- [ ] Run full Node, Vitest, Python, and Vite build verification.
- [ ] Commit with `fix: repair ambience playback controls`.
