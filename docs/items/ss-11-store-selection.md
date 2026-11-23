# ss-11-store-selection

Let a self-hosted deployment choose the server store

**Complexity:** low. 2 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

The same release must run both ways. The server serves a small config (for example `GET /api/config`) that
says which store to use; the static build serves none and keeps IndexedDB. In server mode:
- the ledger goes through the HTTP store, and Settings says where the data lives;
- an unreachable server and a version conflict each show a clear, recoverable message;
- theme, language, region, the bill being edited, the receipt summary and the last-household pointer stay per
  device.

## Rules

- No build-time flag that forks the release ZIP.
- Receipt reading stays in the browser; only the structured result is saved. Images are never uploaded.
- Update the README's storage section and ADR 0007's status.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: let a self-hosted deployment choose the server store` ``.
