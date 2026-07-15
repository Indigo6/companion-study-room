# Desktop Settings and Responsive MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove desktop overflow and add a secure, usable settings center for local assets, independent AI providers, voice selection and official companions.

**Architecture:** Keep settings as versioned domain data with browser and Electron adapters. The React settings drawer consumes a single repository API; Electron preload persists secrets using `safeStorage`, while Web preview keeps API keys session-only. Local background/audio files use IndexedDB object URLs and never enter localStorage.

**Tech Stack:** React, TypeScript, IndexedDB, Web Speech API, Electron safeStorage/IPC, Vitest, Node test runner.

## Global Constraints

- Preserve the current visual direction; no background or companion art redesign.
- Desktop content must fit 768p, 900p and 1080p windows without page scroll.
- Official companions only; no custom companion import in phase one.
- Custom import is limited to background images and ambience audio.
- Chat, vision and TTS providers are independently configurable.
- Desktop secrets use OS-backed Electron `safeStorage`; Web preview secrets are session-only.

### Task 1: Adaptive single-screen layout

**Files:** Modify `apps/preview/src/styles.css`, `apps/preview/src/camera-preview.css`; test `apps/preview/src/App.test.tsx`.

- [ ] Add a layout contract test for a scroll-free application shell.
- [ ] Replace accumulated fixed heights with a `100dvh` grid and height breakpoints.
- [ ] Verify desktop build and responsive CSS contract.

### Task 2: Settings center and versioned preferences

**Files:** Create `apps/preview/src/settings/*`; modify `apps/preview/src/App.tsx`; create `apps/preview/src/settings.css`.

- [ ] Test default preferences, corrupt-data recovery and provider separation.
- [ ] Add a settings drawer with Appearance, Sound, AI Services and Privacy sections.
- [ ] Persist non-secret preferences locally and connect scene controls.

### Task 3: Custom background and ambience assets

**Files:** Create `apps/preview/src/assets/localAssetStore.ts`; modify settings and App.

- [ ] Test type/size validation and asset metadata.
- [ ] Store blobs in IndexedDB, render custom backgrounds with object URLs and play imported audio through an audio element.
- [ ] Add remove/reset controls and keep imported files local.

### Task 4: Independent AI provider configuration

**Files:** Modify `apps/preview/src/ai/provider.ts`, settings domain/UI and Electron bridge.

- [ ] Test provider templates, independent chat/vision/TTS configuration and connection validation.
- [ ] Add OpenAI, DeepSeek, SiliconFlow, Ollama and custom compatible templates.
- [ ] Connect chat and vision calls to saved settings; add per-service connection tests.

### Task 5: OS-backed secret persistence

**Files:** Create `apps/desktop/settings-store.cjs`; modify `main.cjs`, `preload.cjs`; test `tests/desktop_settings.test.mjs`.

- [ ] Test encrypted-at-rest secret writes and redacted renderer reads.
- [ ] Use Electron `safeStorage` via IPC and store encrypted payload under `userData`.
- [ ] Ensure renderer never receives saved API keys after reload.

### Task 6: Official companions and speech

**Files:** Create `apps/preview/src/speech/*`; modify App/settings/styles.

- [ ] Test official companion selection and speech fallback behavior.
- [ ] Add official companion presets, system voice selection/preview and OpenAI-compatible TTS configuration.
- [ ] Drive companion mouth/body animation from speech playback state.

### Task 7: Publication and installer verification

**Files:** Modify README and workflow tests only if required.

- [ ] Run all frontend, Node and Python tests plus production build.
- [ ] Run Linux Electron packaging locally and validate the packaged executable.
- [ ] Commit, merge, push and report that GitHub Actions must be run for Windows/macOS installers.
