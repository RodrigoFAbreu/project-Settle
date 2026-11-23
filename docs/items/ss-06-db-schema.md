# ss-06-db-schema

Add the PostgreSQL schema and migration runner

**Complexity:** medium. 3 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

The ledger's tables and a tested migration runner in `server/`:
- tables for households, members, expenses and settlements that mirror the ADR 0005 stores, with each
  record's format version (`v`), a per-record `version` for editing, and timestamps; client-generated ids;
- numbered, transactional migration steps run at startup or by a command; a failed step leaves the previous
  schema intact;
- tests against a real PostgreSQL (a service container in CI): the app's `app/src/data/fixtures/v1.json` and
  `v2.json` records load into the tables and read back equal, an upgrade from the first schema version keeps
  every row, and a failing step rolls back.

## Rules

- No endpoints in this slice. No authentication; leave room for an owner column only if ADR 0007 says so.
- Any later schema change needs a migration step and an upgrade check against the previous version's data
  (a fresh install skips upgrades).

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: add the server's PostgreSQL schema and migration runner` ``.
