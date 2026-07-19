# Windows Installer Options and Portable Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add selectable per-user/per-machine/custom-path Windows installation and a portable GitHub artifact that only notifies users about new releases.

**Architecture:** electron-builder's assisted NSIS options provide install scope and directory selection, while the Windows build also emits a separately named portable target. A small GitHub release checker implements the same updater event contract without downloading, and the existing manager/UI adds an `open-download` action handled only by the main process.

**Tech Stack:** Electron, electron-builder NSIS/portable, Node test runner, React, Vitest, GitHub Actions

## Global Constraints

- Installed builds retain automatic download and prompted restart installation.
- Portable builds never download updates or call `quitAndInstall()`.
- Portable update links are restricted to the public `Indigo6/companion-study-room` GitHub Releases pages.
- Assisted NSIS supports current-user, all-users, and custom directory choices.
- Windows CI and tag releases include both installer and portable EXEs.

---

### Task 1: Assisted NSIS and portable artifacts

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/build-desktop.yml`
- Modify: `tests/desktop_packaging.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Produces: `build.nsis` with `oneClick: false`, `perMachine: false`, `allowToChangeInstallationDirectory: true`; Windows targets `nsis` and `portable` with distinct artifact names.

- [ ] **Step 1: Write failing packaging assertions**

Assert the three NSIS settings, both Windows targets, `portable` in CI build command, and separate `release/*portable*.exe` Artifact coverage.

- [ ] **Step 2: Verify RED**

Run: `rtk node --test tests/desktop_packaging.test.mjs tests/desktop_workflow.test.mjs`
Expected: FAIL on missing assisted NSIS and portable settings.

- [ ] **Step 3: Implement packaging configuration**

Set the exact NSIS options, use target-specific `artifactName` so installer and portable EXEs cannot collide, build `--win nsis portable --x64`, and document default paths, UAC, custom directory, and portable behavior.

- [ ] **Step 4: Verify GREEN**

Run: `rtk node --test tests/desktop_packaging.test.mjs tests/desktop_workflow.test.mjs`
Expected: all selected tests PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/build-desktop.yml tests/desktop_packaging.test.mjs tests/desktop_workflow.test.mjs README.md
git commit -m "build: add assisted installer and portable release"
```

### Task 2: Portable release notification

**Files:**
- Create: `apps/desktop/portable-update-checker.cjs`
- Modify: `apps/desktop/main.cjs`
- Modify: `apps/desktop/update-manager.cjs`
- Modify: `apps/preview/src/updates/UpdateNotice.tsx`
- Modify: `apps/preview/src/updates/UpdateNotice.test.tsx`
- Create: `tests/desktop_portable_update.test.mjs`

**Interfaces:**
- Produces: `createPortableUpdateChecker({ currentVersion, owner, repo, fetch })`, emitting `update-available` with `{ version, releaseUrl, portable: true }` and never emitting download progress/downloaded.
- Extends: normalized manager state with `{ status: 'available', version, action: 'open-download' }`; `install()` opens only the stored validated Release URL in portable mode.

- [ ] **Step 1: Write failing checker and UI tests**

Test newer stable GitHub releases, equal version, prerelease filtering, trusted URL validation, absence of download/install calls, “前往下载” rendering, install action invocation, and “稍后”.

- [ ] **Step 2: Verify RED**

Run: `rtk node --test tests/desktop_portable_update.test.mjs && rtk npm run preview:test -- --run apps/preview/src/updates/UpdateNotice.test.tsx`
Expected: FAIL because checker and `open-download` state do not exist.

- [ ] **Step 3: Implement portable mode**

Detect `PORTABLE_EXECUTABLE_FILE`, instantiate the checker instead of `electron-updater`, pass a main-process `openExternal` dependency, retain the validated release URL in the manager, and render the portable action copy. Do not expose a URL argument over IPC.

- [ ] **Step 4: Run full verification**

Run: `rtk node --test tests/*.test.mjs`
Expected: all Node tests PASS.

Run: `rtk npm run preview:test -- --run`
Expected: all Vitest tests PASS.

Run: `rtk python3 -m unittest tests/test_server.py tests/test_ai_proxy.py`
Expected: all Python tests PASS.

Run: `rtk npm run preview:build`
Expected: Vite build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop apps/preview/src/updates tests/desktop_portable_update.test.mjs
git commit -m "feat: notify portable users about new releases"
```
