# ss-10-http-store

Add an HTTP ledger store to the app

**Complexity:** medium. 3 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

A second implementation of the store interface that talks to `/api/v1` on the same origin: reads, writes,
the version on every update, and a typed error for a conflict (409) and for an unreachable server, each with
a clear message in the existing language catalogues (English and Portuguese).

Prove both stores behave the same: run the repository's behaviour tests as a **contract suite** against the
IndexedDB store and against the HTTP store backed by a test server with PostgreSQL in CI.

## Rules

- The Content-Security-Policy stays exactly as upstream builds it (`connect-src 'self'` already allows the
  same origin).
- Nothing selects this store yet; the app still uses IndexedDB.
- No offline queue: when the server is unreachable the action fails with the typed error.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: add an HTTP ledger store to the app` ``.
