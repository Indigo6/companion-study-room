# Desktop Auto Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe automatic update checking and downloading from GitHub Releases or a generic HTTPS server, with prompted Windows installation and unsigned-macOS DMG handoff.

**Architecture:** A dependency-injected CommonJS update manager owns updater state and platform actions in Electron's main process. A narrow preload bridge streams normalized state to a focused React update notice; electron-builder and GitHub Actions produce the matching metadata and installers.

**Tech Stack:** Electron, electron-updater, electron-builder, Node test runner, React, TypeScript, Vitest, GitHub Actions

## Global Constraints

- Primary platforms are Windows NSIS and macOS; Linux auto update is out of scope.
- Support public GitHub Releases and unauthenticated generic HTTPS static hosting.
- Automatically check and download, but never interrupt a study session without a prompt.
- Windows offers “立即重启更新 / 稍后”.
- Unsigned macOS offers “打开安装包 / 稍后” and never calls in-app auto-install.
- Development and unpackaged runs never contact a real update source.
- Update failure must not block app startup or existing study features.

---

### Task 1: Update manager state machine

**Files:**
- Create: `apps/desktop/update-manager.cjs`
- Create: `tests/desktop_update_manager.test.mjs`

**Interfaces:**
- Consumes: injected `{ updater, platform, isPackaged, openPath, setTimeout, setInterval, source, allowHttpForTests }`.
- Produces: `createUpdateManager(options)` with `start()`, `check()`, `install()`, `dismiss()`, `getState()`, and `subscribe(listener)`.

- [ ] **Step 1: Write failing state-machine tests**

Test a fake EventEmitter updater for unpackaged no-op, HTTPS validation, delayed checking, duplicate-check suppression, progress normalization, error recovery, Windows `quitAndInstall()`, and macOS `openPath(downloadedFile)` without `quitAndInstall()`.

- [ ] **Step 2: Verify the tests fail**

Run: `rtk node --test tests/desktop_update_manager.test.mjs`
Expected: FAIL because `apps/desktop/update-manager.cjs` does not exist.

- [ ] **Step 3: Implement the update manager**

Export source parsing and a dependency-injected state machine. Configure `autoDownload = true`, `autoInstallOnAppQuit = false`, reject non-HTTPS generic URLs outside explicit tests, normalize emitted state to `{ status, version?, percent?, transferred?, total?, action?, message? }`, and keep detailed errors out of renderer state.

- [ ] **Step 4: Verify the manager tests pass**

Run: `rtk node --test tests/desktop_update_manager.test.mjs`
Expected: all update-manager tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/update-manager.cjs tests/desktop_update_manager.test.mjs
git commit -m "feat: add desktop update manager"
```

### Task 2: Secure Electron integration

**Files:**
- Modify: `apps/desktop/main.cjs`
- Modify: `apps/desktop/preload.cjs`
- Create: `tests/desktop_update_ipc.test.mjs`

**Interfaces:**
- Consumes: `createUpdateManager()` from Task 1 and `electron-updater.autoUpdater`.
- Produces: `window.companionUpdate` with `getState()`, `check()`, `install()`, `dismiss()`, and `onState(listener): unsubscribe`.

- [ ] **Step 1: Write failing IPC contract tests**

Load the preload in a VM with fake `contextBridge` and `ipcRenderer`; assert only fixed `update:*` channels are invoked and state listeners return cleanup functions. Test exported `registerUpdateIpc({ ipcMain, manager, getWindow })` handlers and sender-targeted state forwarding.

- [ ] **Step 2: Verify the IPC tests fail**

Run: `rtk node --test tests/desktop_update_ipc.test.mjs`
Expected: FAIL because the bridge and registration function do not exist.

- [ ] **Step 3: Wire main and preload**

Create the browser window before starting the manager, register exact IPC handlers, initialize the manager only after `app.whenReady()`, and guard updater import/use so development startup remains functional. Start only when `app.isPackaged` and source configuration is valid.

- [ ] **Step 4: Verify desktop tests pass**

Run: `rtk node --test tests/desktop_update_ipc.test.mjs tests/desktop_settings.test.mjs tests/desktop_ai.test.mjs`
Expected: all selected desktop tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/main.cjs apps/desktop/preload.cjs tests/desktop_update_ipc.test.mjs
git commit -m "feat: expose secure desktop update controls"
```

### Task 3: Non-blocking update notice

**Files:**
- Create: `apps/preview/src/updates/UpdateNotice.tsx`
- Create: `apps/preview/src/updates/UpdateNotice.test.tsx`
- Create: `apps/preview/src/updates/update-notice.css`
- Modify: `apps/preview/src/App.tsx`

**Interfaces:**
- Consumes: `window.companionUpdate` and normalized `UpdateState`.
- Produces: accessible status notice with progress and platform-specific actions.

- [ ] **Step 1: Write failing React tests**

Cover hidden idle state, downloading percentage, Windows “立即重启更新”, macOS “打开安装包”, “稍后”, safe error copy, action invocation, and listener cleanup.

- [ ] **Step 2: Verify the component tests fail**

Run: `rtk npm run preview:test -- --run apps/preview/src/updates/UpdateNotice.test.tsx`
Expected: FAIL because `UpdateNotice.tsx` does not exist.

- [ ] **Step 3: Implement and mount the notice**

Define the bridge and state types in the update module, subscribe on mount, call `getState()` for the initial value, render `role="status"` for passive states and an accessible dialog for downloaded actions, then import the focused stylesheet and mount once near the root of `App`.

- [ ] **Step 4: Verify UI tests pass**

Run: `rtk npm run preview:test -- --run apps/preview/src/updates/UpdateNotice.test.tsx apps/preview/src/App.test.tsx`
Expected: all selected Vitest tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/preview/src/updates apps/preview/src/App.tsx
git commit -m "feat: show desktop update progress and prompt"
```

### Task 4: Packaging, release metadata, and documentation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/build-desktop.yml`
- Modify: `.env.example`
- Modify: `README.md`
- Create: `tests/desktop_packaging.test.mjs`

**Interfaces:**
- Consumes: release source environment values and electron-builder publish configuration.
- Produces: NSIS + blockmap + `latest.yml`; DMG + ZIP + `latest-mac.yml`; GitHub Release upload on version tags and complete generic-host artifacts.

- [ ] **Step 1: Write failing packaging assertions**

Assert `electron-updater` is a production dependency, mac targets include `dmg` and `zip`, NSIS remains enabled, update metadata is included in workflow artifacts, and the workflow has a tag-triggered GitHub Release upload with `contents: write` only for the release job.

- [ ] **Step 2: Verify packaging tests fail**

Run: `rtk node --test tests/desktop_packaging.test.mjs`
Expected: FAIL on missing dependency, ZIP target, metadata artifacts, and release job.

- [ ] **Step 3: Update dependency, builder config, CI, and docs**

Install `electron-updater` as a runtime dependency. Configure deterministic `artifactName` values and platform targets. Document `COMPANION_UPDATE_PROVIDER=github|generic`, GitHub owner/repo values, `COMPANION_UPDATE_URL=https://...`, public-source limitation, version-tag release procedure, generic directory layout, and unsigned macOS behavior.

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
git add package.json package-lock.json .github/workflows/build-desktop.yml .env.example README.md tests/desktop_packaging.test.mjs
git commit -m "build: publish desktop auto-update artifacts"
```
