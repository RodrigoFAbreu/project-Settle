# ss-07-api-read

Serve the ledger's read endpoints

**Complexity:** low. 2 checkpoint(s) at most, one milestone, one squash-merged pull request, releasable alone. Part of M5.5 (`docs/items/milestone-5-5.md`).

## What to do

Read-only `GET /api/v1/...` endpoints with the semantics of the store interface's reads: list and get
households, list members of a household, list and get expenses (with the filters `listExpenses` offers and
`expensesWithReceiptKey`), list and get settlements. Responses are built through the shared readers so the
app's validation and the server's agree, and carry each record's version.

## Rules

- Real PostgreSQL in the tests. No writes in this slice.
- An unreadable stored record is skipped and counted, never deleted or rewritten, as in ADR 0005.
- No authentication; the deployment is private-network only.

Plans carry the rules in `CLAUDE.md` ("Running under the Controller"). Authentication is out of scope until a later item: nothing trusts an identity yet and the deployment stays on a private network. Real receipts never enter Git.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `feat: serve the ledger's read endpoints` ``.
