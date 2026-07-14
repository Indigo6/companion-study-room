# Functional Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved visual preview into a functional Web MVP with an accurate focus timer, generated ambience, local session records, real camera permission and low-frequency frame capture, deterministic demo supervision, and demo AI Q&A.

**Architecture:** Keep browser-independent logic in focused TypeScript modules and connect it to React through a small Zustand store. Browser adapters own Web Audio, MediaDevices, Canvas and localStorage; the demo AI consumes transient frame metadata only and never persists image data. Electron and online API integration remain outside this plan.

**Tech Stack:** React, TypeScript, Zustand, Web Audio API, MediaDevices, Canvas, localStorage, Vitest, Testing Library.

## Global Constraints

- Source specification: `docs/superpowers/specs/2026-07-14-desktop-study-mvp-design.md`.
- Preserve the approved visual composition and four distinct scene artworks.
- Camera defaults off and requires an explicit user action.
- Capture one compressed frame every 45 seconds only while supervision and focus are both active.
- Frame data must not enter localStorage, logs, Q&A history or the filesystem.
- Two consecutive `absent` results trigger an away event; `uncertain` resets neither presence nor away state.
- No online AI request and no Electron integration in this plan.
- Demo supervision and demo Q&A remain visibly labeled.

---

### Task 1: Accurate focus timer domain

**Files:**
- Create: `apps/preview/src/domain/timer.ts`
- Create: `apps/preview/src/domain/timer.test.ts`
- Create: `apps/preview/src/store/useStudyStore.ts`
- Modify: `apps/preview/src/App.tsx`

**Interfaces:**
- Produces `createTimer`, `startTimer`, `pauseTimer`, `resumeTimer`, `tickTimer`, and `resetTimer` pure functions.
- Timer state contains `phase`, `durationMs`, `remainingMs`, `endsAt`, and `startedAt`.

- [ ] Write failing tests for start, pause, resume, absolute-clock correction and completion.
- [ ] Run `rtk npm run preview:test -- --run` and confirm failures because timer functions do not exist.
- [ ] Implement the pure state machine and connect it to the existing preset/start UI with a 250 ms render tick.
- [ ] Run tests and confirm the clock counts down without cumulative interval drift.
- [ ] Commit with `feat: implement focus timer state machine`.

### Task 2: Generated white noise engine

**Files:**
- Create: `apps/preview/src/audio/ambience.ts`
- Create: `apps/preview/src/audio/ambience.test.ts`
- Modify: `apps/preview/src/App.tsx`

**Interfaces:**
- Produces `AmbienceEngine` with `start(sceneId)`, `setVolume(value)`, `setMuted(value)`, `switchScene(sceneId)`, and `dispose()`.
- Each scene uses a distinct filtered-noise profile; no external audio asset is loaded.

- [ ] Write failing tests against an injected fake AudioContext for start, mute, volume and scene switch disposal.
- [ ] Implement brown/pink-style generated noise and scene-specific filter/gain settings.
- [ ] Connect playback to the existing control dock; first user click initializes audio.
- [ ] Verify audio failure leaves timer and other controls usable.
- [ ] Commit with `feat: generate scene ambience in browser`.

### Task 3: Local goals and session history

**Files:**
- Create: `apps/preview/src/storage/sessionRepository.ts`
- Create: `apps/preview/src/storage/sessionRepository.test.ts`
- Modify: `apps/preview/src/store/useStudyStore.ts`
- Modify: `apps/preview/src/App.tsx`

**Interfaces:**
- Produces `SessionRecord` with id, goal, plannedMinutes, actualSeconds, pauseCount, awayCount, outcome and completedAt.
- Produces `loadSessions`, `saveSession`, `clearSessions`, and `summarizeToday` with injected Storage.

- [ ] Write failing tests for valid load, corrupt-data recovery, save and today summary.
- [ ] Implement versioned JSON persistence without frame or chat fields.
- [ ] Save on completed/early-ended sessions and render actual today totals.
- [ ] Commit with `feat: persist local study sessions`.

### Task 4: Camera supervision and transient frame capture

**Files:**
- Create: `apps/preview/src/supervision/presence.ts`
- Create: `apps/preview/src/supervision/presence.test.ts`
- Create: `apps/preview/src/supervision/camera.ts`
- Create: `apps/preview/src/supervision/camera.test.ts`
- Modify: `apps/preview/src/App.tsx`

**Interfaces:**
- Produces `PresenceTracker.observe(status)` returning `stable-present | pending-away | away | uncertain`.
- Produces `CameraSupervisor.start(video)`, `captureFrame()`, and `stop()`; `captureFrame` returns a temporary Blob that the caller releases after demo inspection.

- [ ] Write failing tests for the two-away threshold, uncertainty behavior, explicit MediaDevices request, canvas compression and track shutdown.
- [ ] Implement a visible camera preview with explicit consent copy and error states.
- [ ] Capture every 45 seconds only during active focus; use deterministic demo inspection and discard the Blob reference immediately.
- [ ] Verify stopping supervision stops all media tracks and capture timers.
- [ ] Commit with `feat: add privacy-first camera supervision`.

### Task 5: Demo AI behavior, integration and publication

**Files:**
- Create: `apps/preview/src/ai/demoProvider.ts`
- Create: `apps/preview/src/ai/demoProvider.test.ts`
- Modify: `apps/preview/src/App.tsx`
- Modify: `apps/preview/src/App.test.tsx`
- Modify: `README.md`

**Interfaces:**
- Produces `DemoAiProvider.askQuestion` and `inspectFrame` matching the approved `AiProvider` shape.
- Demo answers are task-focused and capped in length; frame inspection never performs network I/O.

- [ ] Write failing tests for question responses, presence result validation and zero network calls.
- [ ] Connect companion messages to timer and presence events while keeping all demo labels visible.
- [ ] Run all unit tests, legacy tests and the production build.
- [ ] Inspect desktop and narrow-screen screenshots and verify public `/preview/` returns HTTP 200.
- [ ] Commit, push the feature branch and stop for functional Web MVP review before Electron work.
