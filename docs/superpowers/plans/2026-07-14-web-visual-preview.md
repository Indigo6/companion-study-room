# Web Visual Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a polished, interactive Web preview of the single-person companion study room for visual and interaction approval.

**Architecture:** Add a Vite React application under `apps/preview`, backed only by local fixture state. Components are split by user-facing responsibility; no Electron, camera permission, persistent storage, real AI request, or production timer is introduced before the visual gate is approved.

**Tech Stack:** React 19, TypeScript 5, Vite 7, CSS Modules/global design tokens, Vitest, Testing Library, Playwright screenshot checks.

## Global Constraints

- Source specification: `docs/superpowers/specs/2026-07-14-desktop-study-mvp-design.md`.
- The first deliverable is a Web visual preview; Electron integration is forbidden in this plan.
- The preview must visibly label AI and supervision as demonstration behavior.
- Provide four scenes: rain study, mist forest, sunset coast, quiet cafe.
- Provide AI companion states: idle, focus, observe, think, remind, celebrate.
- Camera preview is simulated and must not request device permission.
- Desktop Windows-style usage is primary; narrow screens receive a usable stacked layout.
- Respect keyboard focus and `prefers-reduced-motion`.
- Use only code-native CSS/SVG artwork and generated visual textures in this plan; no unlicensed external assets.

---

## File map

- `package.json`: root preview scripts and workspace declaration.
- `apps/preview/package.json`: preview dependencies and commands.
- `apps/preview/index.html`: Vite document entry.
- `apps/preview/src/main.tsx`: React mount point.
- `apps/preview/src/App.tsx`: page composition and preview-only state.
- `apps/preview/src/styles/tokens.css`: named colors, type, spacing, shadows and motion.
- `apps/preview/src/styles/global.css`: reset, background, responsive and accessibility rules.
- `apps/preview/src/data/scenes.ts`: four typed scene definitions.
- `apps/preview/src/components/SceneSwitcher.tsx`: scene choice.
- `apps/preview/src/components/StudyScene.tsx`: code-native atmospheric scene artwork.
- `apps/preview/src/components/AiCompanion.tsx`: SVG companion and state expression.
- `apps/preview/src/components/FocusTimer.tsx`: visual timer controls and presets.
- `apps/preview/src/components/AmbienceControl.tsx`: noise selection, volume and mute preview.
- `apps/preview/src/components/SupervisionCard.tsx`: explicitly simulated camera state.
- `apps/preview/src/components/AiDrawer.tsx`: demo question/answer drawer.
- `apps/preview/src/components/SessionBrief.tsx`: study goal and today summary.
- `apps/preview/src/test/setup.ts`: DOM matcher setup.
- `apps/preview/src/App.test.tsx`: preview interaction tests.
- `apps/preview/playwright.config.ts`: screenshot viewport configuration.
- `apps/preview/e2e/preview.spec.ts`: desktop and mobile visual smoke checks.

### Task 1: Preview workspace and test harness

**Files:**
- Create: `package.json`
- Create: `apps/preview/package.json`
- Create: `apps/preview/index.html`
- Create: `apps/preview/src/main.tsx`
- Create: `apps/preview/src/App.tsx`
- Create: `apps/preview/src/test/setup.ts`
- Create: `apps/preview/src/App.test.tsx`

**Interfaces:**
- Produces root commands `preview:dev`, `preview:build`, and `preview:test`.
- Produces the React `App` component consumed by all later tasks.

- [ ] **Step 1: Write the failing shell test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('study room preview', () => {
  it('identifies itself as a demonstration preview', () => {
    render(<App />);
    expect(screen.getByText('视觉预览 · 演示模式')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `rtk npm run preview:test -- --run`
Expected: FAIL because the workspace and `App` do not exist.

- [ ] **Step 3: Add the minimal Vite React workspace**

Use React/TypeScript Vite configuration, a jsdom Vitest environment, and an `App` that renders only `<p>视觉预览 · 演示模式</p>`.

- [ ] **Step 4: Run the test and confirm GREEN**

Run: `rtk npm run preview:test -- --run`
Expected: 1 passing test.

- [ ] **Step 5: Commit**

Run: `rtk git add package.json apps/preview && rtk git commit -m "build: scaffold study room preview"`

### Task 2: Visual system and four atmospheric scenes

**Files:**
- Create: `apps/preview/src/styles/tokens.css`
- Create: `apps/preview/src/styles/global.css`
- Create: `apps/preview/src/data/scenes.ts`
- Create: `apps/preview/src/components/SceneSwitcher.tsx`
- Create: `apps/preview/src/components/StudyScene.tsx`
- Modify: `apps/preview/src/App.tsx`
- Modify: `apps/preview/src/App.test.tsx`

**Interfaces:**
- Produces `SceneId = 'rain' | 'forest' | 'coast' | 'cafe'`.
- Produces `SCENES: readonly SceneDefinition[]` with `id`, `name`, `time`, `noise`, `palette`.
- Produces controlled components `SceneSwitcher({ activeScene, onChange })` and `StudyScene({ scene })`.

- [ ] **Step 1: Add a failing scene-switch test**

Render `App`, click `森林晨雾`, and assert that the scene region has accessible name `森林晨雾场景` and the status text reads `林间风声`.

- [ ] **Step 2: Confirm RED**

Run: `rtk npm run preview:test -- --run`
Expected: FAIL because scene controls are missing.

- [ ] **Step 3: Implement the design tokens and scene components**

Define an original “window between study sessions” direction: deep blue-black night, mineral green status light, warm tungsten desk light, translucent smoked glass controls, restrained Chinese serif display type. Build each scene from CSS gradients, SVG silhouettes, pseudo-element rain/mist/waves/steam, and a single shared grain layer.

- [ ] **Step 4: Confirm GREEN and build**

Run: `rtk npm run preview:test -- --run`
Expected: scene tests pass.

Run: `rtk npm run preview:build`
Expected: Vite production build exits 0.

- [ ] **Step 5: Commit**

Run: `rtk git add apps/preview && rtk git commit -m "feat: design atmospheric study scenes"`

### Task 3: AI companion and focus controls

**Files:**
- Create: `apps/preview/src/components/AiCompanion.tsx`
- Create: `apps/preview/src/components/FocusTimer.tsx`
- Create: `apps/preview/src/components/SessionBrief.tsx`
- Modify: `apps/preview/src/App.tsx`
- Modify: `apps/preview/src/App.test.tsx`

**Interfaces:**
- Produces `CompanionState = 'idle' | 'focus' | 'observe' | 'think' | 'remind' | 'celebrate'`.
- Produces `AiCompanion({ state, message })` using inline SVG without external assets.
- Produces preview callbacks `onStart`, `onPause`, `onReset`, and `onPresetChange`; they alter visible fixture state but do not implement the production timer.

- [ ] **Step 1: Add failing timer interaction tests**

Assert preset buttons `25 / 5` and `45 / 10` exist; clicking `开始专注` changes the button to `暂停一下`, companion status to `陪你专注中`, and demo label remains visible.

- [ ] **Step 2: Confirm RED**

Run: `rtk npm run preview:test -- --run`
Expected: FAIL because timer and companion controls are absent.

- [ ] **Step 3: Implement companion, timer and session brief**

Use one memorable signature: the companion is a small “desk-light spirit” whose luminous face is also the supervision status indicator. Keep timer copy literal and controls keyboard accessible.

- [ ] **Step 4: Confirm GREEN**

Run: `rtk npm run preview:test -- --run`
Expected: timer and companion tests pass.

- [ ] **Step 5: Commit**

Run: `rtk git add apps/preview && rtk git commit -m "feat: add companion and focus controls"`

### Task 4: Ambience, simulated supervision and AI drawer

**Files:**
- Create: `apps/preview/src/components/AmbienceControl.tsx`
- Create: `apps/preview/src/components/SupervisionCard.tsx`
- Create: `apps/preview/src/components/AiDrawer.tsx`
- Modify: `apps/preview/src/App.tsx`
- Modify: `apps/preview/src/App.test.tsx`

**Interfaces:**
- Produces controlled volume and mute controls without starting real audio.
- Produces supervision states `off | simulated-present | simulated-away` with the persistent label `模拟监督`.
- Produces a demo chat drawer with a fixed local response and no network request.

- [ ] **Step 1: Add failing disclosure and drawer tests**

Assert that turning supervision on still shows `模拟监督`, never requests `navigator.mediaDevices`, and shows `未调用摄像头或在线模型`. Open AI drawer, submit `怎么开始复习？`, and assert a short demo answer appears.

- [ ] **Step 2: Confirm RED**

Run: `rtk npm run preview:test -- --run`
Expected: FAIL because controls and disclosures are absent.

- [ ] **Step 3: Implement preview-only interactions**

Do not call AudioContext, MediaDevices, fetch, localStorage, or Electron APIs. Every simulated result must be named at the point where the user sees it.

- [ ] **Step 4: Confirm GREEN and run the full unit suite**

Run: `rtk npm run preview:test -- --run`
Expected: all tests pass with no console warnings.

- [ ] **Step 5: Commit**

Run: `rtk git add apps/preview && rtk git commit -m "feat: complete interactive preview controls"`

### Task 5: Responsive polish, visual review and publication

**Files:**
- Create: `apps/preview/playwright.config.ts`
- Create: `apps/preview/e2e/preview.spec.ts`
- Modify: `apps/preview/src/styles/global.css`
- Modify: `README.md`
- Modify: `server.py`

**Interfaces:**
- Produces production assets at `apps/preview/dist/`.
- Publishes the preview at `/preview/` on the existing static server.

- [ ] **Step 1: Add failing Playwright smoke checks**

At 1440×900 and 390×844, assert the page title, scene switcher, timer, demo supervision disclosure, and AI drawer trigger are visible without horizontal document overflow.

- [ ] **Step 2: Run and confirm RED or capture baseline defects**

Run: `rtk npx playwright test --config apps/preview/playwright.config.ts`
Expected: FAIL until preview server path and responsive rules are complete.

- [ ] **Step 3: Finish responsive, focus and reduced-motion rules**

Desktop keeps the single-screen composition. Narrow screens stack scene, timer, companion, and controls; the AI drawer becomes a bottom sheet. Disable ambient movement under reduced motion while retaining state changes.

- [ ] **Step 4: Build and publish**

Run: `rtk npm run preview:build`
Expected: production build exits 0.

Serve the built directory at `/preview/` through the existing project server, without changing the planning reader at `/`.

- [ ] **Step 5: Verify and visually inspect**

Run: `rtk npm run preview:test -- --run`
Expected: all unit tests pass.

Run: `rtk npx playwright test --config apps/preview/playwright.config.ts`
Expected: desktop and narrow-screen smoke checks pass.

Capture full-page screenshots for both viewports and inspect typography, scene contrast, overflow, keyboard focus, demo disclosures and reduced-motion behavior.

- [ ] **Step 6: Commit and push**

Run: `rtk git add README.md server.py package.json apps/preview && rtk git commit -m "feat: publish study room visual preview"`

Run: `rtk git push origin main`

## Gate after this plan

Stop after publishing the Web preview. Provide its URL and request visual/interaction approval. Do not begin the production timer, Web Audio, camera permission, real AI adapter, Electron main process, Windows notifications, persistence or packaging until the user approves the preview.
