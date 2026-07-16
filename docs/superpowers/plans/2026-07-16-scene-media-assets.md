# Scene Media Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four synthetic scene backgrounds and generated noise textures with locally bundled, licensed, optimized background videos and layered ambience tracks while preserving custom user assets and offline desktop operation.

**Architecture:** A typed scene manifest will be the single source of truth for labels, bundled media URLs, fallback artwork, and attribution. `SceneArtwork` will render an autoplaying muted loop with a static/CSS fallback, while a media ambience engine will cross-fade bundled audio and retain the procedural engine only as a load-error fallback. A settings attribution tab and repository asset ledger will expose provenance without making original source files available through the UI.

**Tech Stack:** React, TypeScript, Vite asset URLs, HTML5 video/audio, Web Audio API, Vitest, ffmpeg asset optimization, Electron Builder.

## Global Constraints

- Preserve the existing four scene IDs: `rain`, `forest`, `coast`, and `cafe`.
- Official media must work offline in Windows and macOS installers.
- Background video must be muted, looped, non-interactive, and respect reduced-motion preferences.
- Custom background and custom ambience behavior must remain unchanged.
- Only Pexels-licensed visual material and CC0 audio material may be bundled in this phase.
- Every bundled third-party asset must have an entry in `THIRD_PARTY_ASSETS.md` with source, creator, license, download date, modifications, and SHA-256.
- All shell commands must be prefixed with `rtk`.

---

### Task 1: Typed scene media manifest and provenance ledger

**Files:**
- Create: `apps/preview/src/scenes/sceneMedia.ts`
- Create: `apps/preview/src/scenes/sceneMedia.test.ts`
- Create: `THIRD_PARTY_ASSETS.md`
- Create: `apps/preview/public/media/README.md`

**Interfaces:**
- Produces: `SceneId`, `SceneMedia`, `sceneMedia`, and `getSceneMedia(scene: SceneId): SceneMedia`.
- `SceneMedia` contains `id`, `name`, `noise`, `time`, `icon`, `artworkLabel`, `videoUrl`, `posterUrl`, `ambienceUrl`, `credit`, and `licenseUrl`.

- [ ] Write a failing manifest test asserting four unique scene IDs, local `/media/` URLs, Pexels visual credits, and CC0 audio license metadata.
- [ ] Run `rtk npm run preview:test -- --run apps/preview/src/scenes/sceneMedia.test.ts` and verify failure because the module is absent.
- [ ] Implement the typed manifest with final local file names under `public/media/scenes/` and `public/media/ambience/`.
- [ ] Add the media directory rules and attribution ledger structure.
- [ ] Re-run the focused test and verify it passes.
- [ ] Commit with `docs: establish licensed scene asset manifest`.

### Task 2: Acquire, optimize, and verify licensed assets

**Files:**
- Create: `apps/preview/public/media/scenes/rain.webm`
- Create: `apps/preview/public/media/scenes/rain.webp`
- Create: `apps/preview/public/media/scenes/forest.webm`
- Create: `apps/preview/public/media/scenes/forest.webp`
- Create: `apps/preview/public/media/scenes/coast.webm`
- Create: `apps/preview/public/media/scenes/coast.webp`
- Create: `apps/preview/public/media/scenes/cafe.webm`
- Create: `apps/preview/public/media/scenes/cafe.webp`
- Create: `apps/preview/public/media/ambience/rain.ogg`
- Create: `apps/preview/public/media/ambience/forest.ogg`
- Create: `apps/preview/public/media/ambience/coast.ogg`
- Create: `apps/preview/public/media/ambience/cafe.ogg`
- Modify: `THIRD_PARTY_ASSETS.md`

**Interfaces:**
- Consumes: exact file paths from `sceneMedia`.
- Produces: browser-decodable local media, each below 20 MB, with the combined official media target below 70 MB.

- [ ] Download each selected source from its official asset page and save the source URL, creator, visible license, and download date before conversion.
- [ ] Use ffmpeg to select a calm 15–30 second segment, crop to 16:9, scale to 1920×1080, remove audio, and encode VP9 WebM.
- [ ] Extract a representative 1920×1080 WebP poster for every scene.
- [ ] Build each ambience from CC0 recordings, normalize to a conservative study volume, add short crossfades, and encode a 5–10 minute Ogg Vorbis loop.
- [ ] Record final SHA-256 values and all modifications in `THIRD_PARTY_ASSETS.md`.
- [ ] Verify every file using `rtk ffprobe` and verify repository files remain below GitHub's 100 MB limit.
- [ ] Commit with `assets: add licensed scene video and ambience`.

### Task 3: Responsive video scene renderer

**Files:**
- Create: `apps/preview/src/scenes/SceneArtwork.tsx`
- Create: `apps/preview/src/scenes/SceneArtwork.test.tsx`
- Modify: `apps/preview/src/App.tsx`
- Modify: `apps/preview/src/scene-art.css`

**Interfaces:**
- Consumes: `getSceneMedia(scene)` and `reduceMotion`.
- Produces: `SceneArtwork({ scene, reduceMotion })`, rendering video normally and poster/fallback when motion is reduced or video fails.

- [ ] Write failing tests for autoplay/muted/loop/playsInline attributes, scene-specific poster/video URLs, reduced-motion poster rendering, and load-error fallback.
- [ ] Run the focused tests and verify expected failures.
- [ ] Implement the isolated renderer and replace the inline `SceneArtwork` in `App.tsx`.
- [ ] Add `object-fit: cover`, scene-specific focal positions, a restrained color-grade overlay, and reduced-motion styling without changing workspace layout.
- [ ] Run focused and full preview tests.
- [ ] Commit with `feat: render licensed ambient scene videos`.

### Task 4: Cross-fading bundled ambience engine

**Files:**
- Create: `apps/preview/src/audio/mediaAmbience.ts`
- Create: `apps/preview/src/audio/mediaAmbience.test.ts`
- Modify: `apps/preview/src/App.tsx`
- Modify: `apps/preview/src/audio/whiteNoise.ts`

**Interfaces:**
- Produces: `MediaAmbienceEngine.start(scene, volume, muted)`, `update(scene, volume, muted)`, and `stop()`.
- Consumes: ambience URLs from `getSceneMedia`; falls back to `WhiteNoiseEngine` after a media decode/playback error.

- [ ] Write failing tests for scene URL selection, normalized volume, looping, scene cross-fade, mute changes, and fallback callback.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement the media engine with two HTML audio channels and a 600 ms cross-fade.
- [ ] Connect it to the existing play, mute, volume, scene switch, custom ambience, and cleanup flows in `App.tsx`.
- [ ] Keep procedural generation only as an automatic fallback and show the active scene's human-readable ambience name.
- [ ] Run focused and full preview tests.
- [ ] Commit with `feat: play distinct recorded scene ambience`.

### Task 5: Attribution UI, performance, and packaging verification

**Files:**
- Modify: `apps/preview/src/settings/SettingsPanel.tsx`
- Modify: `apps/preview/src/settings.css`
- Modify: `apps/preview/src/App.test.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: public attribution fields from `sceneMedia`.
- Produces: a read-only `素材鸣谢` settings tab with source and license links opened externally by the desktop shell/browser.

- [ ] Write a failing UI test that opens settings, selects `素材鸣谢`, and finds all four scene credits and license links.
- [ ] Run the focused test and verify expected failure.
- [ ] Implement the tab using compact ledger rows consistent with the existing settings visual system.
- [ ] Add documentation for bundled media size, offline behavior, custom local assets, and attribution maintenance.
- [ ] Run `rtk npm run preview:test -- --run` and `rtk npm run preview:build`.
- [ ] Run a desktop directory package build and verify all eight scene files and four ambience files exist inside the packaged resources.
- [ ] Inspect the preview at desktop and narrow/mobile widths, including reduced-motion mode and video-load fallback.
- [ ] Commit with `feat: expose scene media credits` and push `main`.
