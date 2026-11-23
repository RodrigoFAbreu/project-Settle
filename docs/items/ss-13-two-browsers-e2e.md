# ss-13-two-browsers-e2e

Drive two browsers against one server end to end

**Complexity:** low. 2 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

The milestone's completion criterion as a CI job: start PostgreSQL and the server image, drive two separate
headless Chromium profiles through the real app (reuse the project's CDP scripts in `app/scripts/`), and check:
a household created in one appears in the other; an edit made in one shows up after a reload in the other; a
stale edit gets the conflict message and reloads.

## Rules

- Keep the job within the CI time budget; share the built site and image with the existing jobs where it can.
- Invented data only; no real receipt.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `test: drive two browsers against one server end to end` ``.
