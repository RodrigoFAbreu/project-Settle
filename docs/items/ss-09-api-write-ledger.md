# ss-09-api-write-ledger

Add write endpoints for expenses and settlements

**Complexity:** medium. 3 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

Save and delete expenses and settlements with the contract of `saveExpense`, `deleteExpense`,
`saveSettlement` and `deleteSettlement`: every member an expense or payment names must exist in the
household, members the save dialog adds are written in the same transaction, and a stale `version` gets 409.

## Rules

- One database transaction per action; real PostgreSQL in the tests.
- Mirror the cases in `app/src/data/repository.test.ts` and `settlements.test.ts` so the same behaviour is
  proven on the server.
- The balances engine stays derived and client-side; do not store balances.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: add write endpoints for expenses and settlements` ``.
