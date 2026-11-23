# ss-12-import-local

Import this device's data into the server

**Complexity:** medium. 3 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

A one-time, idempotent import of what a browser already holds:
- a bulk endpoint `POST /api/v1/import` that takes households, members, expenses and settlements with their
  ids and versions, writes them in one transaction, reports counts, and reports conflicts instead of
  overwriting; running it twice creates no duplicates;
- an action in Settings, shown only in server mode when this device has local data, that sends it, shows the
  result, and never deletes the local data on its own.

## Rules

- A round-trip test: the local v1/v2 fixtures imported into the server read back equal.
- Size and time limits on the request; no record contents in logs.
- M6's Settle file comes later; this slice does not depend on it.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: import this device's data into the server` ``.
