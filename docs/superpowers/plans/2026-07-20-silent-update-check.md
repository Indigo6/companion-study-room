# Silent Update Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide automatic update checking and failure states while preserving notifications that follow confirmation of a newer version.

**Architecture:** Keep `createUpdateManager` and its IPC state contract unchanged. Make `UpdateNotice` the presentation boundary that renders nothing for `idle`, `checking`, and `error`, while retaining the existing UI for `available`, `downloading`, and `downloaded`.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Vite

## Global Constraints

- Packaged Windows and macOS applications continue checking 15 seconds after startup and every 6 hours afterward.
- Check failures remain in the main-process update state for diagnostics.
- Automatic download and platform-specific installation behavior remain unchanged.
- No new dependency or IPC contract is introduced.

---

### Task 1: Hide non-actionable update states

**Files:**
- Modify: `apps/preview/src/updates/UpdateNotice.test.tsx`
- Modify: `apps/preview/src/updates/UpdateNotice.tsx`

**Interfaces:**
- Consumes: `CompanionUpdateBridge.getState()` and `CompanionUpdateBridge.onState()` values of type `UpdateState`.
- Produces: `UpdateNotice`, which renders no DOM for `idle`, `checking`, and `error` and preserves existing rendering for `available`, `downloading`, and `downloaded`.

- [ ] **Step 1: Replace the error-popup test with failing silent-state tests**

Replace the final test in `UpdateNotice.test.tsx` with:

```tsx
  it.each([
    { status: 'checking' } as const,
    { status: 'error', message: '更新暂时不可用，请稍后重试' } as const,
  ])('stays hidden when the background state is $status', async initial => {
    const { api } = bridge(initial);
    const { container } = render(<UpdateNotice bridge={api}/>);
    await waitFor(() => expect(api.getState).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('hides a background error emitted after startup and cleans up its subscription', async () => {
    const { api, emit, unsubscribe } = bridge({ status: 'idle' });
    const view = render(<UpdateNotice bridge={api}/>);
    await waitFor(() => expect(api.onState).toHaveBeenCalled());
    emit({ status: 'error', message: '更新暂时不可用，请稍后重试' });
    await waitFor(() => expect(view.container).toBeEmptyDOMElement());
    view.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
rtk npm run preview:test -- --run apps/preview/src/updates/UpdateNotice.test.tsx
```

Expected: FAIL because `checking` renders “正在检查更新…” and `error` renders “更新暂时不可用，请稍后重试”. Existing available, downloading, and downloaded tests remain green.

- [ ] **Step 3: Implement the presentation filter**

In `UpdateNotice.tsx`, replace the current early return:

```tsx
  if (!bridge || state.status === 'idle') return null;
```

with:

```tsx
  if (!bridge || state.status === 'idle' || state.status === 'checking' || state.status === 'error') return null;
```

Delete the later `state.status === 'error'` rendering branch. Replace the final fallback with the confirmed-new-version notice:

```tsx
  return <section className="update-notice" role="status"><span>{`发现新版本${state.version ? ` ${state.version}` : ''}，准备下载…`}</span></section>;
```

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
rtk npm run preview:test -- --run apps/preview/src/updates/UpdateNotice.test.tsx
```

Expected: the `UpdateNotice` test file passes, including silent initial and emitted error states.

- [ ] **Step 5: Run full verification**

Run:

```bash
rtk npm run preview:test -- --run
rtk npm run preview:build
rtk git diff --check
```

Expected: all preview tests pass, the Vite production build exits successfully, and `git diff --check` produces no output.

- [ ] **Step 6: Commit and push the implementation**

```bash
rtk git add apps/preview/src/updates/UpdateNotice.test.tsx apps/preview/src/updates/UpdateNotice.tsx docs/superpowers/plans/2026-07-20-silent-update-check.md
rtk git commit -m "fix: keep update checks silent"
rtk git push origin main
```

Expected: the implementation commit is created and `main` is pushed without adding the unrelated MP3 files in the repository root.
