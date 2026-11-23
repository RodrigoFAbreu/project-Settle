# ss-08-api-write-households

Add write endpoints for households and members

**Complexity:** low. 2 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

Create, rename, archive and restore households, and add, rename, mark as left and delete members, with the
contract `repository.ts` enforces today (the member limit, a member named by an expense cannot be deleted,
the typed errors). Each write checks the record's `version`: a stale write is rejected with 409 and the
current record, and a client-generated id makes a repeated create idempotent.

## Rules

- Each user action is one database transaction with its integrity checks inside it (as ADR 0005 does for
  IndexedDB).
- Real PostgreSQL in the tests, including two writers racing on one record.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: add write endpoints for households and members` ``.
