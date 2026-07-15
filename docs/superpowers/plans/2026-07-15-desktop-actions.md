# Desktop Installer Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manually triggered GitHub Actions workflow that produces downloadable Windows and macOS desktop installers.

**Architecture:** One workflow contains three native-platform jobs. Each job installs locked dependencies, runs tests, invokes electron-builder for its platform and uploads only installer artifacts.

**Tech Stack:** GitHub Actions, Node.js 22, npm, electron-builder, Node test runner.

## Global Constraints

- Builds are unsigned internal-test artifacts.
- Windows output is x64 NSIS; macOS outputs cover arm64 and x64 DMG.
- No AI provider secrets are required or embedded.

### Task 1: Workflow contract and implementation

**Files:**
- Create: `tests/desktop_workflow.test.mjs`
- Create: `.github/workflows/build-desktop.yml`

**Interfaces:**
- Consumes: `npm run preview:test`, electron-builder configuration in `package.json`.
- Produces: manually triggered `desktop-windows-x64`, `desktop-macos-arm64`, and `desktop-macos-x64` artifacts.

- [ ] Write a Node structure test that requires `workflow_dispatch`, all three runners, test execution, platform build commands and artifact upload.
- [ ] Run `rtk test node --test tests/desktop_workflow.test.mjs` and verify it fails because the workflow does not exist.
- [ ] Add the minimal workflow satisfying the contract.
- [ ] Run the structure test, full test suite and production build.
- [ ] Commit and push to `main`, then inspect the GitHub Actions run availability.
