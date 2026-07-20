# Silent Update Check Design

## Goal

Keep automatic desktop update checks in the background and notify the user only after a newer version has been confirmed.

## Scope

This change affects only the update notice UI. The existing update manager, platform-specific checkers, startup delay, retry interval, downloading, verification, and installation behavior remain unchanged.

## Behavior

- Packaged Windows and macOS applications continue checking 15 seconds after startup and every 6 hours afterward.
- The notice renders nothing for `idle`, `checking`, and `error` states.
- A successful check with no newer version remains silent.
- Windows NSIS and macOS display a notice after `update-available`; automatic download progress and the downloaded/install prompt remain visible.
- Windows Portable displays its existing “go to download” notice after `update-available`.
- Check and download failures remain available in the main-process update state for diagnostics but never produce a user-facing popup.

## Architecture

`createUpdateManager` continues to own the complete update state machine, including `checking` and `error`. `UpdateNotice` acts as the presentation filter: non-actionable states are hidden, while `available`, `downloading`, and `downloaded` states are rendered using the existing UI.

Keeping errors in the manager preserves diagnostic information and avoids changing IPC contracts or platform-specific updater behavior.

## Testing

Update the `UpdateNotice` component tests first and verify they fail against the current UI. The tests will prove that:

- `checking` renders no notice;
- an emitted `error` renders no notice;
- an available Portable update still renders the download action;
- downloading and downloaded notices continue to render.

Run the focused component tests, the full preview test suite, and the production preview build before committing the implementation.

## Out of Scope

- Changing the GitHub Release publishing workflow.
- Adding a manual “check for updates” settings control.
- Adding update error logs, telemetry, retry controls, or user-facing diagnostics.
- Changing automatic download or installation behavior after a new version is found.
